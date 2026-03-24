import type { Post } from './mockData';

export type TrendSource = 'facebook' | 'tiktok' | 'instagram' | 'shopee' | 'threads';
export type TrendRangeMode = 'day' | 'week' | 'quarter' | 'custom';
export type ScheduleMode = 'fixed_time' | 'interval_minutes';

export interface AutomationSettings {
  enabled: boolean;
  scheduleMode: ScheduleMode;
  postTime: string;
  intervalMinutes: number;
  sources: TrendSource[];
  trendRangeMode: TrendRangeMode;
  customDateRange: {
    start: string | null;
    end: string | null;
  };
  lastRunAt: string | null;
  lastGeneratedPostId: number | null;
}

export interface GeneratedPostHistoryItem {
  id: number;
  title: string;
  content: string;
  source: TrendSource;
  topicKey: string;
  createdAt: string;
  posted: boolean;
  category: Post['category'];
}

export interface AutomationPreview extends GeneratedPostHistoryItem {
  feedPost: Post;
}

export interface ValidationResult {
  ok: boolean;
  message: string;
}

const SETTINGS_KEY = 'blog_ai_nam_lun_settings';
const HISTORY_KEY = 'blog_ai_nam_lun_generation_history';
const FEED_KEY = 'blog_ai_nam_lun_generated_feed_posts';
const FIXED_TIME_TOP_RESULTS = 5;

type TopicTemplate = {
  topicKey: string;
  category: Post['category'];
  title: (sourceLabel: string, rangeLabel: string) => string;
  content: (sourceLabel: string, rangeLabel: string) => string;
};

const SOURCE_LABELS: Record<TrendSource, string> = {
  facebook: 'Facebook',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  shopee: 'Shopee',
  threads: 'Threads',
};

const RANGE_LABELS: Record<TrendRangeMode, string> = {
  day: 'hôm nay',
  week: '7 ngày gần đây',
  quarter: 'quý này',
  custom: 'khoảng ngày đã chọn',
};

const AI_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=NamLunAI';

const TOPIC_TEMPLATES: TopicTemplate[] = [
  {
    topicKey: 'short-form-hook',
    category: 'general',
    title: (source, range) => `${source} đang thích kiểu mở bài chạm cảm xúc trong ${range}`,
    content: (source, range) =>
      `Mình đang quan sát ${source} trong ${range} và thấy các nội dung mở đầu bằng một cảm giác rất đời thường đang giữ nhịp tương tác khá tốt. Bài đăng kiểu này dễ chạm người đọc vì vừa gần gũi, vừa đủ tò mò để họ dừng lại xem tiếp.`,
  },
  {
    topicKey: 'beauty-routine',
    category: 'fashion',
    title: (source, range) => `Trend làm đẹp tối giản từ ${source} nổi bật trong ${range}`,
    content: (source, range) =>
      `Dữ liệu mô phỏng từ ${source} trong ${range} đang nghiêng về các nội dung chăm chút vẻ ngoài theo hướng tối giản, gọn và có thể áp dụng ngay. Kiểu bài này hợp để biến thành một post nhẹ nhàng, dễ thương nhưng vẫn có cảm giác cập nhật trend.`,
  },
  {
    topicKey: 'healthy-reset',
    category: 'health',
    title: (source, range) => `${source} đang đẩy mạnh nội dung reset năng lượng trong ${range}`,
    content: (source, range) =>
      `Trong ${range}, ${source} đang nổi lên các chủ đề xoay quanh phục hồi năng lượng, ngủ tốt hơn và chăm sức khỏe theo nhịp sống thực tế. Đây là kiểu nội dung dễ chuyển hóa thành một bài viết có ích mà không bị khô cứng.`,
  },
  {
    topicKey: 'smart-saving-tip',
    category: 'tips',
    title: (source, range) => `Mẹo chi tiêu thông minh từ trend ${source} trong ${range}`,
    content: (source, range) =>
      `Trend mô phỏng trên ${source} trong ${range} cho thấy người xem đang quan tâm những mẹo tiết kiệm thời gian hoặc tiền bạc theo kiểu rất nhanh và thực dụng. Viết theo góc này giúp bài đăng có cảm giác hữu ích ngay lập tức.`,
  },
  {
    topicKey: 'comment-friendly-post',
    category: 'general',
    title: (source, range) => `Kiểu post dễ kéo bình luận từ ${source} trong ${range}`,
    content: (source, range) =>
      `Ở ${source}, trong ${range}, những nội dung đặt câu hỏi đơn giản nhưng có góc nhìn cá nhân đang có lợi thế lớn. Mẫu post này phù hợp với bản tin cá nhân vì vẫn tự nhiên, không tạo cảm giác quá máy móc.`,
  },
  {
    topicKey: 'soft-style-board',
    category: 'fashion',
    title: (source, range) => `Bảng màu và phong cách mềm mại đang lên từ ${source}`,
    content: (source, range) =>
      `Phần trend mô phỏng từ ${source} trong ${range} nghiêng về những bài có hình ảnh nhẹ mắt, bảng màu mềm và cảm giác chăm chút tinh tế. Đây là chất liệu tốt để tạo một post vừa hiện đại vừa đáng yêu.`,
  },
  {
    topicKey: 'micro-habit',
    category: 'health',
    title: (source, range) => `Thói quen nhỏ nhưng hiệu quả đang được chú ý trên ${source}`,
    content: (source, range) =>
      `Các tín hiệu mô phỏng trong ${range} cho thấy ${source} ưu ái những nội dung nói về thay đổi nhỏ, dễ làm, dễ duy trì mỗi ngày. Kiểu bài này hợp để AI viết thành một post ngắn, sạch và có giá trị.`,
  },
  {
    topicKey: 'shopping-hack',
    category: 'tips',
    title: (source, range) => `Mẹo săn món đáng mua từ ${source} trong ${range}`,
    content: (source, range) =>
      `Trong ${range}, ${source} đang nổi lên những nội dung rất thực tế về cách chọn món đáng tiền, tránh mua dư và tối ưu trải nghiệm mua sắm. Đây là hướng nội dung phù hợp với chất feed cá nhân nhưng vẫn bắt trend tốt.`,
  },
];

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function pad(value: number): string {
  return `${value}`.padStart(2, '0');
}

