// 站点元信息 —— 后续替换为你自己的信息
export const SITE = {
  title: '墨集',
  subtitle: '一个创作者的作品集',
  description: '这里收录我的文章、小说与工具——用 AI 创作，用代码构建。',
  author: '李墨',
  // 首页简介（用于 hero 区）
  bio: '写文章、写小说、做工具。相信 AI 是放大器，不是替身。',
  email: 'hello@example.com',
  // 社交链接（留空则不显示）
  social: {
    github: 'https://github.com/example',
    twitter: '',
    wechat: '',
    rss: '/rss.xml',
  },
} as const;

// 导航
export const NAV: { label: string; href: string }[] = [
  { label: '文章', href: '/articles' },
  { label: '小说', href: '/novels' },
  { label: '工具', href: '/tools' },
  { label: '关于', href: '/about' },
];

// 各分区在首页的展示配置
export const SECTIONS = {
  articles: { label: '文章', emoji: '📝', href: '/articles', more: '查看全部文章' },
  novels: { label: '小说', emoji: '📖', href: '/novels', more: '进入书房' },
  tools: { label: '工具', emoji: '🛠️', href: '/tools', more: '逛逛工具箱' },
} as const;
