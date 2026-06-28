import { clsx, type ClassValue } from "clsx";

// 简易 classname 合并（跨平台兼容）
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// 生成 UUID v4
export function generateId(): string {
  return crypto.randomUUID();
}

// 简答题关键词匹配（公共判题逻辑）
export function checkShortAnswer(userAnswer: string, referenceAnswer: string): boolean {
  if (!userAnswer || !userAnswer.trim() || !referenceAnswer || !referenceAnswer.trim()) {
    return false;
  }
  const keywords = referenceAnswer
    .split(/[,，、\s]+/)
    .filter((k) => k.length >= 2);
  if (keywords.length === 0) return false;
  const user = userAnswer.toLowerCase();
  const matched = keywords.filter((kw) => user.includes(kw.toLowerCase()));
  return matched.length >= Math.ceil(keywords.length / 2);
}

// 格式化日期
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 格式化时间
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// 随机打乱数组
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 从数组中随机选取 n 个
export function pickRandom<T>(array: T[], n: number): T[] {
  return shuffle(array).slice(0, n);
}
