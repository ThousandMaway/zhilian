import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Trash2, RotateCcw, BookOpen, ChevronRight, Check, X } from "lucide-react-native";
import { useWrongQuestions, useRemoveWrongQuestion } from "~/queries/practice";
import { usePracticeStore } from "~/stores/practice";
import { QuestionType } from "~/types";
import type { Question } from "~/types";
import tw from "~/lib/tw";

export default function WrongQuestionsScreen({ navigation }: any) {
  const { data: wrongQuestions, isLoading } = useWrongQuestions();
  const removeWrong = useRemoveWrongQuestion();
  const startPractice = usePracticeStore((s) => s.startPractice);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleRemove = (questionId: string) => {
    Alert.alert("移除错题", "确定要从错题本中移除这道题吗？", [
      { text: "取消", style: "cancel" },
      { text: "移除", style: "destructive", onPress: () => removeWrong.mutate(questionId) },
    ]);
  };

  const handleBatchRemove = () => {
    if (selectedIds.size === 0) return;
    Alert.alert("批量移除", `确定要移除选中的 ${selectedIds.size} 道错题吗？`, [
      { text: "取消", style: "cancel" },
      {
        text: "移除",
        style: "destructive",
        onPress: () => {
          selectedIds.forEach((id) => removeWrong.mutate(id));
          setSelectedIds(new Set());
          setSelectionMode(false);
        },
      },
    ]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) setSelectionMode(false);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRetrySingle = (question: Question) => {
    startPractice([question], "wrong" as any);
    navigation.navigate("PracticeTab", { screen: "PracticeQuiz" });
  };

  const handleRetryAll = () => {
    const questions = (wrongQuestions || [])
      .map((wq: any) => wq.questions)
      .filter(Boolean) as Question[];
    if (questions.length === 0) {
      Alert.alert("提示", "没有可练习的错题");
      return;
    }
    startPractice(questions, "wrong" as any);
    navigation.navigate("PracticeTab", { screen: "PracticeQuiz" });
  };

  const grouped = useMemo(() => {
    const tagMap: Record<string, { tagName: string; items: any[] }> = {};
    const untagged: any[] = [];
    for (const wq of wrongQuestions || []) {
      const tags = wq.questions?.tags || [];
      if (tags.length > 0) {
        for (const tag of tags) {
          if (!tagMap[tag.id]) tagMap[tag.id] = { tagName: tag.name, items: [] };
          if (!tagMap[tag.id].items.some((i) => i.id === wq.id)) {
            tagMap[tag.id].items.push(wq);
          }
        }
      } else {
        untagged.push(wq);
      }
    }
    const sections: { key: string; tagName: string; items: any[] }[] = [];
    for (const [id, group] of Object.entries(tagMap)) {
      sections.push({ key: id, tagName: group.tagName, items: group.items });
    }
    if (untagged.length > 0) {
      sections.push({ key: "__untagged__", tagName: "未分类", items: untagged });
    }
    return sections;
  }, [wrongQuestions]);

  const getTypeBadge = (type: string) => {
    const map: Record<string, { color: string; label: string }> = {
      single_choice: { color: "bg-blue-100 text-blue-700", label: "单选" },
      multi_choice: { color: "bg-purple-100 text-purple-700", label: "多选" },
      true_false: { color: "bg-green-100 text-green-700", label: "判断" },
      fill_blank: { color: "bg-orange-100 text-orange-700", label: "填空" },
      short_answer: { color: "bg-pink-100 text-pink-700", label: "简答" },
    };
    return map[type] || { color: "bg-gray-100 text-gray-600", label: type };
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-gray-50`}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const count = wrongQuestions?.length || 0;

  const renderSection = ({ item: section }: { item: typeof grouped[number] }) => (
    <View style={tw`mb-4`}>
      <View style={tw`flex-row items-center px-4 mb-2`}>
        <BookOpen size={16} color="#6b7280" />
        <Text style={tw`text-gray-500 text-sm font-medium ml-1.5`}>{section.tagName}</Text>
        <Text style={tw`text-gray-300 text-xs ml-2`}>{section.items.length} 题</Text>
      </View>
      {section.items.map((item: any) => {
        const question = item.questions as Question | null;
        if (!question) return null;
        const badge = getTypeBadge(question.type);
        const isSelected = selectedIds.has(question.id);

        return (
          <TouchableOpacity
            key={item.id}
            style={tw`bg-white rounded-xl p-4 mb-2 mx-4 border ${isSelected ? "border-primary-400 bg-primary-50" : "border-gray-100"}`}
            onPress={() => {
              if (selectionMode) {
                toggleSelect(question.id);
              } else {
                handleRetrySingle(question);
              }
            }}
            onLongPress={() => {
              if (!selectionMode) {
                setSelectionMode(true);
                setSelectedIds(new Set([question.id]));
              }
            }}
          >
            <View style={tw`flex-row items-start`}>
              {selectionMode && (
                <View style={tw`w-6 h-6 rounded-full border-2 items-center justify-center mr-2 mt-0.5 ${isSelected ? "bg-primary-600 border-primary-600" : "border-gray-300"}`}>
                  {isSelected && <Check size={14} color="white" />}
                </View>
              )}
              <View style={tw`rounded px-2 py-0.5 mr-2 mt-0.5 ${badge.color}`}>
                <Text style={tw`text-xs font-medium`}>{badge.label}</Text>
              </View>
              <Text style={tw`text-gray-800 flex-1 leading-5 text-[15px]`} numberOfLines={2}>
                {question.stem}
              </Text>
              {!selectionMode && <ChevronRight size={16} color="#d1d5db" style={tw`mt-1 ml-1`} />}
            </View>
            <View style={tw`flex-row items-center justify-between mt-3 pt-3 border-t border-gray-50`}>
              <Text style={tw`text-gray-400 text-xs`}>
                错误 <Text style={tw`text-red-500 font-bold`}>{item.wrong_count}</Text> 次
              </Text>
              {!selectionMode && (
                <TouchableOpacity
                  style={tw`flex-row items-center`}
                  onPress={() => handleRemove(question.id)}
                >
                  <Trash2 size={16} color="#9ca3af" />
                  <Text style={tw`text-gray-400 text-xs ml-1`}>移除</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <View style={tw`bg-white px-4 pt-4 pb-3 border-b border-gray-100`}>
        {selectionMode ? (
          <View style={tw`flex-row items-center justify-between`}>
            <TouchableOpacity
              style={tw`flex-row items-center`}
              onPress={() => { setSelectionMode(false); setSelectedIds(new Set()); }}
            >
              <X size={20} color="#6b7280" />
              <Text style={tw`text-gray-600 ml-1`}>取消</Text>
            </TouchableOpacity>
            <Text style={tw`text-gray-800 font-semibold text-lg`}>
              已选 {selectedIds.size} 项
            </Text>
            <TouchableOpacity
              style={tw`flex-row items-center bg-red-500 rounded-xl px-4 py-2`}
              onPress={handleBatchRemove}
            >
              <Trash2 size={16} color="white" />
              <Text style={tw`text-white ml-1 font-medium text-sm`}>删除</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={tw`flex-row items-center justify-between`}>
            <View>
              <Text style={tw`text-gray-400 text-sm`}>
                {count > 0 ? `共 ${count} 道错题 · 长按多选` : "暂无错题，继续保持！"}
              </Text>
            </View>
            {count > 0 && (
              <TouchableOpacity
                style={tw`flex-row items-center bg-primary-600 rounded-xl px-4 py-2`}
                onPress={handleRetryAll}
              >
                <RotateCcw size={16} color="white" />
                <Text style={tw`text-white ml-1.5 font-medium text-sm`}>全部重练</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {count === 0 ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <Text style={tw`text-6xl mb-4`}>🎉</Text>
          <Text style={tw`text-gray-500 text-base`}>没有错题记录</Text>
          <Text style={tw`text-gray-300 text-sm mt-1`}>继续保持！</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          renderItem={renderSection}
          keyExtractor={(item: any) => item.key}
          style={tw`flex-1 pt-4`}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
