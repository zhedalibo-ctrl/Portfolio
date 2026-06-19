// 网站静态资源入口 Worker
// 把所有请求转发给静态资源（dist 目录）
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
