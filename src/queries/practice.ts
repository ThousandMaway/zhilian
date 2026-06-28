import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import type { PracticeRecord, WrongQuestion, DailyCheckin, Paper, Question } from "~/types";
import { checkShortAnswer } from "~/lib/utils";
import { DAILY_CHECKIN_GOAL } from "~/constants";

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("未登录");
  return data.user.id;
}

// ============================================================
// Practice Records
// ============================================================

export function usePracticeRecords(filters?: {
  questionId?: string;
  paperId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["practice_records", filters],
    queryFn: async () => {
      let query = supabase
        .from("practice_records")
        .select("*, questions(stem, type)")
        .order("created_at", { ascending: false });

      if (filters?.questionId) {
        query = query.eq("question_id", filters.questionId);
      }
      if (filters?.paperId) {
        query = query.eq("paper_id", filters.paperId);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePracticeRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      record: Omit<PracticeRecord, "id" | "created_at" | "user_id">
    ) => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("practice_records")
        .insert({ ...record, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practice_records"] });
    },
  });
}

export function useBulkCreatePracticeRecords() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      records: Omit<PracticeRecord, "id" | "created_at" | "user_id">[]
    ) => {
      const userId = await getUserId();
      const { error } = await supabase
        .from("practice_records")
        .insert(records.map((r) => ({ ...r, user_id: userId })));
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practice_records"] });
      queryClient.invalidateQueries({ queryKey: ["wrong_questions"] });
      queryClient.invalidateQueries({ queryKey: ["daily_checkins"] });
    },
  });
}

// ============================================================
// Wrong Questions
// ============================================================

export function useWrongQuestions() {
  return useQuery({
    queryKey: ["wrong_questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wrong_questions")
        .select("*, questions(*)")
        .order("last_wrong_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddWrongQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      questionId,
    }: {
      questionId: string;
    }) => {
      // Upsert: 如果已存在则 wrong_count + 1
      const { data: existing, error } = await supabase
        .from("wrong_questions")
        .select("id, wrong_count")
        .eq("question_id", questionId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (existing) {
        await supabase
          .from("wrong_questions")
          .update({
            wrong_count: existing.wrong_count + 1,
            last_wrong_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        const userId = await getUserId();
        await supabase.from("wrong_questions").insert({
          user_id: userId,
          question_id: questionId,
          wrong_count: 1,
          last_wrong_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wrong_questions"] });
    },
  });
}

// 批量记录错题（并行，比逐条调用快 N 倍）
export function useAddWrongQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionIds }: { questionIds: string[] }) => {
      if (questionIds.length === 0) return;
      const userId = await getUserId();
      await Promise.all(
        questionIds.map(async (questionId) => {
          try {
            const { data: existing, error } = await supabase
              .from("wrong_questions")
              .select("id, wrong_count")
              .eq("question_id", questionId)
              .single();
            if (error && error.code !== "PGRST116") throw error;
            if (existing) {
              await supabase
                .from("wrong_questions")
                .update({
                  wrong_count: existing.wrong_count + 1,
                  last_wrong_at: new Date().toISOString(),
                })
                .eq("id", existing.id);
            } else {
              await supabase.from("wrong_questions").insert({
                user_id: userId,
                question_id: questionId,
                wrong_count: 1,
                last_wrong_at: new Date().toISOString(),
              });
            }
          } catch {
            // 单条失败不影响其他
          }
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wrong_questions"] });
    },
  });
}

export function useRemoveWrongQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questionId: string) => {
      await supabase
        .from("wrong_questions")
        .delete()
        .eq("question_id", questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wrong_questions"] });
    },
  });
}

// ============================================================
// Daily Checkins
// ============================================================

export function useDailyCheckins(days?: number) {
  return useQuery({
    queryKey: ["daily_checkins", days],
    queryFn: async () => {
      let query = supabase
        .from("daily_checkins")
        .select("*")
        .order("date", { ascending: false });

      if (days) {
        query = query.limit(days);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DailyCheckin[];
    },
  });
}

export function useTodayCheckin() {
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["daily_checkins", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("date", today)
        .single();
      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      return data as DailyCheckin | null;
    },
  });
}

export function useUpsertCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionCount: number) => {
      const today = new Date().toISOString().split("T")[0];

      const { data: existing, error } = await supabase
        .from("daily_checkins")
        .select("id, question_count")
        .eq("date", today)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (existing) {
        await supabase
          .from("daily_checkins")
          .update({
            question_count: existing.question_count + questionCount,
          })
          .eq("id", existing.id);
      } else {
        const userId = await getUserId();
        await supabase.from("daily_checkins").insert({
          user_id: userId,
          date: today,
          question_count: questionCount,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily_checkins"] });
    },
  });
}

