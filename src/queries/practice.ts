import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import type { PracticeRecord, WrongQuestion, DailyCheckin } from "~/types";
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
