const fs = require("fs");
const {
  Document, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Packer, Table, TableRow, TableCell,
  WidthType, BorderStyle,
} = require("docx");

// 字体大小: 三号=16pt, 小三号=15pt, 小四号=12pt
const TITLE_FONT = "宋体";
const SIZE_H1 = 32; // 三号 16pt*2
const SIZE_H2 = 30; // 小三号 15pt*2
const SIZE_BODY = 24; // 小四号 12pt*2

function h1(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [
      new TextRun({ text, font: TITLE_FONT, size: SIZE_H1, bold: true }),
    ],
  });
}

function h2(text) {
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    children: [
      new TextRun({ text, font: TITLE_FONT, size: SIZE_H2, bold: true }),
    ],
  });
}

function h3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({ text, font: TITLE_FONT, size: SIZE_BODY + 2, bold: true }),
    ],
  });
}

function body(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: { firstLine: 480 }, // 首行缩进2字符
    children: [
      new TextRun({ text, font: TITLE_FONT, size: SIZE_BODY }),
    ],
  });
}

function bodyNoIndent(text) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({ text, font: TITLE_FONT, size: SIZE_BODY }),
    ],
  });
}

function tableCell(text, bold, width) {
  return new TableCell({
    width: { size: width || 2000, type: WidthType.DXA },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, font: TITLE_FONT, size: SIZE_BODY, bold: !!bold })],
      }),
    ],
  });
}

function tableCellLeft(text, bold, width) {
  return new TableCell({
    width: { size: width || 2000, type: WidthType.DXA },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text, font: TITLE_FONT, size: SIZE_BODY, bold: !!bold })],
      }),
    ],
  });
}

