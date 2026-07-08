const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, ShadingType } = require("docx");
const fs = require("fs");

const FONT = "宋体";
const T1 = 32, T2 = 30, BODY = 24, SM = 22;

function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: t, font: FONT, size: T1, bold: true })] }); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 160 }, children: [new TextRun({ text: t, font: FONT, size: T2, bold: true })] }); }
function p(t, o = {}) { return new Paragraph({ spacing: { after: o.s || 120, line: 360 }, indent: o.i ? { firstLine: 480 } : o.b ? { left: 480 } : undefined, children: [new TextRun({ text: t, font: FONT, size: o.z || BODY, bold: o.b || false })] }); }
function b(t) { return p(t, { b: true, i: true, s: 80 }); }
function tbl(rows, widths, header) {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map((r, i) => new TableRow({ children: r.map((c, j) => new TableCell({ width: { size: widths[j], type: WidthType.PERCENTAGE }, shading: header && i === 0 ? { fill: "D9E8F7", type: ShadingType.CLEAR } : undefined, children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 50, after: 50 }, children: [new TextRun({ text: c, font: FONT, size: SM, bold: header && i === 0 })] })] })) })) });
}

async function main() {
  const doc = new Document({ sections: [{ children: [
    h1("智练（ZhiLian）项目计划书"),
    p("版本：v1.3  |  日期：2026 年 7 月  |  GitHub：github.com/ThousandMaway/zhilian", { s: 200 }), p(""),

    h1("一、项目概述"),
    h2("1.1 基本信息"),
    tbl([["项目名称","智练 — 智能刷题练习平台"],["所属行业","在线教育 / 移动互联网"],["产品形态","移动端 App（iOS + Android）"],["技术架构","Expo (React Native) + TypeScript + Supabase"],["开源地址","github.com/ThousandMaway/zhilian"]], [30,70]),
    p(""),
    h2("1.2 核心产品"),
    p("「智练」是一款面向备考学习者的跨平台智能刷题 App。产品以「人人可建题库、处处可刷题」为核心理念，打破传统刷题 App 题库封闭的局限。", { i: true }),
    p("系统支持单选题、多选题、判断题、填空题、简答题五种题型，提供随机练习、题库练习、试卷模式、错题重练、收藏练习五种练习方式，搭配每日打卡、错题自动收集、题目收藏、答题统计分析等学习辅助功能。", { i: true }),
    p(""),
    h2("1.3 项目现状"),
    p("MVP 版本开发完成并已开源。41 个 TypeScript 源文件，编译零错误。经过系统化代码审查和多项 bug 修复，功能完备。独立 Android APK 可直接安装（支持华为等国产手机），iOS 适配已完成。", { i: true }),
    p("近期更新："),
    b("• 试卷模式（创建试卷、选题排序、模拟考试）"),
    b("• AI 简答题判题（可选，基于 DeepSeek/OpenAI，未配置时自动降级关键词匹配）"),
    b("• 错题本 / 收藏按标签分组、支持单题练习或全部重练"),
    b("• 标签过滤改用 question_tags 关联表精确查询"),
    b("• 导入题目自动以文件名创建独立标签，不污染默认题库"),
    b("• 创建空题库功能，支持重命名"),
    b("• 多选批量删除错题"),

    h1("二、市场分析"),
    h2("2.1 用户画像"),
    tbl([["用户群体","典型场景","核心需求"],["大学生","期末复习、考研、考公","自建题库、碎片化刷题"],["职业资格考生","教资、法考、医考、注会","大量刷题、多题型支持"],["企业培训部门","新员工考核、合规考试","自建题库、批量导入"],["自由学习者","读书笔记、知识点记忆","自定义问答、统计分析"]], [20,35,45], true),
    p(""),
    h2("2.2 客户核心需求"),
    b("1. 题库自由：不被平台题库绑架，能自建专属题库"),
    b("2. 多题型支持：不仅限于选择题，填空、简答同样是刚需"),
    b("3. 批量导入：已有题目能快速导入，无需逐题手打"),
    b("4. 碎片化练习：通勤、排队等场景随时刷题"),
    b("5. 错题管理：自动收集错题，针对性强化薄弱知识点"),
    b("6. 云同步免费：跨设备同步学习进度，不额外付费"),
    p(""),
    h2("2.3 竞争对手分析"),
    tbl([["竞品","优势","劣势","智练的应对"],["粉笔","公考题库全面","题库封闭不可自建","开放题库 + 自建导入"],["猿题库","K12 覆盖广","用户面窄","全年龄段 + DOCX 解析"],["考试宝","功能覆盖面广","界面传统，题型少","5 种题型 + 现代 UI"],["Anki","间隔记忆算法成熟","中文生态差","中文优先 + 免费云同步"]], [15,25,30,30], true),
    p(""),
    h2("2.4 差异化优势"),
    tbl([["维度","智练","行业现状"],["题型覆盖","单选/多选/判断/填空/简答","多数仅支持选择判断"],["题库来源","手动 + JSON/CSV/DOCX 导入","以平台提供为主"],["DOCX 解析","自动识别题干选项答案解析","竞品均无"],["云同步","Supabase 免费云同步","多数需付费"],["AI 判题","简答题 AI 评分 + 降级兜底","均无"]], [18,42,40], true),

    h1("三、产品或服务"),
    h2("3.1 核心功能"),
    tbl([["功能模块","说明"],["用户认证","邮箱注册/登录，SecureStore 加密存储 Token"],["题库管理","手动录题、JSON/CSV/DOCX 导入、标签管理、级联删除"],["答题系统","5 种题型交互、自由练习即时判分、试卷模式统一提交"],["试卷模式","创建试卷、从题库选题排序、模拟真实考试"],["每日打卡","完成 20 题自动打卡、日历热力图、连续天数统计"],["错题本","自动收录、按标签分组、批量删除、单题/全部重练"],["题目收藏","答题中一键星标、按标签分组、单题/全部练习"],["学习统计","总答题数、正确率、各题型进度、薄弱知识点"],["数据导出","一键导出全量数据为 JSON"],["AI 判题","简答题 AI 评分（可选），未配置自动降级关键词匹配"]], [22,78], true),
    p(""),
    h2("3.2 产品亮点"),
    b("1. DOCX 智能解析引擎 — 上传 Word 试卷自动识别题目结构，过滤标题/章节标记"),
    b("2. 题型自适应表单 — 切换题型时表单即时变化，支持最多 8 个选项（A-H）"),
    b("3. 智能判分 — 简答关键词匹配 + AI 评分、填空精确比对、需确认后才判分"),
    b("4. SafeArea 适配 — 动态安全区适配 iPhone Dynamic Island / 刘海屏"),
    p(""),
    h2("3.3 技术架构"),
    tbl([["框架","Expo SDK 56 + React Native 0.85"],["语言","TypeScript 6.0"],["样式","twrnc (Tailwind CSS for React Native)"],["导航","React Navigation 7"],["状态管理","Zustand + TanStack React Query"],["后端","Supabase (Auth + PostgreSQL + RLS + Edge Functions)"],["打包","EAS Build → 独立 APK / iOS Simulator Build"]], [25,75]),

    h1("四、商业模式"),
    h2("4.1 收入来源"),
    tbl([["收入来源","说明","预估占比"],["免费增值","基础功能永久免费","0%（引流）"],["会员订阅","月/年订阅：无限导入、高级统计、数据导出","60%"],["题库市场","题库创作者定价售卖，平台抽成 20%","25%"],["企业定制","私有化部署、SSO 集成、定制开发","15%"]], [20,55,25], true),
    p(""),
    h2("4.2 定价策略"),
    tbl([["方案","价格","目标用户"],["免费版","¥0","轻度自用学习者"],["月度会员","¥12 ~ ¥18","备考冲刺期用户"],["年度会员","¥98 ~ ¥128","长期重度用户（日均 ¥0.27）"]], [22,30,48], true),
    p(""),
    h2("4.3 发展路线图"),
    tbl([["阶段","时间","里程碑"],["MVP","2026 Q2","核心功能上线、开源、独立 APK ✅"],["V1.0","2026 Q3","试卷模式、AI 判题、错题分组 ✅"],["V1.5","2026 Q4","离线支持、应用商店上架、题库市场 Beta"],["V2.0","2027 Q1","企业版、团队协作、SSO 集成"]], [18,18,64], true),
    p(""),
    p("—— 本文档随项目持续更新 ——", { s: 400 }),
  ] }] });
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync("docs/智练项目计划书.docx", buf);
  console.log("✅ docs/智练项目计划书.docx 已生成");
}
main().catch(console.error);
