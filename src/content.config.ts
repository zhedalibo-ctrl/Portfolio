import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ========== 文章 ==========
const articles = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      platform: z.enum(['公众号', '知乎', '掘金', '本站', '其他']).default('本站'),
      sourceUrl: z.string().url().optional(),  // 外链阅读原文
      cover: image().optional(),               // 可选封面
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      // 原始 HTML（如公众号搬运）：存在则跳过 Markdown 渲染，原样注入
      contentHtml: z.string().optional(),
    }),
});

// ========== 小说 ==========
const novels = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/novels' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      genre: z.enum(['科幻', '都市', '悬疑', '奇幻', '历史', '言情', '其他']).default('其他'),
      status: z.enum(['连载中', '已完结', '暂停']).default('连载中'),
      cover: image().optional(),
      author: z.string().optional(),
      startedAt: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

// ========== 小说章节（与小说同目录下的 chapter-XX.md） ==========
const chapters = defineCollection({
  loader: glob({ pattern: '**/chapter-*.md', base: './src/content/novels' }),
  schema: z.object({
    chapter: z.number(),
    title: z.string(),
    publishedAt: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

// ========== 工具 / SaaS ==========
const tools = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/tools' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      tagline: z.string(),                 // 一句话卖点
      description: z.string(),             // 详细描述
      type: z.enum(['APP', 'SaaS', '小工具', '其他']).default('小工具'),
      url: z.string().url().optional(),    // 访问地址
      repo: z.string().url().optional(),   // 仓库
      cover: image().optional(),
      stack: z.array(z.string()).default([]),
      status: z.enum(['运营中', '开发中', '已下线']).default('开发中'),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

export const collections = { articles, novels, chapters, tools };
