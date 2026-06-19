# 个人作品网站 · 内容发布接口（给 AI 使用）

把这份文档发给 AI（智谱/OpenCloud/任意 Agent），它就能学会如何把内容发布到个人作品网站。

## 基础信息

- **接口地址**：`https://portfolio-publish.zhedalibo.workers.dev`
- **鉴权方式**：所有请求带 Header `X-API-Key: 06c38b22f068d23777f4ab20131b7a67e380ffbd558cb273`
- **请求格式**：`POST`，Body 为 JSON，Header 含 `Content-Type: application/json`
- **发布流程**：调用接口 → 自动提交到 GitHub 草稿分支 → 生成 PR → 人工审核合并后上线
- **所有内容默认为草稿**（`draft: true`），需网站主人审核后才会公开

---

## 接口列表

### 1. 发布文章

`POST /api/articles`

**用途**：发布公众号文章、博客文章、技术分享等。

**请求体**：
```json
{
  "slug": "my-article",              // 必填。URL标识，仅小写字母/数字/短横线，如 "ai-writing-tips"
  "title": "文章标题",                // 必填
  "summary": "一句话摘要",            // 必填
  "content": "正文内容",              // 必填。Markdown 或 HTML
  "contentFormat": "markdown",        // markdown | html。html 用于公众号带样式排版
  "platform": "公众号",               // 公众号 | 知乎 | 掘金 | 本站 | 其他
  "sourceUrl": "https://...",         // 可选。原文链接（外链阅读用）
  "tags": ["标签1", "标签2"],          // 可选
  "publishedAt": "2026-03-12",        // 可选。YYYY-MM-DD，默认今天
  "featured": false,                  // 可选。是否首页精选
  "draft": true                       // 可选。默认 true
}
```

**示例（Markdown 文章）**：
```bash
curl -X POST https://portfolio-publish.zhedalibo.workers.dev/api/articles \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 06c38b22f068d23777f4ab20131b7a67e380ffbd558cb273" \
  -d '{
    "slug": "my-new-post",
    "title": "我的新文章",
    "summary": "这是摘要",
    "content": "## 正文标题\n\n这里是正文。\n\n- 要点一\n- 要点二",
    "contentFormat": "markdown",
    "platform": "本站",
    "tags": ["AI", "思考"],
    "draft": true
  }'
```

**示例（公众号 HTML 文章，保留原排版）**：
```bash
curl -X POST https://portfolio-publish.zhedalibo.workers.dev/api/articles \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 06c38b22f068d23777f4ab20131b7a67e380ffbd558cb273" \
  -d '{
    "slug": "wechat-article",
    "title": "公众号文章标题",
    "summary": "摘要",
    "content": "<section style=\"color:#333;padding:10px;\">公众号复制来的 HTML</section>",
    "contentFormat": "html",
    "platform": "公众号",
    "sourceUrl": "https://mp.weixin.qq.com/...",
    "draft": true
  }'
```

---

### 2. 发布小说

`POST /api/novels`

**用途**：创建一部新小说。

**请求体**：
```json
{
  "slug": "novel-name",              // 必填。小说标识，仅小写字母/数字/短横线
  "title": "小说标题",                // 必填
  "summary": "小说简介",              // 必填
  "genre": "科幻",                   // 科幻 | 都市 | 悬疑 | 奇幻 | 历史 | 言情 | 其他
  "status": "连载中",                 // 连载中 | 已完结 | 暂停
  "intro": "小说主页引言（Markdown）", // 可选
  "tags": ["标签"],                   // 可选
  "featured": false,                  // 可选
  "draft": true                       // 可选，默认 true
}
```

---

### 3. 给小说追加章节

`POST /api/novels/{小说slug}/chapters`

**用途**：为已存在的小说添加新章节。

**请求体**：
```json
{
  "chapter": 3,                      // 必填。章节序号，正整数（如第3章就填3）
  "title": "第三章 标题",             // 必填
  "content": "章节正文（Markdown）",  // 必填
  "draft": true                       // 可选，默认 true
}
```

**示例**：
```bash
curl -X POST https://portfolio-publish.zhedalibo.workers.dev/api/novels/starship-log/chapters \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 06c38b22f068d23777f4ab20131b7a67e380ffbd558cb273" \
  -d '{
    "chapter": 3,
    "title": "第三章 抉择",
    "content": "林夕站在舷窗前...\n\n她做出了决定。",
    "draft": true
  }'
```

---

### 4. 发布工具

`POST /api/tools`

**用途**：发布工具、App、SaaS 产品介绍。

**请求体**：
```json
{
  "slug": "tool-name",               // 必填。工具标识
  "name": "工具名称",                 // 必填
  "tagline": "一句话卖点",            // 必填
  "description": "详细介绍（Markdown）", // 必填
  "type": "小工具",                   // APP | SaaS | 小工具 | 其他
  "url": "https://...",               // 可选。访问地址
  "repo": "https://github.com/...",   // 可选。源码仓库
  "stack": ["技术栈1", "技术栈2"],     // 可选
  "status": "运营中",                 // 运营中 | 开发中 | 已下线
  "featured": false,                  // 可选
  "draft": true                       // 可选，默认 true
}
```

---

## 响应格式

**成功**（HTTP 201）：
```json
{
  "ok": true,
  "path": "articles/my-post/index.md",
  "draft": true,
  "prUrl": "https://github.com/zhedalibo-ctrl/Portfolio/pull/3"
}
```
> `prUrl` 是 GitHub 草稿 PR 链接，网站主人审核合并后内容才会上线。

**失败 - 校验错误**（HTTP 422）：
```json
{
  "ok": false,
  "error": "校验失败",
  "details": [
    { "field": "title", "msg": "必填" }
  ]
}
```

**失败 - 鉴权错误**（HTTP 401）：
```json
{ "ok": false, "error": "无效的 API Key" }
```

---

## 重要规则（AI 必读）

1. **slug 必须唯一**：每篇内容用一个新 slug。若返回"文件已存在"，换一个 slug 再试。
2. **slug 命名规则**：仅小写字母、数字、短横线，不能用中文或空格。如 `my-ai-post`、`chapter-3-notes`。
3. **草稿机制**：所有内容默认 `draft: true`，不会立即上线，需主人审核。
4. **枚举值必须精确**：`platform`、`genre`、`status`、`type` 只能填上面列出的值，不能自创。
5. **正文格式**：
   - 普通文章用 `contentFormat: "markdown"`，正文填 Markdown
   - 公众号搬运用 `contentFormat: "html"`，正文直接粘公众号 HTML（带内联样式）
6. **章节必须指定小说**：调 `/api/novels/{slug}/chapters` 时，URL 里的 `{slug}` 必须是已存在的小说 slug。

---

## 健康检查

`GET /api/health`（无需鉴权）
返回 `{"ok":true,"mode":"github"}` 即接口正常。
