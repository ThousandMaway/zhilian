import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PracticeMode, QuestionType, QuestionTypeLabel } from "~/types";
import { useAllQuestions, useTags } from "~/queries/questions";
import { usePracticeStore } from "~/stores/practice";
import { pickRandom } from "~/lib/utils";
import tw from "~/lib/tw";

export default function RandomConfigScreen({ navigation }: any) {
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);

  const { data: tags = [] } = useTags();
  const { data: allQuestions } = useAllQuestions();
  const startPractice = usePracticeStore((s) => s.startPractice);
  const insets = useSafeAreaInsets();

  const toggleType = (type: QuestionType) => {
    setSelectedTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  const handleStart = () => {
    setLoading(true);
    let pool = allQuestions?.data || [];
    if (selectedTypes.length > 0) {
      pool = pool.filter((q: any) => selectedTypes.includes(q.type));
    }
    if (selectedTagIds.length > 0) {
      pool = pool.filter((q: any) =>
        (q.tags || []).some((t: any) => selectedTagIds.includes(t.id))
      );
    }
    if (pool.length === 0) {
      Alert.alert("提示", "没有符合条件的题目");
      setLoading(false);
      return;
    }
    const questions = pickRandom(pool, Math.min(questionCount, pool.length));
    startPractice(questions, PracticeMode.FREE);
    setLoading(false);
    navigation.navigate("PracticeQuiz");
  };

  const questionTypes = [
    { type: QuestionType.SINGLE_CHOICE, label: "单选题" },
    { type: QuestionType.MULTI_CHOICE, label: "多选题" },
    { type: QuestionType.TRUE_FALSE, label: "判断题" },
    { type: QuestionType.FILL_BLANK, label: "填空题" },
    { type: QuestionType.SHORT_ANSWER, label: "简答题" },
  ];

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`}>
      <View style={[tw`pb-4 px-4 bg-white border-b border-gray-100`, { paddingTop: insets.top }]}>
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity style={tw`mr-3 p-1`} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color="#3b82f6" />
          </TouchableOpacity>
          <View>
            <Text style={tw`text-2xl font-bold text-gray-800`}>随机练习</Text>
            <Text style={tw`text-gray-400 text-sm mt-1`}>选择题库、题型和数量</Text>
          </View>
        </View>
      </View>

      {/* 题库标签 */}
      {tags.length > 0 && (
        <>
          <Text style={tw`px-4 mt-6 mb-3 text-gray-800 font-semibold`}>
            题库来源（可多选，不选则全部）
          </Text>
          <View style={tw`px-4 flex-row flex-wrap gap-2 mb-4`}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={tw`px-4 py-2 rounded-full border ${
                  selectedTagIds.includes(tag.id) ? "bg-primary-600 border-primary-600" : "bg-white border-gray-200"
                }`}
                onPress={() =>
                  setSelectedTagIds((prev) =>
                    prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                  )
                }
              >
                <Text style={tw`text-sm ${selectedTagIds.includes(tag.id) ? "text-white" : "text-gray-600"}`}>
                  {tag.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* 题型 */}
      <Text style={tw`px-4 mt-4 mb-3 text-gray-800 font-semibold`}>
        题目类型（可多选，不选则全部）
      </Text>
      <View style={tw`px-4 flex-row flex-wrap gap-2 mb-4`}>
        {questionTypes.map((qt) => (
          <TouchableOpacity
            key={qt.type}
            style={tw`px-4 py-2 rounded-full border ${
              selectedTypes.includes(qt.type) ? "bg-primary-600 border-primary-600" : "bg-white border-gray-200"
            }`}
            onPress={() => toggleType(qt.type)}
          >
            <Text style={tw`text-sm ${selectedTypes.includes(qt.type) ? "text-white" : "text-gray-600"}`}>
              {qt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 数量 */}
      <Text style={tw`px-4 mt-4 mb-3 text-gray-800 font-semibold`}>
        题目数量：{questionCount} 题
      </Text>
      <View style={tw`px-4 flex-row gap-2 mb-8`}>
        {[5, 10, 15, 20, 30].map((n) => (
          <TouchableOpacity
            key={n}
            style={tw`px-4 py-2 rounded-full ${questionCount === n ? "bg-primary-600" : "bg-white border border-gray-200"}`}
            onPress={() => setQuestionCount(n)}
          >
            <Text style={tw`text-sm ${questionCount === n ? "text-white" : "text-gray-600"}`}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 开始按钮 */}
      <View style={tw`px-4 mb-10`}>
        <TouchableOpacity
          style={tw`bg-primary-600 rounded-xl py-4 items-center`}
          onPress={handleStart}
          disabled={loading}
        >
          <Text style={tw`text-white font-semibold text-lg`}>开始随机练习</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
