// 题目类型枚举
export enum QuestionType {
  SINGLE_CHOICE = "single_choice",
  MULTI_CHOICE = "multi_choice",
  TRUE_FALSE = "true_false",
  FILL_BLANK = "fill_blank",
  SHORT_ANSWER = "short_answer",
}

export const QuestionTypeLabel: Record<QuestionType, string> = {
  [QuestionType.SINGLE_CHOICE]: "单选题",
  [QuestionType.MULTI_CHOICE]: "多选题",
  [QuestionType.TRUE_FALSE]: "判断题",
  [QuestionType.FILL_BLANK]: "填空题",
  [QuestionType.SHORT_ANSWER]: "简答题",
};

// 题目难度
export enum Difficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
}

export const DifficultyLabel: Record<Difficulty, string> = {
  [Difficulty.EASY]: "简单",
  [Difficulty.MEDIUM]: "中等",
  [Difficulty.HARD]: "困难",
};

// 单选题/多选题选项
export interface QuestionOption {
  id: string; // A, B, C, D...
  content: string;
}

// 题目
export interface Question {
  id: string;
  user_id: string;
  type: QuestionType;
  stem: string; // 题干
  options: QuestionOption[] | null; // 选项（单选/多选/判断用）
  answer: string | string[]; // 答案：单选"A"，多选["A","C"]，判断"true"/"false"，填空/简答为文本
  analysis: string | null; // 解析
  difficulty: Difficulty;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

// 标签
export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
}

// 试卷
export interface Paper {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  question_count: number;
  created_at: string;
}

// 试卷题目关联
export interface PaperQuestion {
  paper_id: string;
  question_id: string;
  sort_order: number;
}

// 答题记录
export interface PracticeRecord {
  id: string;
  user_id: string;
  question_id: string;
  paper_id: string | null;
  user_answer: string | string[] | null;
  is_correct: boolean | null; // 简答题可能为 null（待批改）
  time_spent: number; // 秒
  created_at: string;
}

// 错题
export interface WrongQuestion {
  id: string;
  user_id: string;
  question_id: string;
  wrong_count: number;
  last_wrong_at: string;
}

// 收藏
export interface Favorite {
  id: string;
  user_id: string;
  question_id: string;
  created_at: string;
}

// 每日打卡
export interface DailyCheckin {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  question_count: number;
}

// 用户笔记
export interface UserNote {
  id: string;
  user_id: string;
  question_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// 练习模式
export enum PracticeMode {
  PAPER = "paper",         // 试卷模式
  FREE = "free",           // 随机练习
  LIBRARY = "library",     // 题库练习（按标签选全部题）
  WRONG = "wrong",         // 错题重练
  FAVORITE = "favorite",   // 收藏练习
}

// 导入格式
export enum ImportFormat {
  JSON = "json",
  CSV = "csv",
}
