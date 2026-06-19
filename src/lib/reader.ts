// 阅读器共享类型与常量

export type ReaderTheme = 'light' | 'sepia' | 'dark';
export type ReaderFont = 'serif' | 'sans';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ReaderSettings {
  theme: ReaderTheme;
  font: ReaderFont;
  fontSize: FontSize;
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'light',
  font: 'serif',
  fontSize: 'md',
};

export const FONT_SIZE_PX: Record<FontSize, number> = {
  sm: 16,
  md: 18,
  lg: 20,
  xl: 22,
};

export const THEME_LABELS: Record<ReaderTheme, string> = {
  light: '纸白',
  sepia: '护眼',
  dark: '夜间',
};

export const FONT_LABELS: Record<ReaderFont, string> = {
  serif: '衬线',
  sans: '无衬线',
};

export const SIZE_LABELS: Record<FontSize, string> = {
  sm: '小',
  md: '中',
  lg: '大',
  xl: '特大',
};

// localStorage keys
export const SETTINGS_KEY = 'reader:settings';
export const PROGRESS_KEY = 'reader:progress'; // { [novelId]: { chapter, scrollTop, ts } }

export interface ChapterProgress {
  chapter: string;   // 章节 slug
  scrollTop: number;
  ts: number;
}

/** 读取阅读偏好 */
export function loadSettings(): ReaderSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS;
}

/** 保存阅读偏好 */
export function saveSettings(s: ReaderSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** 读取某本小说的阅读进度 */
export function loadProgress(novelId: string): ChapterProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const all = JSON.parse(raw);
      return all[novelId] ?? null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** 保存某本小说的阅读进度 */
export function saveProgress(novelId: string, p: ChapterProgress) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[novelId] = p;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
