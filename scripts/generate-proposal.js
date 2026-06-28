// 生成项目计划书 DOCX
// 使用方法：node scripts/generate-proposal.js
const { 
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  ShadingType
} = require("docx");
const fs = require("fs");

const FONT = "宋体";
const TITLE_SIZE = 32; // 三号 ≈ 16pt × 2 (half-points)
const SUBTITLE_SIZE = 30; // 小三 ≈ 15pt × 2
const BODY_SIZE = 24; // 小四 ≈ 12pt × 2
const SMALL_SIZE = 22; // 五号 ≈ 10.5pt × 2

function heading(text, level = 1) {
  return new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
    alignment: level === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { before: level === 1 ? 400 : 300, after: 200 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: level === 1 ? TITLE_SIZE : SUBTITLE_SIZE,
        bold: true,
      }),
    ],
  });
}

function body(text, options = {}) {
  return new Paragraph({
    spacing: { after: options.spacing || 120, line: 360 },
    indent: options.indent ? { firstLine: 480 } : undefined,
    children: [
      new TextRun({
        text,
        font: FONT,
        size: options.size || BODY_SIZE,
        bold: options.bold || false,
      }),
    ],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 80, line: 320 },
    indent: { left: 480 },
    children: [
      new TextRun({ text, font: FONT, size: BODY_SIZE }),
    ],
  });
}

function tableCell(text, width, options = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: options.header ? { fill: "D9E8F7", type: ShadingType.CLEAR } : undefined,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text,
            font: FONT,
            size: SMALL_SIZE,
            bold: options.header || false,
          }),
        ],
      }),
    ],
  });
}

