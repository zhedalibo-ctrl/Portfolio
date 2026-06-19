import { z } from 'zod';

// =========================================================
// 枚举值必须与网站 src/content.config.ts 保持一致
// 改动任一处时同步更新另一处
// =========================================================

export const PLATFORMS = ['公众号', '知乎', '掘金', '本站', '其他'] as const;
export const GENRES = ['科幻', '都市', '悬疑', '奇幻', '历史', '言情', '其他'] as const;
export const NOVEL_STATUS = ['连载中', '已完结', '暂停'] as const;
export const TOOL_TYPES = ['APP', 'SaaS', '小工具', '其他'] as const;
export const TOOL_STATUS = ['运营中', '开发中', '已下线'] as const;

// slug 规则：英文小写字母/数字/短横线
const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

// =========================================================
// 接口入参 schema
// =========================================================

export const articleSchema = z.object({
  slug: z.string().regex(slugRegex, 'slug 只能含小写字母、数字、短横线'),
  title: z.string().min(1, '标题必填'),
  summary: z.string().min(1, '摘要必填'),
  content: z.string().min(1, '正文必填'),
  contentFormat: z.enum(['markdown', 'html']).default('markdown'),
  platform: z.enum(PLATFORMS).default('本站'),
  sourceUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  publishedAt: z.string().optional(), // YYYY-MM-DD，默认今天
  featured: z.boolean().default(false),
  draft: z.boolean().default(true),
});

export const novelSchema = z.object({
  slug: z.string().regex(slugRegex),
  title: z.string().min(1),
  summary: z.string().min(1),
  genre: z.enum(GENRES).default('其他'),
  status: z.enum(NOVEL_STATUS).default('连载中'),
  intro: z.string().optional(), // 小说主页正文（Markdown）
  tags: z.array(z.string()).default([]),
  startedAt: z.string().optional(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(true),
});

export const chapterSchema = z.object({
  chapter: z.number().int().positive('章节序号为正整数'),
  title: z.string().min(1),
  content: z.string().min(1),
  publishedAt: z.string().optional(),
  draft: z.boolean().default(true),
});

export const toolSchema = z.object({
  slug: z.string().regex(slugRegex),
  name: z.string().min(1),
  tagline: z.string().min(1, 'tagline（一句话卖点）必填'),
  description: z.string().min(1),
  type: z.enum(TOOL_TYPES).default('小工具'),
  url: z.string().url().optional(),
  repo: z.string().url().optional(),
  stack: z.array(z.string()).default([]),
  status: z.enum(TOOL_STATUS).default('开发中'),
  featured: z.boolean().default(false),
  draft: z.boolean().default(true),
});

export type ArticleInput = z.infer<typeof articleSchema>;
export type NovelInput = z.infer<typeof novelSchema>;
export type ChapterInput = z.infer<typeof chapterSchema>;
export type ToolInput = z.infer<typeof toolSchema>;

/** 把 zod 错误转成简洁的 {field, msg} 数组 */
export function formatZodError(err: z.ZodError) {
  return err.issues.map((i) => ({
    field: i.path.join('.'),
    msg: i.message,
  }));
}
