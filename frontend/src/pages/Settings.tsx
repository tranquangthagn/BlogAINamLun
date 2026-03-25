import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Badge,
  Button,
  Card,
  DatePicker,
  Input,
  InputNumber,
  message,
  Switch,
  Tag,
  TimePicker,
  Typography,
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
  fixedTimeTopResultsCount,
  validateAutomationSettings,
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
  { value: 'quarter', label: 'Theo quý', caption: 'Tìm những mô-típ dài hơi hơn.' },
  { value: 'custom', label: 'Custom ngày', caption: 'Tự chọn chính xác khoảng ngày muốn nhìn.' },
];

const SCHEDULE_OPTIONS: Array<{
  value: ScheduleMode;
  label: string;
  caption: string;
}> = [
  {
    value: 'fixed_time',
    label: 'Theo giờ cố định',
    caption: 'AI chấm top 5 kết quả tốt nhất và đăng bài đứng đầu đúng khung giờ bạn chọn.',
  },
  {
    value: 'interval_minutes',
    label: 'Mấy phút một lần',
    caption: 'Mỗi chu kỳ chỉ chọn 1 kết quả tốt nhất ở thời điểm hiện tại để đăng.',
  },
];

const TONE_OPTIONS: Array<{
  value: AutomationTone;
  label: string;
  caption: string;
}> = [
  { value: 'trung_tinh', label: 'Trung tinh', caption: 'Giu giong viet can bang va de dung lai.' },
  { value: 'gan_gui', label: 'Gan gui', caption: 'Viet mem hon, de doc va de dong cam.' },
  { value: 'thuc_dung', label: 'Thuc dung', caption: 'Uu tien meo ro rang va gia tri ap dung.' },
  { value: 'bat_trend', label: 'Bat trend', caption: 'Hook nhanh hon va dam chat xu huong.' },
];

function emitAutomationChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTOMATION_EVENT));
  }
}

function sourceActive(settings: AutomationSettings, source: TrendSource): boolean {
  return settings.sources.includes(source);
}

const cardMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

type RuntimeStatusTone = 'idle' | 'ready' | 'warning';

type RuntimeStatus = {
  badge: string;
  title: string;
  detail: string;
  tone: RuntimeStatusTone;
};

const DEFAULT_RUNTIME_STATUS: RuntimeStatus = {
  badge: 'Dang cho lenh',
  title: 'AI runtime san sang',
  detail: 'Backend da ket noi. Ban co the tao preview hoac dang thu bat cu luc nao.',
  tone: 'idle',
};

function buildRuntimeStatusFromError(error: unknown): RuntimeStatus {
  const detail = error instanceof Error ? error.message : 'Chua the ket noi toi backend automation.';

  if (detail.includes('API key')) {
    return {
      badge: 'Can cau hinh',
      title: 'Gemini chua duoc bat',
      detail,
      tone: 'warning',
    };
  }

  if (detail.includes('het quota')) {
    return {
      badge: 'Tam gioi han',
      title: 'Gemini dang het quota',
      detail,
      tone: 'warning',
    };
  }

  return {
    badge: 'Can kiem tra',
    title: 'AI runtime gap su co',
    detail,
    tone: 'warning',
  };
}

