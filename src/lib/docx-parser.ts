import { QuestionType } from "~/types";

export interface ParsedQuestion {
  type: QuestionType;
  stem: string;
  options: { id: string; content: string }[] | null;
  answer: string | string[];
  analysis: string | null;
  difficulty: number;
}

/**
 * 从 DOCX 提取的纯文本中智能解析题目
 * 支持常见格式：
 * 1. 单选题  题干  选项A...选项B...  答案：A
 * 10、多选题  题干  A...B...C...D...  答案：ABD
 * 一、判断题  题干  答案：正确
 * (1) 填空题  题干()  答案：xxx
 */
export function parseDocxText(rawText: string): ParsedQuestion[] {
  const lines = rawText
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 分割题目块：通过匹配题目编号
  const questionBlocks = splitIntoQuestionBlocks(lines);
  return questionBlocks.map(parseQuestionBlock).filter(Boolean) as ParsedQuestion[];
}

/** 题目编号正则：数字、中文数字、括号编号等 */
const QUESTION_START = /^(\d+[.)、]|（\d+）|\([0-9]+\)|[一二三四五六七八九十]+[、.]|[第].*[题]\s*)/;

function splitIntoQuestionBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  // 跳过文档标题行（通常在第一行，不含题目编号）
  const titlePatterns = [
    /^(试卷|测试|考试|练习|复习|模拟|期末|期中|单元|第[一二三四五六七八九十\d]+[章单元])/,
    /\.docx?$/,
  ];

  for (const line of lines) {
    // 跳过纯标题行（不加入任何题目块）
    if (blocks.length === 0 && currentBlock.length === 0) {
      const isTitle = titlePatterns.some((p) => p.test(line)) && !QUESTION_START.test(line);
      if (isTitle) continue;
    }

    if (QUESTION_START.test(line) && currentBlock.length > 0) {
      blocks.push(currentBlock);
      currentBlock = [];
    }
    currentBlock.push(line);
  }
  if (currentBlock.length > 0) blocks.push(currentBlock);
  return blocks;
}

