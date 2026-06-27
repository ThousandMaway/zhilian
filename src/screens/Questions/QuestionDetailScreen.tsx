import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  ChevronLeft,
  Trash2,
  Pencil,
  Star,
  CheckCircle2,
  XCircle,
} from "lucide-react-native";
import { useQuestion, useDeleteQuestion } from "~/queries/questions";
import { QuestionType, QuestionTypeLabel } from "~/types";
import type { QuestionOption } from "~/types";
import tw from "~/lib/tw";

export default function QuestionDetailScreen({ route, navigation }: any) {
  const { questionId } = route.params || {};
  const { data: question, isLoading } = useQuestion(questionId);
  const deleteMutation = useDeleteQuestion();
  const [showAnswer, setShowAnswer] = useState(false);

  const handleDelete = () => {
    Alert.alert("确认删除", "删除后不可恢复，确定要删除这道题吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: () => {
          deleteMutation.mutate(questionId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-white`}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!question) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-white`}>
        <Text style={tw`text-gray-400`}>题目不存在</Text>
      </View>
    );
  }

  const typeColor: Record<string, string> = {
    single_choice: "bg-blue-100 text-blue-700",
    multi_choice: "bg-purple-100 text-purple-700",
    true_false: "bg-green-100 text-green-700",
    fill_blank: "bg-orange-100 text-orange-700",
    short_answer: "bg-pink-100 text-pink-700",
  };

  const isTrueFalse = question.type === QuestionType.TRUE_FALSE;
  const hasOptions = [
    QuestionType.SINGLE_CHOICE,
    QuestionType.MULTI_CHOICE,
  ].includes(question.type as QuestionType);

  const options: QuestionOption[] = question.options || [];
  const answer = question.answer;
  const isMultiAnswer = Array.isArray(answer);

  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      {/* 顶部信息 */}
      <View style={tw`px-4 pt-4 pb-6 border-b border-gray-100`}>
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View
            style={tw`rounded-lg px-3 py-1 ${typeColor[question.type] || "bg-gray-100"}`}
          >
            <Text style={tw`text-sm font-medium`}>
              {QuestionTypeLabel[question.type as QuestionType]}
            </Text>
          </View>
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("QuestionEdit", { questionId: question.id })
              }
            >
              <Pencil size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 题干 */}
        <Text style={tw`text-lg font-semibold text-gray-900 leading-7`}>
          {question.stem}
        </Text>

        {/* 标签 */}
        {question.tags && question.tags.length > 0 && (
          <View style={tw`flex-row flex-wrap mt-3`}>
            {question.tags.map((tag: any) => (
              <View
                key={tag.id}
                style={tw`bg-gray-100 rounded-full px-3 py-1 mr-2 mb-1`}
              >
                <Text style={tw`text-gray-500 text-xs`}>{tag.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 选项区域（单选/多选） */}
      {hasOptions && options.length > 0 && (
        <View style={tw`px-4 py-4 border-b border-gray-100`}>
          <Text style={tw`text-sm font-medium text-gray-500 mb-3`}>选项</Text>
          {options.map((opt, idx) => {
            const isSelected = isMultiAnswer
              ? (answer as string[]).includes(opt.id)
              : answer === opt.id;
            return (
              <View
                key={opt.id}
                style={tw`flex-row items-center p-4 rounded-xl mb-2 border ${
                  showAnswer && isSelected
                    ? "border-green-300 bg-green-50"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <View
                  style={tw`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                    showAnswer && isSelected ? "bg-green-500" : "bg-gray-200"
                  }`}
                >
                  <Text
                    style={tw`text-sm font-bold ${
                      showAnswer && isSelected ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {opt.id}
                  </Text>
                </View>
                <Text style={tw`flex-1 text-gray-800 text-[15px]`}>
                  {opt.content}
                </Text>
                {showAnswer && isSelected && (
                  <CheckCircle2 size={20} color="#22c55e" />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* 判断题选项 */}
      {isTrueFalse && (
        <View style={tw`px-4 py-4 border-b border-gray-100`}>
          <Text style={tw`text-sm font-medium text-gray-500 mb-3`}>答案</Text>
          <View style={tw`flex-row gap-3`}>
            <View
              style={tw`flex-1 p-4 rounded-xl border items-center ${
                showAnswer && answer === "true"
                  ? "border-green-300 bg-green-50"
                  : "border-gray-100 bg-gray-50"
              }`}
            >
              <Text style={tw`text-gray-800 font-medium`}>✅ 正确</Text>
            </View>
            <View
              style={tw`flex-1 p-4 rounded-xl border items-center ${
                showAnswer && answer === "false"
                  ? "border-green-300 bg-green-50"
                  : "border-gray-100 bg-gray-50"
              }`}
            >
              <Text style={tw`text-gray-800 font-medium`}>❌ 错误</Text>
            </View>
          </View>
        </View>
      )}

      {/* 填空/简答题答案 */}
      {!hasOptions && !isTrueFalse && (
        <View style={tw`px-4 py-4 border-b border-gray-100`}>
          <Text style={tw`text-sm font-medium text-gray-500 mb-3`}>
            参考答案
          </Text>
          {showAnswer ? (
            <View style={tw`bg-green-50 border border-green-200 rounded-xl p-4`}>
              <Text style={tw`text-gray-800 leading-6`}>
                {typeof answer === "string" ? answer : JSON.stringify(answer)}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={tw`bg-gray-50 border border-gray-200 rounded-xl p-4 items-center`}
              onPress={() => setShowAnswer(true)}
            >
              <Text style={tw`text-primary-600 font-medium`}>
                点击查看答案
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 显示/隐藏答案按钮（有选项的题型） */}
      {(hasOptions || isTrueFalse) && (
        <View style={tw`px-4 py-4`}>
          <TouchableOpacity
            style={tw`rounded-xl py-3 items-center border ${
              showAnswer
                ? "bg-gray-100 border-gray-200"
                : "bg-primary-600 border-primary-600"
            }`}
            onPress={() => setShowAnswer(!showAnswer)}
          >
            <Text
              style={tw`font-medium ${
                showAnswer ? "text-gray-600" : "text-white"
              }`}
            >
              {showAnswer ? "隐藏答案" : "显示答案"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 解析 */}
      {question.analysis && showAnswer && (
        <View style={tw`px-4 pb-8`}>
          <Text style={tw`text-sm font-medium text-gray-500 mb-3`}>
            题目解析
          </Text>
          <View style={tw`bg-blue-50 border border-blue-100 rounded-xl p-4`}>
            <Text style={tw`text-gray-700 leading-6`}>{question.analysis}</Text>
          </View>
        </View>
      )}

      <View style={tw`h-8`} />
    </ScrollView>
  );
}