// ============================================================
// Favorites
// ============================================================

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("*, questions(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      questionId,
      isFavorited,
    }: {
      questionId: string;
      isFavorited: boolean;
    }) => {
      if (isFavorited) {
        await supabase.from("favorites").delete().eq("question_id", questionId);
      } else {
        const userId = await getUserId();
        await supabase.from("favorites").insert({ user_id: userId, question_id: questionId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useIsFavorited(questionId: string) {
  return useQuery({
    queryKey: ["favorites", "check", questionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("question_id", questionId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    },
  });
}

// 批量查询哪些题目已收藏，返回 Set<questionId>
export function useFavoritedIds(questionIds: string[]) {
  return useQuery({
    queryKey: ["favorites", "ids", questionIds],
    queryFn: async () => {
      if (!questionIds || questionIds.length === 0) return new Set<string>();
      const { data, error } = await supabase
        .from("favorites")
        .select("question_id")
        .in("question_id", questionIds);
      if (error) throw error;
      return new Set((data || []).map((r) => r.question_id));
    },
  });
}

// ============================================================
// Papers
// ============================================================

export function usePapers() {
  return useQuery({
    queryKey: ["papers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("papers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Paper[];
    },
  });
}

export function usePaper(id: string | undefined) {
  return useQuery({
    queryKey: ["paper", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("papers")
        .select("*, paper_questions(question_id, sort_order, questions(*))")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Paper & {
        paper_questions: Array<{
          question_id: string;
          sort_order: number;
          questions: Question;
        }>;
      };
    },
    enabled: !!id,
  });
}

export function useCreatePaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      questionIds,
    }: {
      title: string;
      description?: string;
      questionIds: string[];
    }) => {
      const userId = await getUserId();
      const { data: paper, error } = await supabase
        .from("papers")
        .insert({
          user_id: userId,
          title,
          description: description || null,
          question_count: questionIds.length,
        })
        .select()
        .single();
      if (error) throw error;

      if (questionIds.length > 0) {
        const links = questionIds.map((qid, idx) => ({
          paper_id: paper.id,
          question_id: qid,
          sort_order: idx + 1,
        }));
        await supabase.from("paper_questions").insert(links);
      }

      return paper;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["papers"] });
    },
  });
}

export function useDeletePaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("papers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["papers"] });
    },
  });
}

export function useUpdatePaperQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      paperId,
      questionIds,
    }: {
      paperId: string;
      questionIds: string[];
    }) => {
      await supabase.from("paper_questions").delete().eq("paper_id", paperId);

      if (questionIds.length > 0) {
        const links = questionIds.map((qid, idx) => ({
          paper_id: paperId,
          question_id: qid,
          sort_order: idx + 1,
        }));
        await supabase.from("paper_questions").insert(links);
      }

      await supabase
        .from("papers")
        .update({ question_count: questionIds.length })
        .eq("id", paperId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["papers"] });
      queryClient.invalidateQueries({ queryKey: ["paper"] });
    },
  });
}

// ============================================================
// AI 判题（简答题）：AI 优先，失败降级为关键词匹配
// ============================================================

export interface AiEvaluateResult {
  score: number;
  comment: string;
  isCorrect: boolean;
  source: "ai" | "keyword";
}

export function useAiEvaluate() {
  return useMutation({
    mutationFn: async ({
      question,
      userAnswer,
      referenceAnswer,
    }: {
      question: string;
      userAnswer: string;
      referenceAnswer: string;
    }): Promise<AiEvaluateResult> => {
      try {
        const res = await supabase.functions.invoke("ai-evaluate", {
          body: { question, userAnswer, referenceAnswer },
        });

        if (res.error) throw res.error;

        const data = res.data as any;
        if (data?.fallback || data?.score === undefined) {
          throw new Error("AI fallback");
        }

        return { ...data, source: "ai" };
      } catch {
        // 降级：关键词匹配
        const isCorrect = checkShortAnswer(userAnswer, referenceAnswer);
        return {
          score: isCorrect ? 80 : 30,
          comment: isCorrect ? "关键词匹配通过" : "关键词匹配不完全，待人工批改",
          isCorrect,
          source: "keyword",
        };
      }
    },
  });
}
