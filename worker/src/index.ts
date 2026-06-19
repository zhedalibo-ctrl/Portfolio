import {
  articleSchema,
  novelSchema,
  chapterSchema,
  toolSchema,
  formatZodError,
} from './schema';
import { genArticle, genNovel, genChapter, genTool } from './markdown';
import { commitFile, createPR } from './github';

interface Env {
  API_KEY: string;
  GH_TOKEN: string;
  GH_REPO: string;
  GH_BRANCH: string;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*',
    },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // CORS 预检
    if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

    const url = new URL(req.url);
    const { pathname } = url;

    // 健康检查（无需鉴权）
    if (pathname === '/api/health') return json(200, { ok: true, mode: 'github' });

    // 鉴权
    const key = req.headers.get('x-api-key');
    if (key !== env.API_KEY) return json(401, { ok: false, error: '无效的 API Key' });

    if (req.method !== 'POST') return json(405, { ok: false, error: '仅支持 POST' });

    // 请求体大小限制（256KB）
    const cl = Number(req.headers.get('content-length') || 0);
    if (cl > 256 * 1024) return json(413, { ok: false, error: '请求体过大（>256KB）' });

    let data: unknown;
    try {
      data = await req.json();
    } catch {
      return json(400, { ok: false, error: '请求体不是合法 JSON' });
    }

    // 统一发布：校验 → 生成文件 → 提交 GitHub → 发 PR
    async function publish(
      schema: typeof articleSchema,
      gen: (d: any) => { path: string; content: string },
      prTitle: string,
    ) {
      const parsed = schema.safeParse(data);
      if (!parsed.success)
        return json(422, { ok: false, error: '校验失败', details: formatZodError(parsed.error) });

      const file = gen(parsed.data);
      try {
        await commitFile(env, `src/content/${file.path}`, file.content, `publish: ${prTitle}`);
        const { prUrl } = await createPR(env, prTitle, `新增/更新内容：${file.path}`);
        return json(201, {
          ok: true,
          path: file.path,
          draft: (parsed.data as any).draft,
          prUrl,
        });
      } catch (e: any) {
        return json(e.status || 502, { ok: false, error: e.message });
      }
    }

    // ---------- 文章 ----------
    if (pathname === '/api/articles')
      return publish(articleSchema, genArticle, `文章：${(data as any)?.title ?? ''}`);

    // ---------- 小说 ----------
    if (pathname === '/api/novels')
      return publish(novelSchema, genNovel, `小说：${(data as any)?.title ?? ''}`);

    // ---------- 小说章节 ----------
    const chapterMatch = pathname.match(/^\/api\/novels\/([^/]+)\/chapters$/);
    if (chapterMatch) {
      const novelSlug = chapterMatch[1];
      return publish(
        chapterSchema,
        (d) => genChapter(novelSlug, d),
        `《${novelSlug}》新章节：第 ${(data as any)?.chapter ?? '?'} 章`,
      );
    }

    // ---------- 工具 ----------
    if (pathname === '/api/tools')
      return publish(toolSchema, genTool, `工具：${(data as any)?.name ?? ''}`);

    return json(404, { ok: false, error: `未知路由：${req.method} ${pathname}` });
  },
};
