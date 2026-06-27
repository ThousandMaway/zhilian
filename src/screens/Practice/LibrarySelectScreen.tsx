import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BookOpen, ChevronRight, ArrowLeft } from "lucide-react-native";
import { useTags, useAllQuestions } from "~/queries/questions";
import { usePracticeStore } from "~/stores/practice";
import tw from "~/lib/tw";
import type { Question } from "~/types";

export default function LibrarySelectScreen({ navigation }: any) {
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const startPractice = usePracticeStore((s) => s.startPractice);
  const [loading, setLoading] = useState(false);

  // 预取全部题目（带标签信息，不分页）
  const { data: allQuestions } = useAllQuestions();

  // 按标签分组
  const tagQuestionMap = useMemo(() => {
    const map: Record<string, Question[]> = {};
    const questions = allQuestions?.data || [];
    for (const q of questions) {
      const qTags = (q as any).tags || [];
      for (const t of qTags) {
        if (!map[t.id]) map[t.id] = [];
        map[t.id].push(q as Question);
      }
    }
    return map;
  }, [allQuestions]);

  const handleSelectLibrary = (tagId: string, tagName: string) => {
    const questions = tagQuestionMap[tagId] || [];
    if (questions.length === 0) {
      Alert.alert("提示", `"${tagName}" 题库中没有题目`);
      return;
    }
    startPractice(questions, "library" as any);
    navigation.navigate("PracticeQuiz");
  };

  if (tagsLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-gray-50`}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const colors = [
    "bg-blue-50 border-blue-200",
    "bg-purple-50 border-purple-200",
    "bg-green-50 border-green-200",
    "bg-orange-50 border-orange-200",
    "bg-pink-50 border-pink-200",
    "bg-teal-50 border-teal-200",
  ];

  const iconColors = [
    "text-blue-600 bg-blue-100",
    "text-purple-600 bg-purple-100",
    "text-green-600 bg-green-100",
    "text-orange-600 bg-orange-100",
    "text-pink-600 bg-pink-100",
    "text-teal-600 bg-teal-100",
  ];

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`pt-14 pb-4 px-4 bg-white border-b border-gray-100`}>
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity style={tw`mr-3 p-1`} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color="#3b82f6" />
          </TouchableOpacity>
          <View>
            <Text style={tw`text-2xl font-bold text-gray-800`}>选择题库</Text>
            <Text style={tw`text-gray-400 text-sm mt-1`}>
              选择一个题库，从头到尾练习
            </Text>
          </View>
        </View>
      </View>

      {tags.length === 0 ? (
        <View style={tw`items-center justify-center py-20`}>
          <Text style={tw`text-gray-400`}>暂无题库标签</Text>
          <Text style={tw`text-gray-300 text-sm mt-1`}>
            导入题库后会自动生成标签
          </Text>
        </View>
      ) : (
        <View style={tw`px-4 mt-4 gap-3 mb-8`}>
          {tags.map((tag, idx) => (
            <TouchableOpacity
              key={tag.id}
              style={tw`${colors[idx % colors.length]} rounded-2xl p-5 border`}
              onPress={() => handleSelectLibrary(tag.id, tag.name)}
              disabled={loading}
            >
              <View style={tw`flex-row items-center`}>
                <View
                  style={tw`${iconColors[idx % iconColors.length]} w-12 h-12 rounded-xl items-center justify-center`}
                >
                  <BookOpen size={22} />
                </View>
                <View style={tw`flex-1 ml-4`}>
                  <Text style={tw`text-gray-800 font-semibold text-lg`}>
                    {tag.name}
                  </Text>
                  <Text style={tw`text-gray-500 text-sm mt-0.5`}>
                    {tagQuestionMap[tag.id]?.length || 0} 题 · 点击开始练习
                  </Text>
                </View>
                <ChevronRight size={20} color="#d1d5db" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
