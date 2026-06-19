// GitHub API 封装（生产模式用）
// 把生成的 Markdown 文件提交到仓库草稿分支，并发起 PR

interface Env {
  GH_TOKEN: string;
  GH_REPO: string; // owner/repo
  GH_BRANCH: string; // 草稿分支，如 content/draft
}

const API = 'https://api.github.com';

async function gh(env: Env, path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(new Error(`GitHub API ${res.status}: ${text}`), { status: 502 });
  }
  return res.status === 204 ? null : res.json();
}

/** 确保草稿分支存在（从 main 创建） */
async function ensureBranch(env: Env) {
  // 取 main 分支引用
  const mainRef = await gh(env, `/repos/${env.GH_REPO}/git/ref/heads/main`).catch(() => null);
  if (!mainRef) throw new Error('无法获取 main 分支，请确认仓库与 Token 权限');
  const sha = mainRef.object.sha;

  // 尝试创建草稿分支；已存在则忽略
  await gh(env, `/repos/${env.GH_REPO}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${env.GH_BRANCH}`, sha }),
  }).catch((e) => {
    // 422 已存在，忽略
    if (!String(e.message).includes('422')) throw e;
  });
}

/** 提交单个文件 */
export async function commitFile(
  env: Env,
  relPath: string,
  content: string,
  message: string,
): Promise<{ commitUrl: string }> {
  await ensureBranch(env);

  // 检查是否已存在（避免静默覆盖）
  const existing = await gh(
    env,
    `/repos/${env.GH_REPO}/contents/${encodeURIComponent(relPath)}?ref=${env.GH_BRANCH}`,
  ).catch(() => null);
  if (existing) {
    throw Object.assign(new Error(`文件已存在：${relPath}（如需更新请先删除或加 overwrite）`), {
      status: 409,
    });
  }

  const result = await gh(env, `/repos/${env.GH_REPO}/contents/${encodeURIComponent(relPath)}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(content))), // utf-8 base64
      branch: env.GH_BRANCH,
    }),
  });

  return { commitUrl: result?.commit?.html_url ?? '' };
}

/** 发起 PR（草稿分支 → main） */
export async function createPR(env: Env, title: string, body: string): Promise<{ prUrl: string }> {
  const pr = await gh(env, `/repos/${env.GH_REPO}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      body,
      head: env.GH_BRANCH,
      base: 'main',
      draft: true,
    }),
  }).catch((e) => {
    // PR 已存在时 GitHub 返回 422，忽略
    if (!String(e.message).includes('422')) throw e;
    return null;
  });
  return { prUrl: pr?.html_url ?? '' };
}
