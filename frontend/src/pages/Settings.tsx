import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Badge,
  Button,
  Card,
  DatePicker,
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
  { value: 'day', label: 'Theo ngĂ y', caption: 'Æ¯u tiĂªn tĂ­n hiá»‡u má»›i nháº¥t trong ngĂ y.' },
  { value: 'week', label: 'Theo tuáº§n', caption: 'CĂ¢n báº±ng giá»¯a má»›i vĂ  á»•n Ä‘á»‹nh.' },
  { value: 'quarter', label: 'Theo quĂ½', caption: 'TĂ¬m nhá»¯ng mĂ´-tĂ­p dĂ i hÆ¡i hÆ¡n.' },
  { value: 'custom', label: 'Custom ngĂ y', caption: 'Tá»± chá»n chĂ­nh xĂ¡c khoáº£ng ngĂ y muá»‘n nhĂ¬n.' },
];

const SCHEDULE_OPTIONS: Array<{
  value: ScheduleMode;
  label: string;
  caption: string;
}> = [
  {
    value: 'fixed_time',
    label: 'Theo giá» cá»‘ Ä‘á»‹nh',
    caption: 'AI cháº¥m top 5 káº¿t quáº£ tá»‘t nháº¥t vĂ  Ä‘Äƒng bĂ i Ä‘á»©ng Ä‘áº§u Ä‘Ăºng khung giá» báº¡n chá»n.',
  },
  {
    value: 'interval_minutes',
    label: 'Máº¥y phĂºt má»™t láº§n',
    caption: 'Má»—i chu ká»³ chá»‰ chá»n 1 káº¿t quáº£ tá»‘t nháº¥t á»Ÿ thá»i Ä‘iá»ƒm hiá»‡n táº¡i Ä‘á»ƒ Ä‘Äƒng.',
  },
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

const Settings: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [settings, setSettings] = useState<AutomationSettings>(createDefaultAutomationSettings());
  const [history, setHistory] = useState<GeneratedPostHistoryItem[]>([]);
  const [previewCandidates, setPreviewCandidates] = useState<GeneratedPostHistoryItem[]>([]);

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
      } catch {
        if (!active) {
          return;
        }

        setSettings(createDefaultAutomationSettings());
        setHistory([]);
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
        : 'ChÆ°a chá»n nguá»“n',
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
      emitAutomationChanged();
      messageApi.success('ÄĂ£ lÆ°u cĂ i Ä‘áº·t trá»£ lĂ½ tá»± Ä‘á»™ng Ä‘Äƒng bĂ i.');
    } catch (error) {
      messageApi.warning(error instanceof Error ? error.message : 'ChÆ°a thá»ƒ lÆ°u cĂ i Ä‘áº·t.');
    }
  };

  const handleGeneratePreview = async () => {
    try {
      const nextCandidates = await previewAutomationCandidates(settings);

      setPreviewCandidates(nextCandidates);
      messageApi.success(
        settings.scheduleMode === 'fixed_time'
          ? `ÄĂ£ táº¡o top ${fixedTimeTopResultsCount} bĂ i nhĂ¡p xem trÆ°á»›c.`
          : 'ÄĂ£ táº¡o bĂ i nhĂ¡p xem trÆ°á»›c cho chu ká»³ hiá»‡n táº¡i.',
      );
    } catch (error) {
      messageApi.warning(error instanceof Error ? error.message : 'ChÆ°a thá»ƒ táº¡o bĂ i nhĂ¡p.');
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
      emitAutomationChanged();
      messageApi.success('AI Ä‘Ă£ Ä‘Äƒng thá»­ má»™t bĂ i má»›i vĂ o Báº£n tin.');
    } catch (error) {
      messageApi.warning(error instanceof Error ? error.message : 'ChÆ°a thá»ƒ Ä‘Äƒng bĂ i ngay lĂºc nĂ y.');
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
            {settings.enabled ? 'Äang tá»± Ä‘á»™ng cháº¡y' : 'Äang nghá»‰'}
          </Tag>
          <Title level={1} className="settings-hero__title">
            Tá»± Ä‘á»™ng Ä‘Äƒng bĂ i
          </Title>
          <Paragraph className="settings-hero__description">
            Má»™t phĂ²ng Ä‘iá»u khiá»ƒn rĂµ nhá»‹p hÆ¡n cho trá»£ lĂ½ AI cá»§a báº¡n: chá»n lá»‹ch Ä‘Äƒng, nguá»“n trend
            vĂ  pháº¡m vi dá»¯ liá»‡u, rá»“i Ä‘á»ƒ AI tá»± táº¡o bĂ i phĂ¹ há»£p vá»›i nhá»‹p feed mĂ  báº¡n muá»‘n.
          </Paragraph>
          <div className="settings-hero__status">
            <Badge status={settings.enabled ? 'processing' : 'default'} />
            <Text>{statusText}</Text>
          </div>
        </div>

        <div className="settings-hero__toggle">
          <div className="settings-hero__toggle-label">
            <Sparkles size={20} />
            <span>Báº­t cháº¿ Ä‘á»™ auto-post</span>
          </div>
          <Switch
            checked={settings.enabled}
            onChange={(checked) => updateSettings({ ...settings, enabled: checked })}
            className="settings-switch"
          />
          <Paragraph className="settings-hero__hint">
            {settings.scheduleMode === 'fixed_time'
              ? `Khi app Ä‘ang má»Ÿ, AI sáº½ cháº¥m top ${fixedTimeTopResultsCount} káº¿t quáº£ vĂ  Ä‘Äƒng bĂ i Ä‘á»©ng Ä‘áº§u Ä‘Ăºng giá».`
              : `Khi app Ä‘ang má»Ÿ, AI sáº½ kiá»ƒm tra sau má»—i ${settings.intervalMinutes} phĂºt Ä‘á»ƒ Ä‘Äƒng 1 káº¿t quáº£ tá»‘t nháº¥t.`}
          </Paragraph>
        </div>
      </motion.section>

      <div className="settings-main">
        <div className="settings-flow">
          <motion.div {...cardMotion} transition={{ delay: 0.05 }}>
            <Card className="settings-card">
              <div className="settings-card__header">
                <Clock3 size={18} />
                <Title level={3}>Lá»‹ch Ä‘Äƒng bĂ i</Title>
              </div>
              <Paragraph className="settings-muted">
                Chá»n cĂ¡ch AI lĂªn nhá»‹p Ä‘Äƒng bĂ i: theo giá» cá»‘ Ä‘á»‹nh vá»›i top 5, hoáº·c theo chu ká»³
                phĂºt vá»›i 1 káº¿t quáº£ má»—i lÆ°á»£t.
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
                    addonAfter="phĂºt"
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
                <Title level={3}>Nguá»“n trend</Title>
              </div>
              <Paragraph className="settings-muted">
                Chá»n tá»«ng kĂªnh riĂªng láº» Ä‘á»ƒ AI Æ°u tiĂªn láº¥y tĂ­n hiá»‡u trend mĂ´ phá»ng.
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
                <Title level={3}>Pháº¡m vi dá»¯ liá»‡u</Title>
              </div>
              <Paragraph className="settings-muted">
                Chá»‰ chá»n má»™t kiá»ƒu pháº¡m vi má»—i láº§n Ä‘á»ƒ AI giá»¯ Ä‘Æ°á»£c gĂ³c viáº¿t táº­p trung hÆ¡n.
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
                <Title level={3}>Tá»•ng quan AI</Title>
              </div>
              <Paragraph className="settings-muted">
                Má»™t gĂ³c nhĂ¬n nhanh Ä‘á»ƒ biáº¿t trá»£ lĂ½ Ä‘ang cháº¡y theo nhá»‹p nĂ o, láº¥y trend tá»« Ä‘Ă¢u vĂ 
                láº§n cuá»‘i Ä‘Ă£ táº¡o gĂ¬.
              </Paragraph>

              <div className="settings-summary-box">
                <strong>{statusText}</strong>
              </div>

              <div className="settings-status-card__stack">
                <div className="settings-status-card__line">
                  <span>Lá»‹ch hiá»‡n táº¡i</span>
                  <strong>{scheduleSummary}</strong>
                </div>
                <div className="settings-status-card__line">
                  <span>Nguá»“n Ä‘ang báº­t</span>
                  <strong>{sourceSummary}</strong>
                </div>
                <div className="settings-status-card__line">
                  <span>Candidate</span>
                  <strong>
                    {settings.scheduleMode === 'fixed_time'
                      ? `Top ${fixedTimeTopResultsCount} bĂ i má»—i lÆ°á»£t`
                      : '1 bĂ i má»›i má»—i chu ká»³'}
                  </strong>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div {...cardMotion} transition={{ delay: 0.2 }}>
            <Card className="settings-card">
              <div className="settings-card__header">
                <Sparkles size={18} />
                <Title level={3}>Cháº¥t lÆ°á»£ng ná»™i dung</Title>
              </div>
              <ul className="quality-list">
                <li>Má»—i láº§n cháº¡y chá»‰ Ä‘Äƒng 1 bĂ i Ä‘á»ƒ giá»¯ cháº¥t lÆ°á»£ng tá»‘t hÆ¡n.</li>
                <li>KhĂ´ng láº·p tiĂªu Ä‘á» gáº§n Ä‘Ă¢y.</li>
                <li>KhĂ´ng láº·p láº¡i cĂ¹ng nguá»“n vĂ  topic vá»«a dĂ¹ng.</li>
                <li>Æ¯u tiĂªn xoay vĂ²ng nguá»“n náº¿u báº¡n chá»n nhiá»u nÆ¡i.</li>
              </ul>
              <div className="settings-quality-stats">
                <Tag color="blue">ÄĂ£ Ä‘Äƒng: {postedCount}</Tag>
                <Tag color="purple">Nguá»“n báº­t: {settings.sources.length}</Tag>
                <Tag color="magenta">
                  {settings.scheduleMode === 'fixed_time'
                    ? `Top ${fixedTimeTopResultsCount} candidate`
                    : '1 candidate má»—i chu ká»³'}
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
              <Title level={3}>Xem trÆ°á»›c vĂ  hĂ nh Ä‘á»™ng</Title>
            </div>
            <Paragraph className="settings-muted">
              {settings.scheduleMode === 'fixed_time'
                ? `Báº¡n cĂ³ thá»ƒ táº¡o top ${fixedTimeTopResultsCount} bĂ i nhĂ¡p Ä‘á»ƒ xem AI Ä‘ang Ä‘Ă¡nh giĂ¡ gĂ¬ lĂ  tá»‘t nháº¥t trÆ°á»›c khi Ä‘Äƒng.`
                : 'Báº¡n cĂ³ thá»ƒ táº¡o 1 bĂ i nhĂ¡p cho chu ká»³ hiá»‡n táº¡i hoáº·c Ä‘Äƒng thá»­ ngay vĂ o feed local.'}
            </Paragraph>

            <div className="settings-actions">
              <Button
                type="default"
                size="large"
                icon={<Wand2 size={16} />}
                onClick={handleGeneratePreview}
                disabled={!validation.ok}
              >
                Táº¡o bĂ i nhĂ¡p xem trÆ°á»›c
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<PlayCircle size={16} />}
                onClick={handlePostNow}
                disabled={!validation.ok}
              >
                ÄÄƒng thá»­ ngay
              </Button>
              <Button type="text" size="large" icon={<Save size={16} />} onClick={handleSaveSettings}>
                LÆ°u cĂ i Ä‘áº·t
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
                          {settings.scheduleMode === 'fixed_time' ? `Top ${index + 1}` : 'Candidate hiá»‡n táº¡i'}
                        </Tag>
                        <Tag color="purple">{automationSourceLabels[preview.source as TrendSource]}</Tag>
                        <Tag color="cyan">{preview.category}</Tag>
                        {preview.posted && <Tag color="green">ÄĂ£ Ä‘Æ°a vĂ o feed</Tag>}
                      </div>
                      <Title level={4}>{preview.title}</Title>
                      <Paragraph>{preview.content}</Paragraph>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="preview-empty">
                  <Sparkles size={18} />
                  <span>ChÆ°a cĂ³ bĂ i nhĂ¡p nĂ o. HĂ£y táº¡o preview Ä‘á»ƒ xem AI sáº½ viáº¿t gĂ¬ cho báº¡n.</span>
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