function parseQuestionBlock(block: string[]): ParsedQuestion | null {
  if (block.length === 0) return null;

  let stem = "";
  const options: { id: string; content: string }[] = [];
  let answer: string | string[] = "";
  let analysis: string | null = null;
  let answerFound = false;
  let analysisFound = false;

  // 选项匹配：A. xxx  / A、xxx  / ① xxx  / A) xxx
  const optionRe = /^([A-H])[.、)]\s*(.+)/;
  const circledRe = /^([①②③④⑤⑥⑦⑧])[.、]?\s*(.+)/;
  const circledMap: Record<string, string> = { "①": "A", "②": "B", "③": "C", "④": "D", "⑤": "E", "⑥": "F", "⑦": "G", "⑧": "H" };

  for (let i = 0; i < block.length; i++) {
    const line = block[i];

    // 跳过题目编号行开头
    let content = line.replace(QUESTION_START, "").trim();

    // 检测"题型"标记
    // 忽略

    // 检测答案行
    const answerMatch = content.match(/^(答案|参考答案|正确答案)\s*[:：]\s*(.+)/i);
    if (answerMatch) {
      answer = answerMatch[2].trim();
      // 多选答案：ABD / A,B,D / A、B、D
      if (/^[A-H,，、\s]+$/.test(answer as string) && (answer as string).replace(/[,，、\s]/g, "").length >= 2) {
        answer = (answer as string).replace(/[,，、\s]/g, "").split("");
      }
      answerFound = true;
      continue;
    }

    // 检测"正确/错误"答案
    const tfMatch = content.match(/^(答案|参考答案|正确答案)\s*[:：]\s*(正确|对|错误|错|√|×|true|false)/i);
    if (tfMatch) {
      const tf = tfMatch[2].toLowerCase();
      answer = tf === "正确" || tf === "对" || tf === "√" || tf === "true" ? "true" : "false";
      answerFound = true;
      continue;
    }

    // 检测解析行
    const analysisMatch = content.match(/^(解析|分析|知识拓展)\s*[:：]\s*(.*)/i);
    if (analysisMatch) {
      analysis = analysisMatch[2].trim();
      analysisFound = true;
      continue;
    }

    // 检测选项行
    const optMatch = content.match(optionRe);
    if (optMatch && !answerFound) {
      options.push({ id: optMatch[1], content: optMatch[2].trim() });
      continue;
    }

    const cirMatch = content.match(circledRe);
    if (cirMatch && !answerFound && cirMatch[1] in circledMap) {
      options.push({ id: circledMap[cirMatch[1]], content: cirMatch[2].trim() });
      continue;
    }

    // 如果还没开始收集选项，且不是答案/解析/题型标记，就是题干的一部分
    if (options.length === 0 && !answerFound && !analysisFound) {
      // 过滤"多项选择题"/"单项选择题"等分类标签
      if (/^(多项选择题|单项选择题|多选题|单选题|判断题|填空题|简答题|论述题)[.、]?\s*$/i.test(content)) continue;
      stem += (stem ? "\n" : "") + content;
    }
  }

  if (!stem) return null;
  if (stem.length < 5 && options.length === 0 && !answerFound) return null;

  // 跳过明显的标题/章节标记
  const sectionPatterns = [
    /^[一二三四五六七八九十]+[、.]?\s*(单项|多项)?选择题\s*(（.*）)?$/,
    /^[一二三四五六七八九十]+[、.]?\s*判断题\s*(（.*）)?$/,
    /^[一二三四五六七八九十]+[、.]?\s*填空题\s*(（.*）)?$/,
    /^[一二三四五六七八九十]+[、.]?\s*简答题\s*(（.*）)?$/,
    /^[一二三四五六七八九十]+[、.]?\s*论述题\s*(（.*）)?$/,
    /^\s*(单项|多项)?选择题\s*(（.*）)?\s*$/,
    /^\s*(判断|填空|简答|论述)题\s*(（.*）)?\s*$/,
    /^\s*(第[一二三四五六七八九十\d]+[章节]|综合|模拟|期末|期中).*$/,
  ];
  for (const pat of sectionPatterns) {
    if (pat.test(stem)) return null;
  }

  // 推断题型
  const type = inferType(stem, options, answer);

  return {
    type,
    stem: stem.trim(),
    options: options.length >= 2 ? options : null,
    answer: answer || "",
    analysis: analysis || null,
    difficulty: 1,
  };
}

/** 推断题型 */
function inferType(
  stem: string,
  options: { id: string; content: string }[],
  answer: string | string[]
): QuestionType {
  // 有多个选项且答案为数组 → 多选
  if (options.length >= 2 && Array.isArray(answer) && answer.length >= 2) {
    return QuestionType.MULTI_CHOICE;
  }

  // 答案含 true/false 或题干含判断特征
  if (answer === "true" || answer === "false") {
    return QuestionType.TRUE_FALSE;
  }

  // 题干含判断关键词（仅当无选项时）
  if (options.length === 0 && /是否|对错|正确.*错误|判断/.test(stem)) {
    return QuestionType.TRUE_FALSE;
  }

  // 题干含填空标记
  if (/_{2,}|\([\s]*\)|（）|【[\s]*】/.test(stem)) {
    return QuestionType.FILL_BLANK;
  }

  // 题干含简答/论述关键词
  if (/简述|简答|论述|说明|请.*回答|谈谈|什么是/.test(stem)) {
    return QuestionType.SHORT_ANSWER;
  }

  // 有选项 → 单选/多选
  if (options.length >= 2) {
    // 题干含"多选"关键词
    if (/多选/.test(stem)) return QuestionType.MULTI_CHOICE;
    return QuestionType.SINGLE_CHOICE;
  }

  // 默认简答
  return QuestionType.SHORT_ANSWER;
}
