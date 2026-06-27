import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  ArrowLeft,
  Plus,
  X,
  GripVertical,
  FileText,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAllQuestions, useTags } from "~/queries/questions";
import {
  usePaper,
  useCreatePaper,
  useUpdatePaperQuestions,
} from "~/queries/practice";
import { usePracticeStore } from "~/stores/practice";
import tw from "~/lib/tw";
import type { Question } from "~/types";

export default function PaperEditScreen({ route, navigation }: any) {
  const { paperId } = route.params || {};
  const isEdit = !!paperId;
  const insets = useSafeAreaInsets();

  const { data: existingPaper, isLoading: paperLoading } = usePaper(
    isEdit ? paperId : undefined
  );
  const { data: allQuestions } = useAllQuestions();
  const { data: tags = [] } = useTags();
  const createMutation = useCreatePaper();
  const updateMutation = useUpdatePaperQuestions();
  const startPractice = usePracticeStore((s) => s.startPractice);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterTagId, setFilterTagId] = useState<string | null>(null);

  // 回填编辑数据
  useEffect(() => {
    if (existingPaper) {
      setTitle(existingPaper.title);
      setDescription(existingPaper.description || "");
      const pq = (existingPaper as any).paper_questions || [];
      const ids = pq
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((item: any) => item.question_id);
      setSelectedIds(ids);
    }
  }, [existingPaper]);

  const questions = useMemo(() => {
    let pool = allQuestions?.data || [];
    if (search) {
      pool = pool.filter((q: Question) =>
        q.stem.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filterTagId) {
      pool = pool.filter((q: Question) =>
        (q.tags || []).some((t) => t.id === filterTagId)
      );
    }
    // 已选题目排到前面
    const selected = pool.filter((q) => selectedIds.includes(q.id));
    const unselected = pool.filter((q) => !selectedIds.includes(q.id));
    return [...selected, ...unselected];
  }, [allQuestions, search, filterTagId, selectedIds]);

  const toggleQuestion = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleStart = () => {
    const selectedQuestions = questions.filter((q) =>
      selectedIds.includes(q.id)
    );
    if (selectedQuestions.length === 0) {
      Alert.alert("提示", "请至少选择一道题目");
      return;
    }
    const ordered = selectedIds
      .map((id) => selectedQuestions.find((q) => q.id === id))
      .filter(Boolean) as Question[];
    startPractice(ordered, "paper" as any);
    navigation.navigate("PracticeQuiz");
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("提示", "请输入试卷标题");
      return;
    }
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          paperId,
          questionIds: selectedIds,
        });
        // 同步更新标题和描述
        const { supabase } = await import("~/lib/supabase");
        await supabase
          .from("papers")
          .update({ title: title.trim(), description: description.trim() || null })
          .eq("id", paperId);
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          questionIds: selectedIds,
        });
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("保存失败", err.message);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const selectedCount = selectedIds.length;

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`}>
      <View style={[tw`pb-4 px-4 bg-white border-b border-gray-100`, { paddingTop: insets.top }]}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center`}>
            <TouchableOpacity style={tw`mr-3 p-1`} onPress={() => navigation.goBack()}>
              <ArrowLeft size={22} color="#3b82f6" />
            </TouchableOpacity>
            <Text style={tw`text-xl font-bold text-gray-800`}>
              {isEdit ? "编辑试卷" : "创建试卷"}
            </Text>
          </View>
          <TouchableOpacity
            style={tw`bg-primary-600 rounded-xl px-5 py-2`}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={tw`text-white font-medium`}>保存</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 基本信息 */}
      <View style={tw`px-4 mt-4`}>
        <Text style={tw`text-sm font-medium text-gray-500 mb-2`}>试卷标题</Text>
        <TextInput
          style={tw`bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900`}
          placeholder="例如：2024年考研政治模拟卷"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={tw`px-4 mt-3`}>
        <Text style={tw`text-sm font-medium text-gray-500 mb-2`}>
          试卷说明（选填）
        </Text>
        <TextInput
          style={tw`bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900`}
          placeholder="例如：考试时间90分钟，满分100分"
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* 开始答题按钮 */}
      {isEdit && selectedCount > 0 && (
        <View style={tw`px-4 mt-4`}>
          <TouchableOpacity
            style={tw`bg-green-600 rounded-xl py-3 items-center`}
            onPress={handleStart}
          >
            <Text style={tw`text-white font-semibold text-base`}>
              开始答题（{selectedCount} 题）
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 选题区域 */}
      <View style={tw`px-4 mt-4`}>
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <Text style={tw`text-sm font-medium text-gray-500`}>
            选择题目（已选 {selectedCount} 题）
          </Text>
        </View>

        {/* 搜索 */}
        <TextInput
          style={tw`bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 mb-3`}
          placeholder="搜索题目..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />

        {/* 标签筛选 */}
        {tags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={tw`mb-3`}
          >
            <TouchableOpacity
              style={tw`mr-2 px-3 py-1.5 rounded-full ${
                filterTagId === null ? "bg-primary-600" : "bg-gray-100"
              }`}
              onPress={() => setFilterTagId(null)}
            >
              <Text
                style={tw`text-xs ${
                  filterTagId === null ? "text-white" : "text-gray-600"
                }`}
              >
                全部
              </Text>
            </TouchableOpacity>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={tw`mr-2 px-3 py-1.5 rounded-full ${
                  filterTagId === tag.id ? "bg-primary-600" : "bg-gray-100"
                }`}
                onPress={() =>
                  setFilterTagId(filterTagId === tag.id ? null : tag.id)
                }
              >
                <Text
                  style={tw`text-xs ${
                    filterTagId === tag.id ? "text-white" : "text-gray-600"
                  }`}
                >
                  {tag.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* 题目列表 */}
        {questions.map((q) => {
          const isSelected = selectedIds.includes(q.id);
          const index = selectedIds.indexOf(q.id);
          return (
            <TouchableOpacity
              key={q.id}
              style={tw`bg-white rounded-xl p-4 mb-2 border ${
                isSelected ? "border-primary-400 bg-primary-50" : "border-gray-100"
              }`}
              onPress={() => toggleQuestion(q.id)}
            >
              <View style={tw`flex-row items-start`}>
                {isSelected && (
                  <View style={tw`bg-primary-600 rounded-full w-6 h-6 items-center justify-center mr-2 mt-0.5`}>
                    <Text style={tw`text-white text-xs font-bold`}>
                      {index + 1}
                    </Text>
                  </View>
                )}
                {!isSelected && (
                  <View style={tw`w-6 h-6 rounded-full border border-gray-300 items-center justify-center mr-2 mt-0.5`}>
                    <Plus size={12} color="#d1d5db" />
                  </View>
                )}
                <View style={tw`flex-1`}>
                  <Text style={tw`text-gray-800 text-sm leading-5`} numberOfLines={2}>
                    {q.stem}
                  </Text>
                  <View style={tw`flex-row mt-1 gap-2`}>
                    <Text style={tw`text-gray-400 text-xs`}>
                      {q.type === "single_choice"
                        ? "单选"
                        : q.type === "multi_choice"
                        ? "多选"
                        : q.type === "true_false"
                        ? "判断"
                        : q.type === "fill_blank"
                        ? "填空"
                        : "简答"}
                    </Text>
                    {(q.tags || []).map((t: any) => (
                      <Text key={t.id} style={tw`text-primary-400 text-xs`}>
                        {t.name}
                      </Text>
                    ))}
                  </View>
                </View>
                {isSelected && (
                  <X
                    size={16}
                    color="#ef4444"
                    style={tw`ml-2 mt-0.5`}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={tw`h-8`} />
    </ScrollView>
  );
}