function formatTimeSince(iso: string, nowIso?: string): string {
  const now = nowIso ? new Date(nowIso) : new Date();
  const createdAt = new Date(iso);
  const diffMs = now.getTime() - createdAt.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

function toDayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function titleFingerprint(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function recentHistory(history: GeneratedPostHistoryItem[]): GeneratedPostHistoryItem[] {
  return [...history]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
}

function pickSource(sources: TrendSource[], history: GeneratedPostHistoryItem[]): TrendSource {
  const recent = recentHistory(history);
  const usageScore = new Map<TrendSource, number>();

  for (const source of sources) {
    usageScore.set(source, 0);
  }

  recent.forEach((item, index) => {
    if (usageScore.has(item.source)) {
      usageScore.set(item.source, (usageScore.get(item.source) || 0) + (8 - index));
    }
  });

  return [...sources].sort((left, right) => (usageScore.get(left) || 0) - (usageScore.get(right) || 0))[0];
}

function candidateRejected(
  source: TrendSource,
  template: TopicTemplate,
  history: GeneratedPostHistoryItem[],
  title: string,
): boolean {
  const fingerprint = titleFingerprint(title);

  return recentHistory(history).some((item) => {
    const sameCombo = item.source === source && item.topicKey === template.topicKey;
    const sameTitle = titleFingerprint(item.title) === fingerprint;
    return sameCombo || sameTitle;
  });
}

function rangeLabelForSettings(settings: AutomationSettings): string {
  if (settings.trendRangeMode !== 'custom') {
    return RANGE_LABELS[settings.trendRangeMode];
  }

  const { start, end } = settings.customDateRange;
  if (start && end) {
    return `${start} đến ${end}`;
  }

  return RANGE_LABELS.custom;
}

function previewToFeedPost(preview: GeneratedPostHistoryItem, nowIso?: string): Post {
  return {
    id: preview.id,
    author: 'Trợ lý AI',
    avatar: AI_AVATAR,
    content: `${preview.title}\n\n${preview.content}`,
    images: [],
    time: formatTimeSince(preview.createdAt, nowIso),
    createdAt: preview.createdAt,
    category: preview.category,
    likes: 0,
    comments: 0,
  };
}

function getCandidateCount(settings: AutomationSettings): number {
  return settings.scheduleMode === 'fixed_time' ? FIXED_TIME_TOP_RESULTS : 1;
}

function createSingleCandidate(
  settings: AutomationSettings,
  history: GeneratedPostHistoryItem[],
  nowIso: string,
): AutomationPreview {
  const source = pickSource(settings.sources, history);
  const sourceLabel = SOURCE_LABELS[source];
  const rangeLabel = rangeLabelForSettings(settings);
  const nextId = Math.max(0, ...history.map((item) => item.id)) + 1;

  let chosen = TOPIC_TEMPLATES[0];
  let title = chosen.title(sourceLabel, rangeLabel);

  for (const template of TOPIC_TEMPLATES) {
    const candidateTitle = template.title(sourceLabel, rangeLabel);
    if (!candidateRejected(source, template, history, candidateTitle)) {
      chosen = template;
      title = candidateTitle;
      break;
    }
  }

  const generated: GeneratedPostHistoryItem = {
    id: nextId,
    title,
    content: chosen.content(sourceLabel, rangeLabel),
    source,
    topicKey: chosen.topicKey,
    createdAt: nowIso,
    posted: false,
    category: chosen.category,
  };

  return {
    ...generated,
    feedPost: previewToFeedPost(generated, nowIso),
  };
}

export function createDefaultAutomationSettings(): AutomationSettings {
  return {
    enabled: false,
    scheduleMode: 'fixed_time',
    postTime: '08:00',
    intervalMinutes: 30,
    sources: ['tiktok', 'threads'],
    trendRangeMode: 'week',
    customDateRange: {
      start: null,
      end: null,
    },
    lastRunAt: null,
    lastGeneratedPostId: null,
  };
}

export function validateAutomationSettings(settings: AutomationSettings): ValidationResult {
  if (settings.scheduleMode === 'fixed_time' && !settings.postTime) {
    return {
      ok: false,
      message: 'Bạn cần chọn giờ đăng bài cho trợ lý.',
    };
  }

  if (
    settings.scheduleMode === 'interval_minutes' &&
    (!Number.isFinite(settings.intervalMinutes) || settings.intervalMinutes < 1)
  ) {
    return {
      ok: false,
      message: 'Bạn cần nhập số phút hợp lệ cho chế độ đăng theo chu kỳ.',
    };
  }

  if (settings.sources.length === 0) {
    return {
      ok: false,
      message: 'Hãy chọn ít nhất một nguồn để AI lấy trend.',
    };
  }

  if (settings.trendRangeMode === 'custom') {
    const { start, end } = settings.customDateRange;
    if (!start || !end) {
      return {
        ok: false,
        message: 'Bạn cần chọn đầy đủ ngày bắt đầu và ngày kết thúc cho phạm vi custom.',
      };
    }
  }

  return {
    ok: true,
    message: 'Cấu hình hợp lệ.',
  };
}

export function generateAutomationCandidates(
  settings: AutomationSettings,
  history: GeneratedPostHistoryItem[],
  nowIso = new Date().toISOString(),
): AutomationPreview[] {
  const validation = validateAutomationSettings(settings);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const count = getCandidateCount(settings);
  const workingHistory = [...history];
  const candidates: AutomationPreview[] = [];

  for (let index = 0; index < count; index += 1) {
    const candidateNow = new Date(new Date(nowIso).getTime() + index * 1000).toISOString();
    const candidate = createSingleCandidate(settings, workingHistory, candidateNow);
    candidates.push(candidate);
    workingHistory.push(candidate);
  }

  return candidates;
}

export function generateAutomationPost(
  settings: AutomationSettings,
  history: GeneratedPostHistoryItem[],
  nowIso = new Date().toISOString(),
): AutomationPreview {
  return generateAutomationCandidates(settings, history, nowIso)[0];
}

export function mergeFeedPosts<T extends { createdAt: string }>(basePosts: T[], generatedPosts: T[]): T[] {
  return [...generatedPosts, ...basePosts].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function shouldRunAutomationNow(
  settings: AutomationSettings,
  lastRunAt: string | null,
  nowIso = new Date().toISOString(),
): boolean {
  if (!settings.enabled) {
    return false;
  }

  if (settings.scheduleMode === 'interval_minutes') {
    if (!lastRunAt) {
      return true;
    }

    const diffMs = new Date(nowIso).getTime() - new Date(lastRunAt).getTime();
    return diffMs >= settings.intervalMinutes * 60 * 1000;
  }

  const [hours, minutes] = settings.postTime.split(':').map((part) => Number(part));
  const now = new Date(nowIso);
  const threshold = new Date(now);
  threshold.setHours(hours, minutes, 0, 0);

  if (now.getTime() < threshold.getTime()) {
    return false;
  }

  if (!lastRunAt) {
    return true;
  }

  return toDayKey(lastRunAt) !== toDayKey(nowIso);
}

export function markPreviewAsPosted(preview: AutomationPreview, nowIso = new Date().toISOString()): AutomationPreview {
  return {
    ...preview,
    posted: true,
    feedPost: {
      ...preview.feedPost,
      time: formatTimeSince(preview.createdAt, nowIso),
    },
  };
}

export function createScheduleSummary(settings: AutomationSettings): string {
  if (settings.scheduleMode === 'interval_minutes') {
    return `Mỗi ${settings.intervalMinutes} phút AI sẽ lấy 1 kết quả tốt nhất để đăng.`;
  }

  return `Mỗi ngày lúc ${settings.postTime}, AI sẽ chọn top ${FIXED_TIME_TOP_RESULTS} kết quả tốt nhất rồi dùng bài đứng đầu để đăng theo khung giờ cố định.`;
}

export function createStatusText(settings: AutomationSettings): string {
  const sourceLabel =
    settings.sources.length > 0 ? settings.sources.map((item) => SOURCE_LABELS[item]).join(', ') : 'chưa chọn';
  const rangeLabel = rangeLabelForSettings(settings);
  const stateLabel = settings.enabled ? 'Đang bật tự động đăng' : 'Đang tạm nghỉ';
  const scheduleLabel =
    settings.scheduleMode === 'fixed_time'
      ? `${settings.postTime} mỗi ngày | top ${FIXED_TIME_TOP_RESULTS}`
      : `${settings.intervalMinutes} phút/lần | 1 kết quả`;

  return `${stateLabel} | ${scheduleLabel} | Nguồn: ${sourceLabel} | Phạm vi: ${rangeLabel}`;
}

export function loadAutomationSettings(): AutomationSettings {
  if (!canUseStorage()) {
    return createDefaultAutomationSettings();
  }

  return {
    ...createDefaultAutomationSettings(),
    ...safeJsonParse<Partial<AutomationSettings>>(window.localStorage.getItem(SETTINGS_KEY), {}),
  };
}

export function saveAutomationSettings(settings: AutomationSettings): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadGenerationHistory(): GeneratedPostHistoryItem[] {
  if (!canUseStorage()) {
    return [];
  }

  return safeJsonParse<GeneratedPostHistoryItem[]>(window.localStorage.getItem(HISTORY_KEY), []);
}

export function saveGenerationHistory(history: GeneratedPostHistoryItem[]): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function loadGeneratedFeedPosts(): Post[] {
  if (!canUseStorage()) {
    return [];
  }

  return safeJsonParse<Post[]>(window.localStorage.getItem(FEED_KEY), []);
}

export function saveGeneratedFeedPosts(posts: Post[]): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(FEED_KEY, JSON.stringify(posts));
}

export function upsertPreviewIntoHistory(
  preview: GeneratedPostHistoryItem,
  history: GeneratedPostHistoryItem[],
): GeneratedPostHistoryItem[] {
  const remaining = history.filter((item) => item.id !== preview.id);
  return [preview, ...remaining].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function appendPostedFeedPost(post: Post, posts: Post[]): Post[] {
  return mergeFeedPosts(posts, [post]);
}

export const automationSourceLabels = SOURCE_LABELS;
export const fixedTimeTopResultsCount = FIXED_TIME_TOP_RESULTS;
