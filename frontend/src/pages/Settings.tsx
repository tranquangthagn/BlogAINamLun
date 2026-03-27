import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Badge,
  Button,
  Card,
  DatePicker,
  Input,
  InputNumber,
  Switch,
  Tag,
  TimePicker,
  Typography,
  message,
} from 'antd';
import {
  Clock3,
  Flame,
  Instagram,
  PlayCircle,
  Save,
  ShoppingBag,
  Sparkles,
  Wand2,
} from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import {
  getAutomationSettings,
  listAutomationHistory,
  postAutomationNow,
  previewAutomationCandidates,
  updateAutomationSettings,
} from '../api/automation';
import {
  automationSourceLabels,
  createDefaultAutomationSettings,
  createScheduleSummary,
  createStatusText,
  type AutomationSettings,
  type AutomationTone,
  type GeneratedPostHistoryItem,
  type ScheduleMode,
  type TrendRangeMode,
  type TrendSource,
} from '../data/automationSettings';

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;

const AUTOMATION_EVENT = 'blog-ai-automation-updated';

const SOURCE_META: Array<{
  value: TrendSource;
  accent: string;
  icon: React.ReactNode;
}> = [
  { value: 'facebook', accent: '#6aa1ff', icon: <span style={{ fontWeight: 700 }}>f</span> },
  { value: 'tiktok', accent: '#111111', icon: <PlayCircle size={16} /> },
  { value: 'instagram', accent: '#ff5fa2', icon: <Instagram size={16} /> },
  { value: 'shopee', accent: '#ff7b29', icon: <ShoppingBag size={16} /> },
  { value: 'threads', accent: '#4d4d4d', icon: <span style={{ fontWeight: 700 }}>@</span> },
];

const RANGE_OPTIONS: Array<{ value: TrendRangeMode; label: string; caption: string }> = [
  { value: 'day', label: 'Theo ngày', caption: 'Ưu tiên tín hiệu mới nhất trong ngày.' },
  { value: 'week', label: 'Theo tuần', caption: 'Cân bằng giữa mới và ổn định.' },
  { value: 'quarter', label: 'Theo quý', caption: 'Tìm mô-típ dài hơi hơn một chút.' },
  { value: 'custom', label: 'Custom ngày', caption: 'Tự chọn chính xác khoảng ngày muốn nhìn.' },
];

const SCHEDULE_OPTIONS: Array<{ value: ScheduleMode; label: string; caption: string }> = [
  {
    value: 'fixed_time',
    label: 'Theo giờ cố định',
    caption: 'Đến giờ là mỗi nguồn chạy 3 bài riêng cho thời trang, sức khỏe và mẹo vặt.',
  },
  {
    value: 'interval_minutes',
    label: 'Mấy phút một lần',
    caption: 'Mỗi chu kỳ nền sẽ xếp từng batch nhỏ để đăng dần từng bài khi xong.',
  },
];

const TONE_OPTIONS: Array<{ value: AutomationTone; label: string; caption: string }> = [
  { value: 'gan_gui', label: 'Gần gũi', caption: 'Đáng yêu, mềm, gần như đang thủ thỉ với bạn.' },
  { value: 'bat_trend', label: 'Bắt trend', caption: 'Nhanh hơn, tươi hơn, nhưng vẫn giữ chất nữ trẻ.' },
  { value: 'thuc_dung', label: 'Thực dụng', caption: 'Ưu tiên mẹo rõ ràng và dễ áp dụng ngay.' },
  { value: 'trung_tinh', label: 'Trung tính', caption: 'Giữ nhịp an toàn, sạch và dễ dùng lại.' },
];

type RuntimeStatusTone = 'idle' | 'ready' | 'warning' | 'working';

type RuntimeStatus = {
  badge: string;
  title: string;
  detail: string;
  tone: RuntimeStatusTone;
};

const DEFAULT_RUNTIME_STATUS: RuntimeStatus = {
  badge: 'Đang chờ lệnh',
  title: 'AI runtime sẵn sàng',
  detail: 'Backend đã kết nối. Bạn có thể lưu cài đặt, dựng preview hoặc đẩy batch vào hàng đợi nền.',
  tone: 'idle',
};

