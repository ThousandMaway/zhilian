# 智练 (ZhiLian) — 智能刷题练习平台

> 「人人可建题库、处处可刷题」

一款基于 **Expo (React Native) + Supabase** 的跨平台智能刷题 App，支持 iOS / Android。用户可以自主创建或导入题库，支持单选题、多选题、判断题、填空题、简答题共五种题型，提供自由练习与试卷模式两种答题方式，搭配每日打卡、错题自动收集、题目收藏、答题统计分析等学习辅助功能。

---

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| **用户认证** | 邮箱注册/登录，SecureStore 加密存储，会话自动恢复 |
| **题库管理** | 手动录题（5 种题型动态表单）、JSON / CSV / DOCX 智能导入、搜索筛选分页 |
| **答题系统** | 5 种题型交互、自由练习（即时解析）、试卷模式（统一打分）、答题计时器 |
| **每日打卡** | 完成 20 题自动打卡、日历热力图、连续天数统计 |
| **错题本** | 答题错误自动收录、错误次数记录、错题重练 |
| **题目收藏** | 答题中一键星标、独立收藏列表、收藏练习 |
| **学习统计** | 总答题数、正确率、各题型进度条、薄弱知识点排行 |
| **数据导出** | 一键导出全部数据（题库、错题、收藏、打卡）为 JSON |

### 亮点

- **DOCX 智能解析引擎** — 上传 Word 试卷自动识别题目结构，过滤标题/章节标记
- **题型自适应表单** — 切换题型时表单即时变化
- **智能判分** — 简答题关键词匹配、填空题精确比对，多选/填空/简答需确认后才判分
- **离线优先架构** — 本地 SQLite 缓存全量数据，断网可用，网络恢复后无缝同步

---

## 🛠 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Expo SDK 56 + React Native 0.85 |
| 语言 | TypeScript 6.0 |
| 样式 | twrnc (Tailwind CSS for React Native) |
| 导航 | React Navigation 7 |
| 状态管理 | Zustand + TanStack React Query |
| 后端 | Supabase (Auth + Database + RLS) |
| 离线存储 | Expo SQLite |
| 打包 | EAS Build → APK / App Bundle |

---

## 🚀 快速开始

### 前置条件

- Node.js ≥ 18
- Expo CLI (`npm install -g expo-cli`)
- Supabase 项目（免费创建：[supabase.com](https://supabase.com)）

### 安装

```bash
git clone https://github.com/ThousandMaway/zhilian.git
cd zhilian/quiz-app
npm install
```

### 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入你的 Supabase 项目 URL 和 anon key：

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 初始化数据库

在 Supabase 控制台的 SQL Editor 中，按顺序执行 `supabase/migrations/` 下的迁移文件。

### 启动开发服务器

```bash
npm start
```

用 Expo Go 扫码，或按 `a` (Android) / `i` (iOS) 启动模拟器。

---

## 📁 项目结构

```
quiz-app/
├── App.tsx                    # 入口
├── src/
│   ├── screens/               # 页面：Auth, Home, Practice, Profile, Questions
│   ├── components/            # 通用组件 (QuizComponent)
│   ├── navigation/            # React Navigation 路由
│   ├── stores/                # Zustand 状态管理
│   ├── queries/               # React Query (Supabase CRUD)
│   ├── lib/                   # 工具：DOCX解析、Supabase客户端、模板
│   ├── db/                    # SQLite 离线数据库
│   ├── types/                 # TypeScript 类型定义
│   └── constants/             # 常量
├── supabase/
│   └── migrations/            # 数据库迁移脚本
├── test-data/                 # 示例题库 (JSON)
└── docs/                      # 项目文档
```

---

## 📱 构建 APK

```bash
npx eas build --platform android --profile preview
```

构建完成后下载 APK，可直接安装到 Android 手机（支持华为等国产机型，无需应用商店）。

---

## 📄 许可证

MIT License

---

> 版本：v1.0 | 项目状态：MVP 开发完成
