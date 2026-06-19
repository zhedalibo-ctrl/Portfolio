import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;
export type Novel = CollectionEntry<'novels'>;
export type Chapter = CollectionEntry<'chapters'>;
export type Tool = CollectionEntry<'tools'>;

/** 是否为已发布（过滤 draft） */
function isPublished<T extends { data: { draft?: boolean } }>(e: T) {
  return import.meta.env.PROD ? !e.data.draft : true;
}

// ---------- 文章 ----------
export async function getArticles() {
  const all = await getCollection('articles');
  return all
    .filter(isPublished)
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

export async function getFeaturedArticles(limit = 3) {
  const articles = await getArticles();
  const featured = articles.filter((a) => a.data.featured);
  return (featured.length ? featured : articles).slice(0, limit);
}

// ---------- 小说 ----------
export async function getNovels() {
  const all = await getCollection('novels');
  return all
    .filter(isPublished)
    .sort((a, b) => {
      const ta = a.data.startedAt?.getTime() ?? 0;
      const tb = b.data.startedAt?.getTime() ?? 0;
      return tb - ta;
    });
}

export async function getFeaturedNovels(limit = 3) {
  const novels = await getNovels();
  const featured = novels.filter((n) => n.data.featured);
  return (featured.length ? featured : novels).slice(0, limit);
}

/** 取一部小说的全部章节（按 chapter 序号升序） */
export async function getChaptersOf(novelId: string) {
  const all = await getCollection('chapters');
  return all
    .filter((c) => c.id.startsWith(`${novelId}/`) && isPublished(c))
    .sort((a, b) => a.data.chapter - b.data.chapter);
}

// ---------- 工具 ----------
export async function getTools() {
  const all = await getCollection('tools');
  // featured 优先，其次保持原序
  return all.filter(isPublished).sort((a, b) => {
    const fa = a.data.featured ? 1 : 0;
    const fb = b.data.featured ? 1 : 0;
    return fb - fa;
  });
}

export async function getFeaturedTools(limit = 3) {
  const tools = await getTools();
  const featured = tools.filter((t) => t.data.featured);
  return (featured.length ? featured : tools).slice(0, limit);
}

// ---------- 通用工具 ----------
/** 格式化日期为 YYYY-MM-DD */
export function fmtDate(d: Date) {
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/** 读取量数字格式化：1.2k / 12k */
export function fmtViews(n: number) {
  if (n < 1000) return `${n}`;
  if (n < 10000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n / 1000)}k`;
}

/** 生成作品 slug（去掉可能的 index 后缀） */
export function slugOf(entry: { id: string }) {
  return entry.id.replace(/\/index$/, '');
}
