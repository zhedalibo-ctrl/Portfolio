import { useEffect, useRef, useState } from 'react';
import {
  type ReaderSettings,
  type ReaderTheme,
  type ReaderFont,
  type FontSize,
  FONT_SIZE_PX,
  THEME_LABELS,
  FONT_LABELS,
  SIZE_LABELS,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  loadProgress,
  saveProgress,
} from '@/lib/reader';

export interface TocItem {
  slug: string;
  chapter: number;
  title: string;
}

interface Props {
  novelId: string;
  novelTitle: string;
  currentChapterSlug: string;
  currentChapter: number;
  toc: TocItem[];
  /** 章节页基础路径，如 /novels/starship-log */
  baseHref: string;
}

const THEMES: ReaderTheme[] = ['light', 'sepia', 'dark'];
const FONTS: ReaderFont[] = ['serif', 'sans'];
const SIZES: FontSize[] = ['sm', 'md', 'lg', 'xl'];

export default function ReaderToolbar({
  novelId,
  novelTitle,
  currentChapterSlug,
  currentChapter,
  toc,
  baseHref,
}: Props) {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [progress, setProgress] = useState(0);
  const restoreRef = useRef<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初始化：加载偏好 + 恢复阅读位置
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);

    const p = loadProgress(novelId);
    // 仅当进度记录的是当前章，才恢复滚动位置
    if (p && p.chapter === currentChapterSlug) {
      restoreRef.current = p.scrollTop;
      requestAnimationFrame(() => {
        window.scrollTo({ top: p.scrollTop, behavior: 'instant' as ScrollBehavior });
      });
    }
  }, [novelId, currentChapterSlug]);

  // 应用设置到 .reader 容器
  useEffect(() => {
    const reader = document.querySelector('.reader') as HTMLElement | null;
    if (!reader) return;
    reader.dataset.theme = settings.theme;
    reader.dataset.font = settings.font;
    reader.style.setProperty('--reader-font-size', `${FONT_SIZE_PX[settings.fontSize]}px`);
    saveSettings(settings);
  }, [settings]);

  // 滚动监听：更新进度条 + 防抖保存进度
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? Math.min(100, (scrollTop / max) * 100) : 0;
      setProgress(pct);

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveProgress(novelId, {
          chapter: currentChapterSlug,
          scrollTop,
          ts: Date.now(),
        });
      }, 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [novelId, currentChapterSlug]);

  // 关闭抽屉的 ESC 支持
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowToc(false);
        setShowSettings(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const currentIndex = toc.findIndex((t) => t.slug === currentChapterSlug);
  const prev = currentIndex > 0 ? toc[currentIndex - 1] : null;
  const next = currentIndex < toc.length - 1 ? toc[currentIndex + 1] : null;

  const btnBase =
    'inline-flex items-center justify-center gap-1.5 text-sm transition-colors';

  return (
    <>
      {/* 进度条 */}
      <div className="read-progress" style={{ width: `${progress}%` }} />

      {/* 顶部工具栏（固定在 header 下方） */}
      <div
        className="sticky top-16 z-30 -mx-6 sm:mx-0 px-4 sm:px-6 py-2.5 mb-6 flex items-center justify-between border-b border-border-soft"
        style={{ backgroundColor: 'rgb(var(--color-surface) / 0.9)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center gap-1">
          <button
            className={`${btnBase} px-3 py-1.5 rounded-md hover:bg-[rgb(var(--color-surface-2))] text-[rgb(var(--color-muted))]`}
            onClick={() => setShowToc(true)}
            aria-label="目录"
            title="目录"
          >
            ☰ <span className="hidden sm:inline">目录</span>
          </button>
          <span className="text-xs text-[rgb(var(--color-faint))] px-2">
            第 {currentChapter} 章 · {currentIndex + 1}/{toc.length}
          </span>
        </div>

        <button
          className={`${btnBase} px-3 py-1.5 rounded-md hover:bg-[rgb(var(--color-surface-2))] text-[rgb(var(--color-muted))]`}
          onClick={() => setShowSettings((v) => !v)}
          aria-label="阅读设置"
          title="阅读设置"
        >
          ⚙ <span className="hidden sm:inline">设置</span>
        </button>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="-mx-6 sm:mx-0 mb-6 p-5 sm:rounded-xl border border-border-soft bg-[rgb(var(--color-surface))]">
          <div className="grid gap-5 sm:grid-cols-3">
            <SettingGroup label="主题">
              {THEMES.map((t) => (
                <Chip
                  key={t}
                  active={settings.theme === t}
                  onClick={() => setSettings((s) => ({ ...s, theme: t }))}
                >
                  {THEME_LABELS[t]}
                </Chip>
              ))}
            </SettingGroup>

            <SettingGroup label="字体">
              {FONTS.map((f) => (
                <Chip
                  key={f}
                  active={settings.font === f}
                  onClick={() => setSettings((s) => ({ ...s, font: f }))}
                >
                  {FONT_LABELS[f]}
                </Chip>
              ))}
            </SettingGroup>

            <SettingGroup label="字号">
              {SIZES.map((sz) => (
                <Chip
                  key={sz}
                  active={settings.fontSize === sz}
                  onClick={() => setSettings((s) => ({ ...s, fontSize: sz }))}
                >
                  {SIZE_LABELS[sz]}
                </Chip>
              ))}
            </SettingGroup>
          </div>
        </div>
      )}

      {/* 目录抽屉 */}
      {showToc && (
        <>
          <div className="toc-overlay" onClick={() => setShowToc(false)} />
          <aside className="toc-drawer" data-open="true">
            <div className="p-5 border-b border-border-soft">
              <div className="flex items-center justify-between">
                <a
                  href={`${baseHref}/`}
                  className="font-serif text-lg font-bold text-[rgb(var(--color-text))]"
                >
                  {novelTitle}
                </a>
                <button
                  className="text-[rgb(var(--color-faint))] hover:text-[rgb(var(--color-text))] text-xl leading-none px-2"
                  onClick={() => setShowToc(false)}
                  aria-label="关闭目录"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-[rgb(var(--color-faint))] mt-1">共 {toc.length} 章</p>
            </div>
            <ul>
              {toc.map((t) => {
                const isCurrent = t.slug === currentChapterSlug;
                return (
                  <li key={t.slug}>
                    <a
                      href={`${baseHref}/${t.slug}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[rgb(var(--color-surface-2))] transition-colors border-b border-border-soft"
                      style={
                        isCurrent
                          ? {
                              backgroundColor: 'rgb(var(--color-accent-soft))',
                              color: 'rgb(var(--color-accent))',
                            }
                          : undefined
                      }
                    >
                      <span className="text-xs w-7 shrink-0 tabular-nums opacity-70">
                        {String(t.chapter).padStart(2, '0')}
                      </span>
                      <span className="text-sm flex-1 truncate">{t.title}</span>
                      {isCurrent && <span className="text-xs">●</span>}
                    </a>
                  </li>
                );
              })}
            </ul>

            {/* 抽屉底部：上下章快捷 */}
            <div className="sticky bottom-0 flex border-t border-border bg-[rgb(var(--color-surface))]">
              {prev ? (
                <a
                  href={`${baseHref}/${prev.slug}`}
                  className="flex-1 py-3 text-center text-sm text-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-accent))] border-r border-border-soft"
                >
                  ← 上一章
                </a>
              ) : (
                <span className="flex-1 py-3 text-center text-sm text-[rgb(var(--color-faint))] opacity-50 border-r border-border-soft">
                  ← 上一章
                </span>
              )}
              {next ? (
                <a
                  href={`${baseHref}/${next.slug}`}
                  className="flex-1 py-3 text-center text-sm text-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-accent))]"
                >
                  下一章 →
                </a>
              ) : (
                <span className="flex-1 py-3 text-center text-sm text-[rgb(var(--color-faint))] opacity-50">
                  下一章 →
                </span>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[rgb(var(--color-faint))] mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-md text-sm transition-colors border"
      style={
        active
          ? {
              backgroundColor: 'rgb(var(--color-accent))',
              color: '#fff',
              borderColor: 'rgb(var(--color-accent))',
            }
          : {
              backgroundColor: 'rgb(var(--color-surface-2))',
              color: 'rgb(var(--color-text-soft))',
              borderColor: 'rgb(var(--color-border-soft))',
            }
      }
    >
      {children}
    </button>
  );
}
