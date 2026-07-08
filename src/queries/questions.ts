import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import type { Question, Tag } from "~/types";
import { QuestionType } from "~/types";
import { PAGE_SIZE } from "~/constants";

// ============================================================
// Questions
// ============================================================

interface QuestionFilters {
  search?: string;
  type?: QuestionType | null;
  tagId?: string | null;
  page?: number;
}

export function useQuestions(filters: QuestionFilters = {}) {
  return useQuery({
    queryKey: ["questions", filters],
    queryFn: async () => {
      let query = supabase
        .from("questions")
        .select("*, tags(*)", { count: "exact" });

      if (filters.search) {
        query = query.ilike("stem", `%${filters.search}%`);
      }
      if (filters.type) {
        query = query.eq("type", filters.type);
      }
      if (filters.tagId) {
        query = query.filter("tags.id", "eq", filters.tagId);
      }

      const page = filters.page || 1;
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: data as Question[], total: count || 0 };
    },
  });
}

export function useQuestion(id: string | undefined) {
  return useQuery({
    queryKey: ["question", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("questions")
        .select("*, tags(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Question;
    },
    enabled: !!id,
  });
}

export function useAllQuestions() {
  return useQuery({
    queryKey: ["questions", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*, tags(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { data: data as Question[], total: data.length };
    },
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (question: Omit<Question, "id" | "created_at" | "updated_at" | "tags" | "user_id"> & { tag_ids?: string[] }) => {
      const { tag_ids, ...q } = question;
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("questions")
        .insert({ ...q, user_id: userId })
        .select()
        .single();
      if (error) throw error;

      // 关联标签
      if (tag_ids && tag_ids.length > 0) {
        const tagLinks = tag_ids.map((tagId) => ({
          question_id: data.id,
          tag_id: tagId,
        }));
        await supabase.from("question_tags").insert(tagLinks);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Question> & { id: string; tag_ids?: string[] }) => {
      const { tag_ids, ...q } = updates;
      const { error } = await supabase
        .from("questions")
        .update(q)
        .eq("id", id);
      if (error) throw error;

      if (tag_ids !== undefined) {
        await supabase.from("question_tags").delete().eq("question_id", id);
        if (tag_ids.length > 0) {
          const tagLinks = tag_ids.map((tagId) => ({
            question_id: id,
            tag_id: tagId,
          }));
          await supabase.from("question_tags").insert(tagLinks);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

// ============================================================
// Tags
// ============================================================

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Tag[];
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tag: Omit<Tag, "id" | "user_id">) => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("tags")
        .insert({ ...tag, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("tags").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // 先查出该标签下的所有题目 ID
      const { data: links } = await supabase
        .from("question_tags")
        .select("question_id")
        .eq("tag_id", id);

      if (links && links.length > 0) {
        const questionIds = links.map((l) => l.question_id);
        // 删除这些题目（级联删除 question_tags / practice_records / wrong_questions / favorites / user_notes）
        const { error: qError } = await supabase
          .from("questions")
          .delete()
          .in("id", questionIds);
        if (qError) throw qError;
      }

      // 最后删除标签本身
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

// ============================================================
// Bulk Import
// ============================================================

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("未登录");
  return data.user.id;
}

export function useBulkImportQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      questions: Omit<Question, "id" | "created_at" | "updated_at" | "tags" | "user_id">[];
      tagName?: string;
    }) => {
      const { questions, tagName } = params;
      const userId = await getUserId();
      
      // 插入题目
      const { data: inserted, error } = await supabase
        .from("questions")
        .insert(questions.map((q) => ({ ...q, user_id: userId })))
        .select("id");
      if (error) throw error;

      // 自动打标签（用文件名，排除默认题库）
      if (tagName && tagName !== "默认题库" && inserted) {
        // 查找或创建标签
        const { data: existingTag } = await supabase
          .from("tags")
          .select("id")
          .eq("name", tagName)
          .eq("user_id", userId)
          .single();
        
        let tagId = existingTag?.id;
        if (!tagId) {
          const { data: newTag } = await supabase
            .from("tags")
            .insert({ name: tagName, user_id: userId, color: "#3b82f6" })
            .select("id")
            .single();
          tagId = newTag?.id;
        }

        // 关联标签
        if (tagId) {
          const { error: linkError } = await supabase.from("question_tags").insert(
            inserted.map((q: any) => ({ question_id: q.id, tag_id: tagId }))
          );
          if (linkError) console.error("[BulkImport] link tags failed:", linkError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}
