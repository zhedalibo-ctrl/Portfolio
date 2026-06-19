import type {
  ArticleInput,
  NovelInput,
  ChapterInput,
  ToolInput,
} from './schema';

// =========================================================
// YAML frontmatter 序列化
// 处理字符串引号、多行字符串、数组等
// =========================================================

function yamlString(s: string): string {
  // 含特殊字符或冒号时加双引号并转义内部双引号
  if (/[:#\[\]{}&,*?|>!%@`"'\n]/.test(s) || s === '') {
    return `"${s.replace(/"/g, '\\"')}"`;
  }
  return s;
}

function yamlArray(arr: string[]): string {
  if (arr.length === 0) return '[]';
  return `[${arr.map((x) => yamlString(x)).join(', ')}]`;
}

/** 多行字符串用 block scalar `|`，保留换行（公众号 HTML/小说正文必需） */
function yamlBlock(s: string): string {
  const lines = s.split('\n');
  if (lines.length <= 1) return yamlString(s);
  const indented = lines.map((l) => `  ${l}`).join('\n');
  return `|\n${indented}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// =========================================================
// 各类作品的 Markdown 生成
// 返回 { path, content } —— path 相对 content 根目录
// =========================================================

export interface GeneratedFile {
  path: string; // 相对 content 目录，如 articles/ai-writing/index.md
  content: string; // 完整 .md 文件内容
}

export function genArticle(input: ArticleInput): GeneratedFile {
  const date = input.publishedAt ?? today();
  const isHtml = input.contentFormat === 'html';

  const fm: string[] = [
    '---',
    `title: ${yamlString(input.title)}`,
    `summary: ${yamlString(input.summary)}`,
    `publishedAt: ${date}`,
    `platform: ${input.platform}`,
  ];
  if (input.sourceUrl) fm.push(`sourceUrl: ${yamlString(input.sourceUrl)}`);
  fm.push(`tags: ${yamlArray(input.tags)}`);
  fm.push(`featured: ${input.featured}`);
  fm.push(`draft: ${input.draft}`);
  if (isHtml) {
    fm.push(`contentHtml: ${yamlBlock(input.content)}`);
  }
  fm.push('---');

  const body = isHtml ? '' : `\n${input.content.trim()}\n`;
  return {
    path: `articles/${input.slug}/index.md`,
    content: `${fm.join('\n')}\n${body}`,
  };
}

export function genNovel(input: NovelInput): GeneratedFile {
  const date = input.startedAt ?? today();
  const fm: string[] = [
    '---',
    `title: ${yamlString(input.title)}`,
    `summary: ${yamlString(input.summary)}`,
    `genre: ${input.genre}`,
    `status: ${input.status}`,
  ];
  fm.push(`startedAt: ${date}`);
  fm.push(`tags: ${yamlArray(input.tags)}`);
  fm.push(`featured: ${input.featured}`);
  fm.push(`draft: ${input.draft}`);
  fm.push('---');

  const body = input.intro ? `\n${input.intro.trim()}\n` : '\n';
  return {
    path: `novels/${input.slug}/index.md`,
    content: `${fm.join('\n')}\n${body}`,
  };
}

export function genChapter(
  novelSlug: string,
  input: ChapterInput,
): GeneratedFile {
  const date = input.publishedAt ?? today();
  const fm: string[] = [
    '---',
    `chapter: ${input.chapter}`,
    `title: ${yamlString(input.title)}`,
    `publishedAt: ${date}`,
    `draft: ${input.draft}`,
    '---',
  ];
  return {
    path: `novels/${novelSlug}/chapter-${String(input.chapter).padStart(2, '0')}.md`,
    content: `${fm.join('\n')}\n\n${input.content.trim()}\n`,
  };
}

export function genTool(input: ToolInput): GeneratedFile {
  const fm: string[] = [
    '---',
    `name: ${yamlString(input.name)}`,
    `tagline: ${yamlString(input.tagline)}`,
    `description: ${yamlString(input.description.trim())}`,
    `type: ${input.type}`,
  ];
  if (input.url) fm.push(`url: ${yamlString(input.url)}`);
  if (input.repo) fm.push(`repo: ${yamlString(input.repo)}`);
  fm.push(`stack: ${yamlArray(input.stack)}`);
  fm.push(`status: ${input.status}`);
  fm.push(`featured: ${input.featured}`);
  fm.push(`draft: ${input.draft}`);
  fm.push('---');

  // 正文用 description（详情页 <Content /> 会渲染它）
  return {
    path: `tools/${input.slug}/index.md`,
    content: `${fm.join('\n')}\n\n${input.description.trim()}\n`,
  };
}