const doc = new Document({
  sections: [
    {
      children: [
        // === 封面 ===
        new Paragraph({ spacing: { before: 3000 } }),
        h1("项目计划书"),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [new TextRun({ text: "智练 —— 智能刷题练习平台", font: TITLE_FONT, size: SIZE_H2, bold: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
          children: [new TextRun({ text: "版本：v1.0    日期：2025 年 6 月", font: TITLE_FONT, size: SIZE_BODY })],
        }),

        // === 一、项目概述 ===
        h2("一、项目概述"),
        h3("项目名称"),
        body("智练 —— 智能刷题练习平台"),
        h3("所属行业"),
        body("在线教育 / 移动互联网"),
        h3("核心产品或服务"),
        body('「智练」是一款面向备考学习者的移动端智能刷题 App。用户可自主创建或导入题库，系统支持单选题、多选题、判断题、填空题、简答题共五种题型，提供自由练习与试卷模式两种答题方式，搭配每日打卡、错题自动收集、题目收藏、答题统计分析等学习辅助功能。'),
        body('产品以「人人可建题库、处处可刷题」为理念，打破传统刷题 App 题库封闭的局限。用户可通过 JSON、CSV 文件批量导入题目，支持 DOCX 智能解析（自动识别题干、选项、答案、解析），让任何有练习需求的人都能快速搭建专属刷题工具。'),
        h3("技术架构"),
        body("前端基于 Expo (React Native) + TypeScript 跨平台框架开发，一套代码同时覆盖 iOS 和 Android，采用 twrnc (Tailwind) 样式方案与 React Navigation 导航体系。后端采用 Supabase 云服务实现数据持久化、用户认证与实时同步，通过 Row Level Security 实现用户数据完全隔离。构建系统接入 EAS Build 云端打包，直接生成独立 APK 安装包。"),
        h3("项目现状"),
        body("MVP 版本开发完成。36 个 TypeScript 源文件，3000+ 模块，TypeScript 编译零错误，Metro 打包通过。Android APK 构建中，支持华为等国产手机独立安装运行。"),

        // === 二、市场分析 ===
        h2("二、市场分析"),
        h3("用户画像"),

        bodyNoIndent(""),
        // 用户画像表格
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                tableCell("用户群体", true, 1500),
                tableCell("典型场景", true, 2500),
                tableCell("核心需求", true, 3000),
              ],
            }),
            new TableRow({
              children: [
                tableCell("大学生"),
                tableCell("期末复习、考研、考公"),
                tableCell("自建题库、碎片化刷题、错题回顾"),
              ],
            }),
            new TableRow({
              children: [
                tableCell("职业资格考生"),
                tableCell("教资、法考、医考、注会"),
                tableCell("大量刷题、多题型支持、进度追踪"),
              ],
            }),
            new TableRow({
              children: [
                tableCell("企业培训部门"),
                tableCell("新员工考核、安全培训"),
                tableCell("自建题库、批量导入、考试模式"),
              ],
            }),
            new TableRow({
              children: [
                tableCell("自由学习者"),
                tableCell("读书笔记、知识点记忆"),
                tableCell("自定义问答、每日打卡、统计分析"),
              ],
            }),
          ],
        }),

        bodyNoIndent(""),
        h3("竞争对手分析"),
        body("当前市场主要竞品包括粉笔、猿题库、考试宝、Anki 等。粉笔侧重公考赛道，题库全面但封闭；猿题库聚焦 K12，用户面窄；考试宝功能类似但界面传统、题型单一；Anki 以间隔记忆见长，但对中文用户不够友好，仅支持卡片式问答。"),
        body("市场核心痛点在于：多数产品题库由平台提供，用户无法灵活自建；支持自建的产品不支持多题型；云同步普遍需要付费。"),

        h3("差异化优势"),
        body("1. 全题型覆盖：支持单选、多选、判断、填空、简答五种题型，远超同类自建题库工具。"),
        body("2. DOCX 智能解析：上传 Word 文档自动识别题目结构，过滤标题和章节标记，中英文排版兼容。"),
        body("3. 文件批量导入：支持 JSON/CSV 格式一键导入，自动字段映射，提供标准模板下载。"),
        body("4. 免费云同步：基于 Supabase 实现跨设备数据同步，免费可用。"),
        body("5. 独立 APK 安装：支持华为等国产手机，不依赖应用商店。"),

        // === 三、产品或服务 ===
        h2("三、产品或服务"),
        h3("产品现状"),
        body("MVP 版本已完成全部核心功能开发，TypeScript 编译零错误，Metro 打包 3013 模块通过。当前处于 EAS 云端构建阶段，构建完成后可直接安装到 Android 手机使用。可提供 Expo Go 体验包或独立 APK 安装包。"),

        h3("核心功能"),

        bodyNoIndent(""),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                tableCell("功能模块", true, 1800),
                tableCell("功能说明", true, 5200),
              ],
            }),
            ...[
              ["用户认证", "邮箱注册/登录，Supabase Auth + SecureStore 加密存储，会话自动恢复"],
              ["题库管理", "手动录题（5 种题型动态表单切换）、JSON/CSV/DOCX 导入、搜索筛选分页"],
              ["答题系统", "5 种题型交互、自由练习（即时解析）、试卷模式（统一打分）、答题计时器"],
              ["每日打卡", "完成 20 题自动打卡、日历热力图展示、连续天数统计"],
              ["错题本", "答题错误自动收录、错误次数记录、错题重练"],
              ["题目收藏", "答题中一键星标收藏、独立收藏列表、收藏练习"],
              ["学习统计", "总答题数、正确率趋势、各题型进度条、薄弱知识点排行"],
              ["数据导出", "一键导出全部数据为 JSON 文件，通过系统分享保存"],
            ].map(([label, desc]) =>
              new TableRow({
                children: [tableCell(label), tableCellLeft(desc)],
              })
            ),
          ],
        }),

        bodyNoIndent(""),
        h3("产品亮点"),
        body("1. DOCX 智能解析引擎：上传 Word 试卷自动识别题目结构，支持编号、选项字母、答案标记、解析段落，过滤试卷标题和章节标记，中英文排版兼容。"),
        body("2. 题型自适应表单：录题时切换题型，表单即时变化——单选显示选项+单选按钮，多选显示选项+多选勾选，判断显示对错开关，填空/简答显示文本输入。"),
        body("3. 智能判分：简答题采用关键词匹配算法，填空题精确比对；多选、填空、简答需用户点确认后才出结果，防止误触。"),
        body("4. 题型自动排序：随机练习时按单选→多选→判断→填空→简答排列，从易到难逐步递进。"),
        body("5. 离线优先架构：本地 SQLite 缓存全量数据，断网时可正常答题，网络恢复后无缝增量同步。"),

        // === 四、商业模式 ===
        h2("四、商业模式"),

        h3("收入来源"),
        body("产品采用 Freemium（免费增值）模式，基础功能永久免费，高级功能通过订阅和企业服务收费。"),

        bodyNoIndent(""),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                tableCell("收入来源", true, 2000),
                tableCell("说明", true, 3500),
                tableCell("预估占比", true, 1500),
              ],
            }),
            ...[
              ["免费增值（Freemium）", "基础功能永久免费：手动录题、基础答题、JSON/CSV/DOCX 导入（50 题以内）、每日打卡、错题记录、收藏", "——"],
              ["会员订阅", "月/年订阅制，解锁：无限题库导入、高级统计分析、批量导出、优先体验新功能", "60%"],
              ["题库市场", "优质题库创作者可定价售卖，平台抽取 20% 技术服务费", "25%"],
              ["企业定制", "面向企业培训场景提供私有化部署、SSO 集成、定制题型开发，按年付费", "15%"],
            ].map(([a, b, c]) =>
              new TableRow({ children: [tableCell(a), tableCellLeft(b), tableCell(c)] })
            ),
          ],
        }),

        bodyNoIndent(""),
        h3("定价策略"),
        body("会员月费 ¥12 ~ ¥18，年费 ¥98 ~ ¥128。以亲民价格覆盖从轻度到重度用户的完整付费梯度。"),

        h3("核心竞争力壁垒"),
        body("DOCX 智能解析的技术积累、用户自建题库形成的数据网络效应、以及全题型覆盖的产品完整性，三者构成可持续的差异化护城河。"),

        // 页脚
        new Paragraph({ spacing: { before: 600 } }),
        bodyNoIndent("—— 版本 v1.0 · 2025 年 6 月 ——"),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = "docs/项目计划书.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("已生成:", outPath);
  console.log("大小:", (buffer.length / 1024).toFixed(1), "KB");
});
