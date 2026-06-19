# AI 内容发布接口

让 AI（如智谱 OpenCloud / 智能体）通过 HTTP 接口把文章、小说、工具内容发布到个人作品网站。

## 架构

```
AI 生成内容
   │  POST /api/articles  (Header: X-API-Key)
   ▼
发布接口（本地 Node 服务 / 生产 Cloudflare Worker）
   │  校验 → 生成 Markdown 文件
   │  本地：直接写 src/content/
   │  生产：提交到 GitHub 草稿分支 → 发 PR
   ▼
网站读取 Markdown 渲染（草稿状态，审核后上线）
```

## 两种模式

| | 本地模式 | 生产模式 |
|---|---|---|
| 实现 | `scripts/local-server.mjs`（Node） | `worker/`（Cloudflare Worker） |
| 内容去向 | 直接写 `src/content/` 文件 | 提交到 GitHub 草稿分支并发 PR |
| 用途 | 开发/验证 | 真实发布 |
| 启动 | `npm run serve:api` | `cd worker && npm run deploy` |

两种模式共用 `worker/src/schema.ts` 和 `worker/src/markdown.ts`，**校验与文件生成逻辑完全一致**。

---

## 一、本地验证（5 分钟跑通）

### 1. 启动网站
```bash
npm run dev          # 网站在 http://localhost:4321
```

### 2. 启动发布接口（另开终端）
```bash
npm run serve:api    # 接口在 http://localhost:8787
```
默认 API Key：`dev-test-key`（见 `scripts/local-server.mjs`，可用环境变量 `API_KEY` 覆盖）

### 3. 模拟 AI 发布
```bash
npm run test:publish              # 发布全部示例（文章/小说/章节/工具）
node scripts/test-publish.mjs article   # 只发文章
```

### 4. 查看效果
- 打开 http://localhost:4321/articles → 看到新文章「测试文章」
- 检查 `src/content/articles/test-article/index.md` 已生成
- 内容默认带 `draft: true`：本地可见，生产构建隐藏

### 5. 清理测试数据
```bash
rm -rf src/content/articles/test-article src/content/novels/test-novel src/content/tools/test-tool
```

---

## 二、API 接口文档（给智谱配置用）

### 通用规则
- 鉴权：所有请求带 Header `X-API-Key: <密钥>`
- 方法：`POST`，Body 为 JSON
- 健康检查：`GET /api/health`（无需鉴权）

### 1. 发布文章

`POST /api/articles`

```jsonc
{
  "slug": "ai-writing-tips",        // 必填，URL标识，仅小写字母/数字/短横线
  "title": "标题",                   // 必填
  "summary": "一句话摘要",           // 必填
  "content": "正文内容",             // 必填
  "contentFormat": "markdown",       // markdown | html（html走公众号原排版）
  "platform": "公众号",              // 公众号|知乎|掘金|本站|其他
  "sourceUrl": "https://...",        // 可选，外链原文
  "tags": ["AI", "写作"],            // 可选
  "publishedAt": "2026-03-12",       // 可选，默认今天
  "featured": false,                 // 可选，是否首页精选
  "draft": true                      // 可选，默认true（草稿，需审核）
}
```

**公众号 HTML 文章示例**（保留原始排版）：
```bash
curl -X POST http://localhost:8787/api/articles \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-test-key" \
  -d '{
    "slug": "my-post",
    "title": "我的公众号文章",
    "summary": "摘要",
    "content": "<section style=\"color:#2563eb\">带样式的正文</section>",
    "contentFormat": "html",
    "platform": "公众号",
    "sourceUrl": "https://mp.weixin.qq.com/...",
    "draft": true
  }'
```

### 2. 发布小说

`POST /api/novels`

```jsonc
{
  "slug": "starship-log",
  "title": "星舰日志",
  "summary": "简介",
  "genre": "科幻",                  // 科幻|都市|悬疑|奇幻|历史|言情|其他
  "status": "连载中",                // 连载中|已完结|暂停
  "intro": "小说主页正文（Markdown）", // 可选
  "tags": ["科幻"],
  "draft": true
}
```

### 3. 给小说追加章节

`POST /api/novels/:slug/chapters`

```jsonc
{
  "chapter": 3,                     // 必填，正整数
  "title": "第三章 抉择",
  "content": "章节正文（Markdown）",
  "draft": true
}
```

### 4. 发布工具

`POST /api/tools`

```jsonc
{
  "slug": "moqian",
  "name": "墨签",
  "tagline": "一句话卖点",          // 必填
  "description": "详细介绍（Markdown）", // 必填
  "type": "小工具",                  // APP|SaaS|小工具|其他
  "url": "https://...",
  "repo": "https://github.com/...", // 可选
  "stack": ["Astro", "Cloudflare"],
  "status": "运营中",                // 运营中|开发中|已下线
  "draft": true
}
```

### 响应

成功（201）：
```json
{ "ok": true, "path": "src/content/articles/my-post/index.md", "draft": true }
```
失败（422 校验错误）：
```json
{ "ok": false, "error": "校验失败", "details": [{ "field": "title", "msg": "必填" }] }
```

---

## 三、生产部署（Cloudflare Worker + GitHub）

### 1. 准备 GitHub 仓库
- 把网站代码推到 GitHub 仓库
- 网站 main 分支连接 Cloudflare Pages（推送即自动构建）

### 2. 创建 GitHub Token
- GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
- 权限：仅目标仓库 → Contents: Read and write
- 复制 token

### 3. 部署 Worker
```bash
cd worker
npm install

# 设置密钥（交互式输入）
npx wrangler secret put API_KEY        # 自定义一个强密钥，给智谱用
npx wrangler secret put GH_TOKEN       # 粘贴上一步的 GitHub token
npx wrangler secret put GH_REPO        # owner/repo
npx wrangler secret put GH_BRANCH      # content/draft

# 部署
npm run deploy
```

### 4. 给智谱配置
- 把 Worker 地址（如 `https://portfolio-publish.<你>.workers.dev`）和 `API_KEY` 配置到智谱的 HTTP 工具/函数调用
- 把本文件「API 接口文档」部分给智谱作为工具说明

### 5. 审核流程
- AI 调接口 → Worker 提交到 `content/draft` 分支 → 自动发草稿 PR
- 你在 GitHub review PR（检查 frontmatter + 正文）
- 合并到 main → Cloudflare Pages 自动构建 → 上线

---

## 四、目录结构

```
worker/                       生产 Worker（Cloudflare）
├── src/
│   ├── index.ts              Worker 入口：路由+鉴权+GitHub提交
│   ├── schema.ts             zod 校验 schema（与网站共用枚举值）
│   ├── markdown.ts           入参 → Markdown 文件
│   └── github.ts             GitHub API 封装
├── wrangler.toml
└── package.json

scripts/
├── local-server.mjs          本地模式 Node 服务（与 Worker 同逻辑）
└── test-publish.mjs          测试脚本：模拟 AI 发布
```

## 五、安全注意
- `API_KEY` 用强随机串，勿提交到仓库
- GitHub Token 用细粒度 PAT，仅授权目标仓库
- Worker 有 256KB 请求体限制、可加速率限制
- 草稿默认 `draft: true`，AI 误生成也不会直接上线
