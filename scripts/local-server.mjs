// 本地模式：Node HTTP 服务，直接写文件到网站 content 目录
// 与生产 Worker 共用 schema.ts / markdown.ts，行为一致
// 用法：node scripts/local-server.mjs

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  articleSchema,
  novelSchema,
  chapterSchema,
  toolSchema,
  formatZodError,
} from '../worker/src/schema.ts';
import {
  genArticle,
  genNovel,
  genChapter,
  genTool,
} from '../worker/src/markdown.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src', 'content');
const API_KEY = process.env.API_KEY || 'dev-test-key';
const PORT = Number(process.env.PORT || 8787);

// ---------- 文件写入 ----------
function writeFile(relPath, content) {
  const abs = path.join(CONTENT_DIR, relPath);
  if (fs.existsSync(abs)) {
    throw Object.assign(new Error(`文件已存在：${relPath}（如需覆盖请先删除或加 overwrite）`), {
      status: 409,
    });
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
  return path.relative(ROOT, abs).replaceAll(path.sep, '/');
}

function listDir(sub) {
  const dir = path.join(CONTENT_DIR, sub);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map((d) => d);
}

// ---------- 响应工具 ----------
function json(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': '*',
  });
  res.end(JSON.stringify(body));
}

// ---------- 路由 ----------
const server = http.createServer((req, res) => {
  // CORS 预检
  if (req.method === 'OPTIONS') return json(res, 204, {});

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname } = url;

  // 健康检查（无需鉴权）
  if (pathname === '/api/health') return json(res, 200, { ok: true, mode: 'local' });

  // 鉴权
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) return json(res, 401, { ok: false, error: '无效的 API Key' });

  // 仅处理 POST
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: '仅支持 POST' });

  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    let data;
    try {
      data = JSON.parse(body || '{}');
    } catch {
      return json(res, 400, { ok: false, error: '请求体不是合法 JSON' });
    }

    try {
      // ---------- 文章 ----------
      if (pathname === '/api/articles') {
        const parsed = articleSchema.safeParse(data);
        if (!parsed.success)
          return json(res, 422, { ok: false, error: '校验失败', details: formatZodError(parsed.error) });
        const file = genArticle(parsed.data);
        const created = writeFile(file.path, file.content);
        return json(res, 201, { ok: true, path: created, draft: parsed.data.draft });
      }

      // ---------- 小说 ----------
      if (pathname === '/api/novels') {
        const parsed = novelSchema.safeParse(data);
        if (!parsed.success)
          return json(res, 422, { ok: false, error: '校验失败', details: formatZodError(parsed.error) });
        const file = genNovel(parsed.data);
        const created = writeFile(file.path, file.content);
        return json(res, 201, { ok: true, path: created, draft: parsed.data.draft });
      }

      // ---------- 小说章节 ----------
      const chapterMatch = pathname.match(/^\/api\/novels\/([^/]+)\/chapters$/);
      if (chapterMatch) {
        const novelSlug = chapterMatch[1];
        const parsed = chapterSchema.safeParse(data);
        if (!parsed.success)
          return json(res, 422, { ok: false, error: '校验失败', details: formatZodError(parsed.error) });
        const file = genChapter(novelSlug, parsed.data);
        const created = writeFile(file.path, file.content);
        return json(res, 201, { ok: true, path: created, draft: parsed.data.draft });
      }

      // ---------- 工具 ----------
      if (pathname === '/api/tools') {
        const parsed = toolSchema.safeParse(data);
        if (!parsed.success)
          return json(res, 422, { ok: false, error: '校验失败', details: formatZodError(parsed.error) });
        const file = genTool(parsed.data);
        const created = writeFile(file.path, file.content);
        return json(res, 201, { ok: true, path: created, draft: parsed.data.draft });
      }

      return json(res, 404, { ok: false, error: `未知路由：${req.method} ${pathname}` });
    } catch (e) {
      const status = e.status || 500;
      return json(res, status, { ok: false, error: e.message });
    }
  });
});

server.listen(PORT, () => {
  console.log(`✓ 本地发布服务已启动：http://localhost:${PORT}`);
  console.log(`  内容目录：${CONTENT_DIR}`);
  console.log(`  API Key ：${API_KEY}`);
  console.log(`  健康检查：GET /api/health`);
  console.log(`  示例：POST /api/articles`);
});
