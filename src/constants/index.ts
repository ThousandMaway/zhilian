import { QuestionType, Difficulty } from "~/types";

// Supabase 项目配置（通过环境变量注入）
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// 应用名称
export const APP_NAME = "智练";

// 打卡每日目标题数
export const DAILY_CHECKIN_GOAL = 20;

// 题目类型选项列表
export const QUESTION_TYPE_OPTIONS = Object.entries(QuestionType).map(
  ([, value]) => ({
    label: value,
    value,
  })
);

// 难度选项列表
export const DIFFICULTY_OPTIONS = Object.entries(Difficulty)
  .filter(([key]) => isNaN(Number(key)))
  .map(([, value]) => ({
    label: value,
    value: Number(value),
  }));

// 分页默认大小
export const PAGE_SIZE = 20;