function createTable(rows, widths, header = false) {
  const tableRows = rows.map((row, idx) => {
    return new TableRow({
      children: row.map((cell, ci) =>
        tableCell(cell, widths[ci], { header: header && idx === 0 })
      ),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

async function main() {
  const doc = new Document({
    sections: [
      {
        children: [
          heading("智练（ZhiLian）项目计划书", 1),
          body("版本：v1.2  |  日期：2025年6月  |  GitHub：github.com/ThousandMaway/zhilian", { spacing: 200 }),
          body(""),

          // ========================================
          heading("一、项目概述"),
          heading("1.1 基本信息", 2),
          createTable([
            ["项目名称", "智练 — 智能刷题练习平台"],
            ["所属行业", "在线教育 / 移动互联网"],
            ["产品形态", "移动端 App（iOS + Android）"],
            ["技术架构", "Expo (React Native) + TypeScript + Supabase"],
            ["开源地址", "github.com/ThousandMaway/zhilian"],
          ], [30, 70]),
          body(""),
          heading("1.2 核心产品", 2),
          body("「智练」是一款面向备考学习者的跨平台智能刷题 App。产品以「人人可建题库、处处可刷题」为核心理念，打破传统刷题 App 题库封闭的局限，让任何有练习需求的人都能快速搭建专属刷题工具。", { indent: true }),
          body("系统支持单选题、多选题、判断题、填空题、简答题共五种题型，提供随机练习、题库练习、试卷模式、错题重练、收藏练习五种练习方式，搭配每日打卡、错题自动收集、题目收藏、答题统计分析等学习辅助功能。", { indent: true }),
          body("用户可通过手动录入、JSON / CSV 文件批量导入、DOCX 智能解析三种方式创建题库。DOCX 智能解析引擎可自动识别 Word 文档中的题干、选项、答案和解析，过滤试卷标题和章节编号。", { indent: true }),
          body(""),
          heading("1.3 项目现状", 2),
          body("MVP 版本开发完成并已开源。41 个 TypeScript 源文件（14 个逻辑模块 + 27 个界面组件），TypeScript 编译零错误。经过系统化代码审查和 14 项 bug 修复，代码质量已达到可交付水平。", { indent: true }),
          body("独立的 Android APK 可直接安装到华为等国产手机，无需依赖应用商店。iOS 适配已完成，支持 SafeArea 动态适配和 EAS 云端构建。新功能持续迭代中，包括 AI 简答题判题、试卷模式创建、错题/收藏按标签分组等。", { indent: true }),

          // ========================================
          heading("二、市场分析"),
          heading("2.1 用户画像", 2),
          createTable([
            ["用户群体", "典型场景", "核心需求", "预估规模"],
            ["大学生", "期末复习、考研、考公", "自建题库、碎片化刷题", "4000万+"],
            ["职业资格考生", "教资、法考、医考", "大量刷题、多题型支持", "2000万+"],
            ["企业培训部门", "新员工考核", "自建题库、批量导入", "800万企业"],
            ["自由学习者", "读书笔记", "自定义问答、统计分析", "5000万+"],
          ], [18, 25, 32, 25], true),
          body(""),
          heading("2.2 客户核心需求", 2),
          bullet("1. 题库自由：不被平台题库绑架，能自己创建专属题库"),
          bullet("2. 多题型支持：不仅限于选择题，填空、简答同样是刚需"),
          bullet("3. 批量导入：已有题目能快速导入，无需逐题手打"),
          bullet("4. 碎片化练习：通勤、排队等场景随时刷几题"),
          bullet("5. 错题管理：自动收集错题，针对性强化薄弱知识点"),
          bullet("6. 云同步免费：跨设备同步学习进度，不额外付费"),
          body(""),
          heading("2.3 竞争对手分析", 2),
          createTable([
            ["竞品", "优势", "劣势", "智练的应对"],
            ["粉笔", "公考题库全面", "题库封闭不可自建", "开放题库 + 自建导入"],
            ["猿题库", "K12 覆盖广", "用户面窄", "全年龄段 + DOCX 解析"],
            ["考试宝", "功能覆盖面广", "界面传统", "5 种题型 + 现代 UI"],
            ["Anki", "间隔记忆算法", "中文不友好", "中文优先 + 免费云同步"],
            ["刷题神器", "运营成熟", "广告多付费墙高", "免费增值，体验优先"],
          ], [15, 23, 28, 34], true),
          body(""),
          heading("2.4 差异化优势", 2),
          createTable([
            ["维度", "智练", "行业现状"],
            ["题型覆盖", "单选 / 多选 / 判断 / 填空 / 简答", "多数仅支持选择判断"],
            ["题库来源", "手动 + JSON / CSV / DOCX 导入", "以平台提供为主"],
            ["DOCX 解析", "自动识别题干、选项、答案、解析", "竞品均无此能力"],
            ["云同步", "Supabase 免费云同步", "多数需付费"],
            ["分发方式", "独立 APK + 应用商店", "仅应用商店"],
            ["AI 判题", "简答题 AI 评分 + 降级兜底（可选）", "均无"],
          ], [18, 42, 40], true),

          // ========================================
          heading("三、产品或服务"),
          heading("3.1 产品现状", 2),
          bullet("✅ MVP 版本全部核心功能开发完成"),
          bullet("✅ 41 个 TypeScript 源文件，编译零错误"),
          bullet("✅ 经过系统化代码审查，修复 14 个高优 / 中优 bug"),
          bullet("✅ 独立 APK 可安装到 Android 手机（含华为等国产机型）"),
          bullet("✅ iOS SafeArea 适配完成，支持 EAS 云端构建"),
          bullet("✅ 已开源至 GitHub（ThousandMaway/zhilian）"),
          bullet("✅ AI 简答题判题（可选，未配置时自动降级关键词匹配）"),
          bullet("✅ 试卷模式、错题 / 收藏按标签分组、可单题练习或全部重练"),
          bullet("📹 演示视频：（待补充）"),
          body(""),
          heading("3.2 核心功能", 2),
          createTable([
            ["功能模块", "说明"],
            ["用户认证", "邮箱注册 / 登录，SecureStore 加密存储 Token，会话自动恢复"],
            ["题库管理", "手动录题（5 种题型动态表单）、JSON / CSV / DOCX 三种导入方式"],
            ["答题系统", "5 种题型专属交互、自由练习即时判分、试卷模式统一提交打分"],
            ["试卷模式", "创建试卷、从题库选题排序、模拟真实考试流程"],
            ["每日打卡", "完成 20 题自动打卡、日历热力图、连续天数统计"],
            ["错题本", "自动收录、错误次数记录、按标签分组、长按多选批量删除"],
            ["题目收藏", "答题中一键星标、收藏列表按标签分组、单题或全部练习"],
            ["学习统计", "总答题数、正确率、各题型进度条、薄弱知识点排行"],
            ["数据导出", "一键导出全部个人数据（题库、错题、收藏、打卡）为 JSON"],
            ["AI 判题", "简答题 AI 智能评分（可选），未配置自动降级关键词匹配"],
          ], [24, 76], true),
          body(""),
          heading("3.3 产品亮点（与同类产品的关键差异）", 2),

          body("1. DOCX 智能解析引擎", { bold: true }),
          body("上传 Word 试卷自动识别题目结构：自动提取题干、匹配选项字母（A/B/C/D/H）、检测答案标记、抓取解析段落、智能过滤试卷标题和章节编号。竞品无一具备此能力。", { indent: true }),

          body("2. 题型自适应表单", { bold: true }),
          body("录题时切换题型，表单即时变化。单选显示选项 + 单选按钮，多选显示选项 + 勾选框，判断显示对错大按钮，填空 / 简答显示文本输入。一个表单适配全部题型，操作连贯不中断。支持最多 8 个选项（A-H）。", { indent: true }),

          body("3. 智能判分系统", { bold: true }),
          body("简答题采用关键词匹配算法，参考答案拆为关键词，用户回答命中半数以上视为正确。同时支持 AI 智能评分（可选，基于 OpenAI / DeepSeek 大模型），AI 不可用时自动降级为关键词匹配。填空题精确字符串比对。多选 / 填空 / 简答需手动「确认答案」后才判分，防止误触。", { indent: true }),

          body("4. 离线优先架构", { bold: true }),
          body("本地 SQLite 缓存全量数据（题目、标签、答题记录），断网环境下完整可用；网络恢复后自动与 Supabase 云端同步。不依赖网络，通勤、地下室等场景无忧。", { indent: true }),

          body("5. 独立 APK 分发", { bold: true }),
          body("通过 Expo EAS Build 云端构建独立 APK，用户可直接下载安装，无需应用商店。完美支持华为等没有 Google Play 的国产手机。", { indent: true }),

          body("6. 技术架构", { bold: true }),
          body("前端：Expo SDK 56 + React Native 0.85 + TypeScript + twrnc (Tailwind) 样式方案 + React Navigation 7 导航 + Zustand + TanStack React Query 状态管理。后端：Supabase 云服务（Auth + PostgreSQL + Row Level Security + Edge Functions）。离线：Expo SQLite 本地数据库。打包：EAS Build → 独立 APK / IPA。", { indent: true }),

          // ========================================
          heading("四、商业模式"),
          heading("4.1 收入来源", 2),
          createTable([
            ["收入来源", "说明", "预估占比"],
            ["免费增值", "基础功能永久免费：手动录题、答题、打卡、错题、收藏", "0%（引流）"],
            ["会员订阅", "月 / 年订阅制，解锁：无限题库导入、高级统计、数据导出", "60%"],
            ["题库市场", "题库创作者定价售卖，平台抽取 20% 技术服务费", "25%"],
            ["企业定制", "私有化部署、SSO 集成、定制题型开发，按年付费", "15%"],
          ], [20, 58, 22], true),
          body(""),
          heading("4.2 定价策略", 2),
          bullet("免费版：¥0 — 轻度自用学习者"),
          bullet("月度会员：¥12 ~ ¥18 — 备考冲刺期用户"),
          bullet("年度会员：¥98 ~ ¥128 — 长期重度用户（日均 ¥0.27 ~ ¥0.35）"),
          body(""),
          body("定价逻辑：以一杯奶茶 / 月的亲民价格覆盖从轻度到重度用户的完整付费梯度。年度订阅日均不到 4 毛钱，远低于同类产品（粉笔会员 ¥30+/月）。", { indent: true }),
          body(""),
          heading("4.3 核心竞争力壁垒", 2),
          bullet("1. DOCX 智能解析——业界独有的 Word 文档自动识别题目引擎，积累了特殊格式处理能力，难以短期复制"),
          bullet("2. 数据网络效应——用户自建题库越多，平台内容越丰富；题库市场形成双边网络"),
          bullet("3. 全题型覆盖——单选 / 多选 / 判断 / 填空 / 简答五种题型完整支持，切换无缝"),
          bullet("4. 离线优先——SQLite + Supabase 双写架构，断网也能用"),
          bullet("5. 开源透明——代码完全开源，用户可审计、可自部署、可贡献"),
          bullet("6. AI 增强——AI 判题为可选增值功能，不配置也不影响核心体验"),
          body(""),
          body("—— 本文档随项目持续更新 ——", { spacing: 400 }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("docs/智练项目计划书.docx", buffer);
  console.log("✅ 项目计划书已生成：docs/智练项目计划书.docx");
}

main().catch(console.error);
