#!/usr/bin/env node
// 模拟 AI 调用发布接口，验证本地链路
// 用法：先启动本地服务（npm run serve），再跑本脚本
//   node scripts/test-publish.mjs [type]
//   type: article | novel | tool | chapter | all（默认 all）

const BASE = process.env.BASE || 'http://localhost:8787';
const API_KEY = process.env.API_KEY || 'dev-test-key';

const type = process.argv[2] || 'all';

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  console.log(`${res.status}  POST ${path}`);
  console.log(JSON.stringify(data, null, 2));
  console.log('');
  return { ok: res.ok, data };
}

async function health() {
  const res = await fetch(`${BASE}/api/health`);
  const data = await res.json();
  console.log(`健康检查：${res.status}`, JSON.stringify(data));
  if (!data.ok) {
    console.error('❌ 服务未启动？请先运行：npm run serve');
    process.exit(1);
  }
  console.log('');
}

// ---------- 各类示例内容 ----------

const article = {
  slug: 'test-article',
  title: '测试文章：AI 接口发布验证',
  summary: '这是一篇通过发布接口生成的测试文章，用于验证 AI → 接口 → 网站的链路。',
  content: '## 验证成功\n\n如果你能在网站上看到这篇文章，说明发布接口工作正常。\n\n- 链路：AI → 接口 → Markdown 文件 → 网站渲染\n- 这篇带 `draft: true`，本地可见，生产隐藏\n',
  contentFormat: 'markdown',
  platform: '本站',
  tags: ['测试', 'AI'],
  draft: true,
};

const novel = {
  slug: 'test-novel',
  title: '测试小说：接口发布',
  summary: '一部用于验证发布接口的测试小说。',
  genre: '科幻',
  status: '连载中',
  intro: '> 这是一本测试小说。\n\n主角醒来，发现自己身处一个被接口定义的世界。',
  tags: ['测试'],
  draft: true,
};

const chapter = {
  chapter: 1,
  title: '第一章 醒来',
  content: '光透过数据流洒下，主角睁开眼。\n\n"你是由 API 创建的。"一个声音说。',
  draft: true,
};

const tool = {
  slug: 'test-tool',
  name: '测试工具',
  tagline: '一个验证发布接口的测试工具',
  description: '## 简介\n\n这是一个通过发布接口创建的测试工具卡片。',
  type: '小工具',
  url: 'https://example.com',
  stack: ['Astro', 'Cloudflare'],
  status: '开发中',
  draft: true,
};

// ---------- 执行 ----------

(async () => {
  await health();

  if (type === 'article' || type === 'all') {
    console.log('📝 发布文章...');
    await post('/api/articles', article);
  }
  if (type === 'novel' || type === 'all') {
    console.log('📖 发布小说...');
    await post('/api/novels', novel);
  }
  if (type === 'chapter' || type === 'all') {
    console.log('📖 追加章节...');
    await post('/api/novels/test-novel/chapters', chapter);
  }
  if (type === 'tool' || type === 'all') {
    console.log('🛠️ 发布工具...');
    await post('/api/tools', tool);
  }

  console.log('✅ 完成。检查 src/content/ 下是否生成了对应文件。');
  console.log('   网站本地预览（需另开终端）：npm run dev');
})();