const PREVIEW_IN_PROGRESS_STATUS: RuntimeStatus = {
  badge: 'Đang dựng preview',
  title: 'AI đang kiểm tra tín hiệu mới',
  detail: 'Đang gọi backend và Gemini để dựng batch xem trước mới. Nếu mất gần một phút thì vẫn là bình thường.',
  tone: 'working',
};

const POST_NOW_IN_PROGRESS_STATUS: RuntimeStatus = {
  badge: 'Đang đẩy hàng đợi',
  title: 'AI đang chuẩn bị batch đăng bài',
  detail: 'Đang đồng bộ cài đặt và đẩy batch mới vào hàng đợi nền. Xong bước nào backend sẽ cập nhật bước đó.',
  tone: 'working',
};

function emitAutomationChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTOMATION_EVENT));
  }
}

function sourceActive(settings: AutomationSettings, source: TrendSource): boolean {
  return settings.sources.includes(source);
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function buildRuntimeStatusFromError(error: unknown): RuntimeStatus {
  const detail = error instanceof Error ? error.message : 'Chưa thể kết nối tới backend automation.';

  if (detail.includes('API key')) {
    return {
      badge: 'Cần cấu hình',
      title: 'Gemini chưa được bật',
      detail,
      tone: 'warning',
    };
  }

  if (detail.includes('het quota') || detail.includes('quota')) {
    return {
      badge: 'Tạm giới hạn',
      title: 'Gemini đang hết quota',
      detail,
      tone: 'warning',
    };
  }

  return {
    badge: 'Cần kiểm tra',
    title: 'AI runtime gặp sự cố',
    detail,
    tone: 'warning',
  };
}

const cardMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

function groupPreviewBySource(items: GeneratedPostHistoryItem[]) {
  const groups = new Map<TrendSource, GeneratedPostHistoryItem[]>();
  for (const item of items) {
    const source = item.source as TrendSource;
    const next = groups.get(source) ?? [];
    next.push(item);
    groups.set(source, next);
  }
  return Array.from(groups.entries());
}

const Settings: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [settings, setSettings] = useState<AutomationSettings>(createDefaultAutomationSettings());
  const [history, setHistory] = useState<GeneratedPostHistoryItem[]>([]);
  const [previewCandidates, setPreviewCandidates] = useState<GeneratedPostHistoryItem[]>([]);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>(DEFAULT_RUNTIME_STATUS);

  const loadBackendState = async () => {
    try {
      const [nextSettings, nextHistory] = await Promise.all([
        getAutomationSettings(),
        listAutomationHistory(),
      ]);
      setSettings(nextSettings);
      setHistory(nextHistory);
      setRuntimeStatus(DEFAULT_RUNTIME_STATUS);
    } catch {
      setSettings(createDefaultAutomationSettings());
      setHistory([]);
      setRuntimeStatus({
        badge: 'Mất kết nối',
        title: 'Chưa đọc được backend',
        detail: 'Đang dùng chế độ an toàn. Hãy kiểm tra API nếu bạn muốn tạo bài thật.',
        tone: 'warning',
      });
    }
  };

  useEffect(() => {
    void loadBackendState();
  }, []);

  const validation = useMemo(() => {
    if (settings.sources.length === 0) {
      return { ok: false, message: 'Hãy chọn ít nhất một nguồn để AI lấy trend.' };
    }
    if (settings.scheduleMode === 'fixed_time' && !settings.postTime) {
      return { ok: false, message: 'Bạn cần chọn giờ đăng bài.' };
    }
    if (settings.scheduleMode === 'interval_minutes' && settings.intervalMinutes < 1) {
      return { ok: false, message: 'Số phút chu kỳ phải lớn hơn 0.' };
    }
    if (settings.trendRangeMode === 'custom' && (!settings.customDateRange.start || !settings.customDateRange.end)) {
      return { ok: false, message: 'Bạn cần chọn đủ ngày bắt đầu và kết thúc cho phạm vi custom.' };
    }
    return { ok: true, message: 'Cấu hình hợp lệ.' };
  }, [settings]);

  const statusText = useMemo(() => createStatusText(settings), [settings]);
  const scheduleSummary = useMemo(() => createScheduleSummary(settings), [settings]);
  const postedCount = useMemo(() => history.filter((item) => item.posted).length, [history]);
  const sourceSummary = useMemo(
    () =>
      settings.sources.length > 0
        ? settings.sources.map((source) => automationSourceLabels[source]).join(', ')
        : 'Chưa chọn nguồn',
    [settings.sources],
  );
  const previewGroups = useMemo(() => groupPreviewBySource(previewCandidates), [previewCandidates]);

  const customRangeValue: [Dayjs, Dayjs] | null =
    settings.customDateRange.start && settings.customDateRange.end
      ? [dayjs(settings.customDateRange.start), dayjs(settings.customDateRange.end)]
      : null;

  const updateSettings = (next: AutomationSettings) => {
    setSettings(next);
  };

  const refreshHistory = async () => {
    const nextHistory = await listAutomationHistory();
    setHistory(nextHistory);
    return nextHistory;
  };

  const toggleSource = (source: TrendSource) => {
    updateSettings({
      ...settings,
      sources: sourceActive(settings, source)
        ? settings.sources.filter((item) => item !== source)
        : [...settings.sources, source],
    });
  };

  const handleSaveSettings = async () => {
    try {
      const nextSettings = await updateAutomationSettings(settings);
      setSettings(nextSettings);
      setRuntimeStatus({
        badge: 'Đã đồng bộ',
        title: 'Cấu hình đã được lưu',
        detail: 'Lượt preview và post-now tiếp theo sẽ dùng đúng settings mới này.',
        tone: 'ready',
      });
      emitAutomationChanged();
      messageApi.success('Đã lưu cài đặt automation.');
    } catch (error) {
      setRuntimeStatus(buildRuntimeStatusFromError(error));
      messageApi.warning(error instanceof Error ? error.message : 'Chưa thể lưu cài đặt.');
    }
  };

  const handleGeneratePreview = async () => {
    try {
      setRuntimeStatus(PREVIEW_IN_PROGRESS_STATUS);
      const nextBatch = await previewAutomationCandidates(settings);
      setPreviewCandidates(nextBatch.items);
      setRuntimeStatus({
        badge: 'Preview OK',
        title: 'AI vừa dựng batch preview mới',
        detail: `Đã tạo ${nextBatch.items.length} bài nháp theo cấu trúc 3 bài cho mỗi nguồn đang bật.`,
        tone: 'ready',
      });
      messageApi.success(`Đã tạo ${nextBatch.items.length} bài nháp xem trước.`);
    } catch (error) {
      setRuntimeStatus(buildRuntimeStatusFromError(error));
      messageApi.warning(error instanceof Error ? error.message : 'Chưa thể tạo batch preview.');
    }
  };

  const handlePostNow = async () => {
    try {
      setRuntimeStatus(POST_NOW_IN_PROGRESS_STATUS);
      const nextSettings = await updateAutomationSettings(settings);
      const receipt = await postAutomationNow();
      setSettings(nextSettings);
      setRuntimeStatus({
        badge: 'Đã vào hàng đợi',
        title: 'Batch đang được xử lý dần',
        detail: `Đã xếp ${receipt.queuedCount} bài vào hàng đợi nền. Xong bài nào backend sẽ đăng bài đó.`,
        tone: 'ready',
      });
      emitAutomationChanged();
      messageApi.success(`Đã xếp ${receipt.queuedCount} bài vào hàng đợi tự động đăng.`);

      for (let attempt = 0; attempt < 4; attempt += 1) {
        await wait(900);
        await refreshHistory();
      }
    } catch (error) {
      setRuntimeStatus(buildRuntimeStatusFromError(error));
      messageApi.warning(error instanceof Error ? error.message : 'Chưa thể đẩy batch vào hàng đợi.');
    }
  };

  return (
    <div className="settings-page">
      {contextHolder}

      <motion.section
        className="settings-hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="settings-hero__copy">
          <Tag className="settings-pill" color={settings.enabled ? 'green' : 'default'}>
            {settings.enabled ? 'Đang tự động chạy' : 'Đang nghỉ'}
          </Tag>
          <Title level={1} className="settings-hero__title">
            Tự động đăng bài
          </Title>
          <Paragraph className="settings-hero__description">
            Studio điều khiển AI cho nữ trẻ 18-25: mỗi nguồn trend sẽ chạy 3 bài riêng cho thời
            trang, sức khỏe và mẹo vặt, với tone đáng yêu gần gũi và ảnh lấy từ nguồn trước.
          </Paragraph>
          <div className="settings-hero__status">
            <Badge status={settings.enabled ? 'processing' : 'default'} />
            <Text>{statusText}</Text>
          </div>
        </div>

        <div className="settings-hero__toggle">
          <div className="settings-hero__toggle-label">
            <Sparkles size={20} />
            <span>Bật chế độ auto-post</span>
          </div>
          <Switch
            checked={settings.enabled}
            onChange={(checked) => updateSettings({ ...settings, enabled: checked })}
            className="settings-switch"
          />
          <Paragraph className="settings-hero__hint">
            Xong bài nào là backend đăng bài đó, không cần đợi đủ cả batch.
          </Paragraph>
        </div>
      </motion.section>

      <div className="settings-main">
        <div className="settings-flow">
          <motion.div {...cardMotion} transition={{ delay: 0.05 }}>
            <Card className="settings-card">
              <div className="settings-card__header">
                <Clock3 size={18} />
                <Title level={3}>Lịch đăng bài</Title>
              </div>
              <Paragraph className="settings-muted">
                Chọn nhịp để backend xếp batch 3 bài cho từng nguồn đang bật.
              </Paragraph>

              <div className="range-grid">
                {SCHEDULE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`range-card ${settings.scheduleMode === option.value ? 'active' : ''}`}
                    onClick={() => updateSettings({ ...settings, scheduleMode: option.value })}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.caption}</span>
                  </button>
                ))}
              </div>

              {settings.scheduleMode === 'fixed_time' ? (
                <div className="schedule-control-wrap">
                  <TimePicker
                    value={dayjs(settings.postTime, 'HH:mm')}
                    format="HH:mm"
                    size="large"
                    onChange={(value) =>
                      updateSettings({
                        ...settings,
                        postTime: value ? value.format('HH:mm') : settings.postTime,
                      })
                    }
                  />
                </div>
              ) : (
                <div className="schedule-control-wrap schedule-control-wrap--interval">
                  <InputNumber
                    min={1}
                    max={720}
                    value={settings.intervalMinutes}
                    size="large"
                    addonAfter="phút"
                    onChange={(value) =>
                      updateSettings({
                        ...settings,
                        intervalMinutes: typeof value === 'number' ? value : settings.intervalMinutes,
                      })
                    }
                  />
                </div>
              )}

              <div className="settings-summary-box">{scheduleSummary}</div>
            </Card>
          </motion.div>

          <motion.div {...cardMotion} transition={{ delay: 0.1 }}>
            <Card className="settings-card">
              <div className="settings-card__header">
                <Flame size={18} />
                <Title level={3}>Nguồn trend</Title>
              </div>
              <Paragraph className="settings-muted">
                Mỗi nguồn đang bật sẽ sinh 3 bài riêng theo `fashion`, `health`, `tips`.
              </Paragraph>

              <div className="source-grid">
                {SOURCE_META.map((source) => {
                  const active = sourceActive(settings, source.value);

                  return (
                    <button
                      key={source.value}
                      type="button"
                      className={`source-card ${active ? 'active' : ''}`}
                      style={{ '--source-accent': source.accent } as React.CSSProperties}
                      onClick={() => toggleSource(source.value)}
                    >
                      <span className="source-card__icon">{source.icon}</span>
                      <span>{automationSourceLabels[source.value]}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          <motion.div {...cardMotion} transition={{ delay: 0.15 }}>
            <Card className="settings-card">
              <div className="settings-card__header">
                <Wand2 size={18} />
                <Title level={3}>Phạm vi dữ liệu</Title>
              </div>
              <Paragraph className="settings-muted">
                Giữ phạm vi đủ hẹp để AI bám trend tốt hơn và tránh loãng tín hiệu.
              </Paragraph>

              <div className="range-grid">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`range-card ${settings.trendRangeMode === option.value ? 'active' : ''}`}
                    onClick={() => updateSettings({ ...settings, trendRangeMode: option.value })}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.caption}</span>
                  </button>
                ))}
              </div>

              {settings.trendRangeMode === 'custom' && (
                <motion.div
                  className="custom-range-wrap"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <RangePicker
                    size="large"
                    value={customRangeValue}
                    onChange={(values) =>
                      updateSettings({
                        ...settings,
                        customDateRange: {
                          start: values?.[0] ? values[0].format('YYYY-MM-DD') : null,
                          end: values?.[1] ? values[1].format('YYYY-MM-DD') : null,
                        },
                      })
                    }
                  />
                </motion.div>
              )}
            </Card>
          </motion.div>
        </div>

        <aside className="settings-aside">
          <motion.div {...cardMotion} transition={{ delay: 0.14 }}>
            <Card className="settings-card settings-status-card">
              <div className="settings-card__header">
                <Sparkles size={18} />
                <Title level={3}>Tổng quan AI</Title>
              </div>
              <Paragraph className="settings-muted">
                Một góc nhìn nhanh để biết AI đang chạy theo nhịp nào và mỗi nguồn đang tạo bao
                nhiêu bài.
              </Paragraph>

              <div className="settings-summary-box">
                <strong>{statusText}</strong>
              </div>

              <div className="settings-status-card__stack">
                <div className="settings-status-card__line">
                  <span>Lịch hiện tại</span>
                  <strong>{scheduleSummary}</strong>
                </div>
                <div className="settings-status-card__line">
                  <span>Nguồn đang bật</span>
                  <strong>{sourceSummary}</strong>
                </div>
                <div className="settings-status-card__line">
                  <span>Batch mỗi lượt</span>
                  <strong>{settings.sources.length * 3} bài</strong>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div {...cardMotion} transition={{ delay: 0.18 }}>
            <Card className="settings-card settings-runtime-card">
              <div className="settings-card__header">
                <Sparkles size={18} />
                <Title level={3}>AI runtime</Title>
              </div>
              <Paragraph className="settings-muted">
                Trạng thái phản hồi gần nhất từ backend Gemini để bạn biết nên đợi, kiểm tra quota
                hay tiếp tục.
              </Paragraph>
              <div className={`settings-runtime-card__badge is-${runtimeStatus.tone}`}>{runtimeStatus.badge}</div>
              <div className="settings-runtime-card__content">
                <strong>{runtimeStatus.title}</strong>
                <span>{runtimeStatus.detail}</span>
              </div>
            </Card>
          </motion.div>

          <motion.div {...cardMotion} transition={{ delay: 0.19 }}>
            <Card className="settings-card settings-voice-card">
              <div className="settings-card__header">
                <Sparkles size={18} />
                <Title level={3}>Góc viết bài</Title>
              </div>
              <Paragraph className="settings-muted">
                Tone mặc định đang hướng tới nữ trẻ 18-25, đáng yêu gần gũi, có thể nới nhẹ tới dưới
                30 khi tín hiệu ít.
              </Paragraph>

              <div className="range-grid">
                {TONE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`range-card ${settings.tone === option.value ? 'active' : ''}`}
                    onClick={() => updateSettings({ ...settings, tone: option.value })}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.caption}</span>
                  </button>
                ))}
              </div>

              <div className="settings-focus-prompt">
                <Text strong>Focus prompt</Text>
                <Input.TextArea
                  value={settings.focusPrompt}
                  rows={3}
                  maxLength={180}
                  placeholder="Ví dụ: ưu tiên góc nhìn dễ thương cho nữ sinh viên mới đi làm"
                  onChange={(event) =>
                    updateSettings({
                      ...settings,
                      focusPrompt: event.target.value,
                    })
                  }
                />
              </div>
            </Card>
          </motion.div>

          <motion.div {...cardMotion} transition={{ delay: 0.2 }}>
            <Card className="settings-card">
              <div className="settings-card__header">
                <Sparkles size={18} />
                <Title level={3}>Chất lượng nội dung</Title>
              </div>
              <ul className="quality-list">
                <li>Mỗi nguồn đang bật sẽ sinh 3 bài riêng: thời trang, sức khỏe và mẹo vặt.</li>
                <li>Job nền xử lý dần để tránh dồn token và làm loãng kết quả.</li>
                <li>Bài nào xong trước sẽ được đăng trước.</li>
                <li>Ưu tiên tiếng Việt có dấu, giọng văn đáng yêu gần gũi cho nữ trẻ.</li>
              </ul>
              <div className="settings-quality-stats">
                <Tag color="blue">Đã đăng: {postedCount}</Tag>
                <Tag color="purple">Nguồn bật: {settings.sources.length}</Tag>
                <Tag color="magenta">{settings.sources.length * 3} bài mỗi batch</Tag>
              </div>
            </Card>
          </motion.div>

          <motion.section
            className="settings-preview-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="settings-card__header">
              <PlayCircle size={18} />
              <Title level={3}>Xem trước và hành động</Title>
            </div>
            <Paragraph className="settings-muted">
              Bạn có thể dựng preview theo batch hoặc đưa luôn batch vào hàng đợi nền để backend
              đăng dần từng bài.
            </Paragraph>

            <div className="settings-actions">
              <Button
                type="default"
                size="large"
                icon={<Wand2 size={16} />}
                onClick={handleGeneratePreview}
                disabled={!validation.ok}
              >
                Tạo batch preview
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<PlayCircle size={16} />}
                onClick={handlePostNow}
                disabled={!validation.ok}
              >
                Đăng thử ngay
              </Button>
              <Button type="text" size="large" icon={<Save size={16} />} onClick={handleSaveSettings}>
                Lưu cài đặt
              </Button>
            </div>

            {!validation.ok && <div className="settings-warning">{validation.message}</div>}

            <div className="preview-surface">
              {previewGroups.length > 0 ? (
                <div className="preview-list">
                  {previewGroups.map(([source, items]) => (
                    <div key={source} className="preview-group">
                      <div className="preview-group__header">
                        <Tag color="purple">{automationSourceLabels[source]}</Tag>
                        <span>3 bài / mỗi nguồn</span>
                      </div>
                      {items.map((preview) => (
                        <motion.div
                          key={preview.id}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="preview-post"
                        >
                          <div className="preview-post__meta">
                            <Tag color="geekblue">{preview.status}</Tag>
                            <Tag color="cyan">{preview.category}</Tag>
                            {preview.posted && <Tag color="green">Đã đưa vào feed</Tag>}
                          </div>
                          <Title level={4}>{preview.title}</Title>
                          <Paragraph>{preview.content}</Paragraph>
                          {preview.images.length > 0 && (
                            <div className="preview-post__images">
                              {preview.images.slice(0, 3).map((imageUrl, imageIndex) => (
                                <img key={`${preview.id}-${imageIndex}`} src={imageUrl} alt={preview.title} />
                              ))}
                            </div>
                          )}
                          {preview.insights.length > 0 && (
                            <div className="preview-insights">
                              <strong>AI dang dua tren</strong>
                              <div className="preview-insights__list">
                                {preview.insights.map((insight, insightIndex) => (
                                  <div
                                    key={`${preview.id}-${insight.title}-${insightIndex}`}
                                    className="preview-insights__item"
                                  >
                                    <span className="preview-insights__score">
                                      Tin hieu {Math.round(insight.score * 100)}%
                                    </span>
                                    <strong>{insight.title}</strong>
                                    {insight.summary && <span>{insight.summary}</span>}
                                    {insight.url && (
                                      <a href={insight.url} target="_blank" rel="noreferrer">
                                        Mo nguon
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="preview-empty">
                  <Sparkles size={18} />
                  <span>Chưa có batch preview nào. Hãy tạo preview để xem AI đang dựng bài ra sao.</span>
                </div>
              )}
            </div>
          </motion.section>
        </aside>
      </div>
    </div>
  );
};

export default Settings;
