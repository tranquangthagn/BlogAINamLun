import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Badge,
  Button,
  Card,
  DatePicker,
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
  appendPostedFeedPost,
  automationSourceLabels,
  createDefaultAutomationSettings,
  createStatusText,
  generateAutomationPost,
  loadAutomationSettings,
  loadGeneratedFeedPosts,
  loadGenerationHistory,
  markPreviewAsPosted,
  saveAutomationSettings,
  saveGeneratedFeedPosts,
  saveGenerationHistory,
  upsertPreviewIntoHistory,
  validateAutomationSettings,
  type AutomationPreview,
  type AutomationSettings,
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

function emitAutomationChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTOMATION_EVENT));
  }
}

function sourceActive(settings: AutomationSettings, source: TrendSource): boolean {
  return settings.sources.includes(source);
}

const Settings: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [settings, setSettings] = useState<AutomationSettings>(createDefaultAutomationSettings());
  const [history, setHistory] = useState(() => loadGenerationHistory());
  const [preview, setPreview] = useState<AutomationPreview | null>(null);

  useEffect(() => {
    setSettings(loadAutomationSettings());
    setHistory(loadGenerationHistory());
  }, []);

  const validation = useMemo(() => validateAutomationSettings(settings), [settings]);
  const statusText = useMemo(() => createStatusText(settings), [settings]);
  const postedCount = useMemo(() => history.filter((item) => item.posted).length, [history]);

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

  const handleSaveSettings = () => {
    saveAutomationSettings(settings);
    emitAutomationChanged();
    messageApi.success('Đã lưu cài đặt trợ lý tự động đăng bài.');
  };

  const handleGeneratePreview = () => {
    try {
      const nextPreview = generateAutomationPost(
        settings,
        history.filter((item) => item.posted),
      );
      setPreview(nextPreview);
      messageApi.success('Đã tạo bài nháp xem trước.');
    } catch (error) {
      messageApi.warning(error instanceof Error ? error.message : 'Chưa thể tạo bài nháp.');
    }
  };

  const handlePostNow = () => {
    try {
      const basePreview = preview ?? generateAutomationPost(settings, history.filter((item) => item.posted));
      const postedPreview = markPreviewAsPosted(basePreview);
      const nextHistory = upsertPreviewIntoHistory(postedPreview, history);
      const nextSettings = {
        ...settings,
        lastRunAt: postedPreview.createdAt,
        lastGeneratedPostId: postedPreview.id,
      };
      const nextFeedPosts = appendPostedFeedPost(postedPreview.feedPost, loadGeneratedFeedPosts());

      saveGenerationHistory(nextHistory);
      saveGeneratedFeedPosts(nextFeedPosts);
      saveAutomationSettings(nextSettings);

      setHistory(nextHistory);
      setSettings(nextSettings);
      setPreview(postedPreview);
      emitAutomationChanged();
      messageApi.success('AI đã đăng thử một bài mới vào Bản tin.');
    } catch (error) {
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
            Một phòng điều khiển nhỏ xinh cho trợ lý AI của bạn: chọn giờ đăng, nguồn trend và phạm vi dữ
            liệu, rồi để AI tự tạo một bài thật gọn gàng cho Bản tin.
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
            Khi app đang mở, AI sẽ tự kiểm tra đến giờ và đăng đúng 1 bài vào feed.
          </Paragraph>
        </div>
      </motion.section>

      <div className="settings-grid">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="settings-card">
            <div className="settings-card__header">
              <Clock3 size={18} />
              <Title level={3}>Lịch đăng bài</Title>
            </div>
            <Paragraph className="settings-muted">
              Chọn một mốc giờ cố định để AI tự đăng đúng một bài mỗi lần chạy.
            </Paragraph>
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
            <div className="settings-summary-box">
              Mỗi ngày lúc <strong>{settings.postTime}</strong> AI sẽ tự đăng 1 bài vào Bản tin.
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
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

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
            </div>
          </Card>
        </motion.div>
      </div>

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
          Bạn có thể tạo bài nháp xem trước hoặc đăng thử ngay vào feed local để cảm nhận luồng tự động.
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
          {preview ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="preview-post"
            >
              <div className="preview-post__meta">
                <Tag color="magenta">{automationSourceLabels[preview.source]}</Tag>
                <Tag color="cyan">{preview.category}</Tag>
                {preview.posted && <Tag color="green">Đã đưa vào feed</Tag>}
              </div>
              <Title level={4}>{preview.title}</Title>
              <Paragraph>{preview.content}</Paragraph>
            </motion.div>
          ) : (
            <div className="preview-empty">
              <Sparkles size={18} />
              <span>Chưa có bài nháp nào. Hãy tạo preview để xem AI sẽ viết gì cho bạn.</span>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default Settings;