const Settings: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [settings, setSettings] = useState<AutomationSettings>(createDefaultAutomationSettings());
  const [history, setHistory] = useState<GeneratedPostHistoryItem[]>([]);
  const [previewCandidates, setPreviewCandidates] = useState<GeneratedPostHistoryItem[]>([]);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>(DEFAULT_RUNTIME_STATUS);

  useEffect(() => {
    let active = true;

    const loadBackendState = async () => {
      try {
        const [nextSettings, nextHistory] = await Promise.all([
          getAutomationSettings(),
          listAutomationHistory(),
        ]);

        if (!active) {
          return;
        }

        setSettings(nextSettings);
        setHistory(nextHistory);
        setRuntimeStatus(DEFAULT_RUNTIME_STATUS);
      } catch {
        if (!active) {
          return;
        }

        setSettings(createDefaultAutomationSettings());
        setHistory([]);
        setRuntimeStatus({
          badge: 'Mat ket noi',
          title: 'Chua doc duoc backend',
          detail: 'Dang dung che do an toan. Hay kiem tra API neu ban muon tao bai that.',
          tone: 'warning',
        });
      }
    };

    loadBackendState();

    return () => {
      active = false;
    };
  }, []);

  const validation = useMemo(() => validateAutomationSettings(settings), [settings]);
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

  const customRangeValue: [Dayjs, Dayjs] | null =
    settings.customDateRange.start && settings.customDateRange.end
      ? [dayjs(settings.customDateRange.start), dayjs(settings.customDateRange.end)]
      : null;

  const updateSettings = (next: AutomationSettings) => {
    setSettings(next);
  };

  const toggleSource = (source: TrendSource) => {
    const nextSources = sourceActive(settings, source)
      ? settings.sources.filter((item) => item !== source)
      : [...settings.sources, source];

    updateSettings({
      ...settings,
      sources: nextSources,
    });
  };

  const handleSaveSettings = async () => {
    try {
      const nextSettings = await updateAutomationSettings(settings);
      setSettings(nextSettings);
      setRuntimeStatus({
        badge: 'Da dong bo',
        title: 'Cau hinh da duoc luu',
        detail: 'Backend da nhan settings moi. Luot preview tiep theo se dung cau hinh nay.',
        tone: 'ready',
      });
      emitAutomationChanged();
      messageApi.success('Đã lưu cài đặt trợ lý tự động đăng bài.');
    } catch (error) {
      setRuntimeStatus(buildRuntimeStatusFromError(error));
      messageApi.warning(error instanceof Error ? error.message : 'Chưa thể lưu cài đặt.');
    }
  };

  const handleGeneratePreview = async () => {
    try {
      const nextCandidates = await previewAutomationCandidates(settings);

      setPreviewCandidates(nextCandidates);
      setRuntimeStatus({
        badge: 'Preview OK',
        title: 'AI vua tao candidate moi',
        detail:
          settings.scheduleMode === 'fixed_time'
            ? `Da tao ${nextCandidates.length} candidate de ban xem nhanh truoc khi dang.`
            : 'Da tao candidate moi cho chu ky hien tai.',
        tone: 'ready',
      });
      messageApi.success(
        settings.scheduleMode === 'fixed_time'
          ? `Đã tạo top ${fixedTimeTopResultsCount} bài nháp xem trước.`
          : 'Đã tạo bài nháp xem trước cho chu kỳ hiện tại.',
      );
    } catch (error) {
      setRuntimeStatus(buildRuntimeStatusFromError(error));
      messageApi.warning(error instanceof Error ? error.message : 'Chưa thể tạo bài nháp.');
    }
  };

  const handlePostNow = async () => {
    try {
      const nextSettings = await updateAutomationSettings(settings);
      await postAutomationNow();
      const nextHistory = await listAutomationHistory();

      setHistory(nextHistory);
      setSettings(nextSettings);
      setPreviewCandidates((current) =>
        current.map((item, index) => (index === 0 ? { ...item, posted: true } : item)),
      );
      setRuntimeStatus({
        badge: 'Dang thanh cong',
        title: 'AI da day 1 bai vao feed',
        detail: 'Luot post-now vua thanh cong va lich su backend da duoc cap nhat.',
        tone: 'ready',
      });
      emitAutomationChanged();
      messageApi.success('AI đã đăng thử một bài mới vào Bản tin.');
    } catch (error) {
      setRuntimeStatus(buildRuntimeStatusFromError(error));
      messageApi.warning(error instanceof Error ? error.message : 'Chưa thể đăng bài ngay lúc này.');
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
            Một phòng điều khiển rõ nhịp hơn cho trợ lý AI của bạn: chọn lịch đăng, nguồn trend
            và phạm vi dữ liệu, rồi để AI tự tạo bài phù hợp với nhịp feed mà bạn muốn.
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
            {settings.scheduleMode === 'fixed_time'
              ? `Khi app đang mở, AI sẽ chấm top ${fixedTimeTopResultsCount} kết quả và đăng bài đứng đầu đúng giờ.`
              : `Khi app đang mở, AI sẽ kiểm tra sau mỗi ${settings.intervalMinutes} phút để đăng 1 kết quả tốt nhất.`}
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
                Chọn cách AI lên nhịp đăng bài: theo giờ cố định với top 5, hoặc theo chu kỳ
                phút với 1 kết quả mỗi lượt.
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
                Chọn từng kênh riêng lẻ để AI ưu tiên lấy tín hiệu trend mô phỏng.
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
                Chỉ chọn một kiểu phạm vi mỗi lần để AI giữ được góc viết tập trung hơn.
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
                  exit={{ opacity: 0, height: 0 }}
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
                Một góc nhìn nhanh để biết trợ lý đang chạy theo nhịp nào, lấy trend từ đâu và
                lần cuối đã tạo gì.
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
                  <span>Candidate</span>
                  <strong>
                    {settings.scheduleMode === 'fixed_time'
                      ? `Top ${fixedTimeTopResultsCount} bài mỗi lượt`
                      : '1 bài mới mỗi chu kỳ'}
                  </strong>
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
                Trang thai phan hoi gan nhat tu backend Gemini de ban biet nen doi quota, sua cau hinh hay tiep tuc dang.
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
                <Title level={3}>Goc viet bai</Title>
              </div>
              <Paragraph className="settings-muted">
                Chon tone nhe va them 1 focus prompt ngan de AI viet bai dung chat hon o luot generate tiep theo.
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
                <Text strong>Focus prompt ngan</Text>
                <Input.TextArea
                  value={settings.focusPrompt}
                  rows={3}
                  maxLength={180}
                  placeholder="Vi du: uu tien goc nhin cho nguoi moi bat dau"
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
                <li>Mỗi lần chạy chỉ đăng 1 bài để giữ chất lượng tốt hơn.</li>
                <li>Không lặp tiêu đề gần đây.</li>
                <li>Không lặp lại cùng nguồn và topic vừa dùng.</li>
                <li>Ưu tiên xoay vòng nguồn nếu bạn chọn nhiều nơi.</li>
              </ul>
              <div className="settings-quality-stats">
                <Tag color="blue">Đã đăng: {postedCount}</Tag>
                <Tag color="purple">Nguồn bật: {settings.sources.length}</Tag>
                <Tag color="magenta">
                  {settings.scheduleMode === 'fixed_time'
                    ? `Top ${fixedTimeTopResultsCount} candidate`
                    : '1 candidate mỗi chu kỳ'}
                </Tag>
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
              {settings.scheduleMode === 'fixed_time'
                ? `Bạn có thể tạo top ${fixedTimeTopResultsCount} bài nháp để xem AI đang đánh giá gì là tốt nhất trước khi đăng.`
                : 'Bạn có thể tạo 1 bài nháp cho chu kỳ hiện tại hoặc đăng thử ngay vào feed local.'}
            </Paragraph>

            <div className="settings-actions">
              <Button
                type="default"
                size="large"
                icon={<Wand2 size={16} />}
                onClick={handleGeneratePreview}
                disabled={!validation.ok}
              >
                Tạo bài nháp xem trước
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
              {previewCandidates.length > 0 ? (
                <div className="preview-list">
                  {previewCandidates.map((preview, index) => (
                    <motion.div
                      key={preview.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="preview-post"
                    >
                      <div className="preview-post__meta">
                        <Tag color={index === 0 ? 'geekblue' : 'magenta'}>
                          {settings.scheduleMode === 'fixed_time' ? `Top ${index + 1}` : 'Candidate hiện tại'}
                        </Tag>
                        <Tag color="purple">{automationSourceLabels[preview.source as TrendSource]}</Tag>
                        <Tag color="cyan">{preview.category}</Tag>
                        {preview.posted && <Tag color="green">Đã đưa vào feed</Tag>}
                      </div>
                      <Title level={4}>{preview.title}</Title>
                      <Paragraph>{preview.content}</Paragraph>
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
              ) : (
                <div className="preview-empty">
                  <Sparkles size={18} />
                  <span>Chưa có bài nháp nào. Hãy tạo preview để xem AI sẽ viết gì cho bạn.</span>
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
