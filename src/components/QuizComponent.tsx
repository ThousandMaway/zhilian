import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { CheckCircle2, XCircle, Star } from "lucide-react-native";
import type { Question, QuestionOption } from "~/types";
import { QuestionType } from "~/types";
import tw from "~/lib/tw";

interface QuizComponentProps {
  question: Question;
  selectedAnswer: string | string[] | null;
  showResult: boolean;
  isFavorited: boolean;
  onAnswer: (answer: string | string[]) => void;
  onToggleFavorite: () => void;
}

// ============================================================
// 单选题
// ============================================================
function SingleChoiceQuiz({
  question,
  selectedAnswer,
  showResult,
  isFavorited,
  onAnswer,
  onToggleFavorite,
}: QuizComponentProps) {
  const options: QuestionOption[] = (question.options as QuestionOption[]) || [];
  const correctAnswer = question.answer as string;

  return (
    <View>
      <OptionList
        options={options}
        selectedIds={selectedAnswer ? [selectedAnswer as string] : []}
        correctIds={showResult ? [correctAnswer] : []}
        showResult={showResult}
        multiSelect={false}
        onSelect={(id) => onAnswer(id)}
      />
      <FavoriteButton isFavorited={isFavorited} onPress={onToggleFavorite} />
    </View>
  );
}

// ============================================================
// 多选题
// ============================================================
function MultiChoiceQuiz({
  question,
  selectedAnswer,
  showResult,
  isFavorited,
  onAnswer,
  onToggleFavorite,
}: QuizComponentProps) {
  const options: QuestionOption[] = (question.options as QuestionOption[]) || [];
  const correctAnswer = question.answer as string[];
  const [localSelection, setLocalSelection] = useState<string[]>(
    () => (selectedAnswer as string[]) || []
  );

  const toggleOption = (id: string) => {
    const newSelection = localSelection.includes(id)
      ? localSelection.filter((s) => s !== id)
      : [...localSelection, id];
    setLocalSelection(newSelection);
    onAnswer(newSelection);
  };

  // 显示答案时用用户已提交的答案，否则用本地选择
  const displayIds = showResult
    ? (selectedAnswer as string[]) || []
    : localSelection;

  return (
    <View>
      <OptionList
        options={options}
        selectedIds={displayIds}
        correctIds={showResult ? correctAnswer : []}
        showResult={showResult}
        multiSelect={true}
        onSelect={toggleOption}
      />
      <FavoriteButton isFavorited={isFavorited} onPress={onToggleFavorite} />
    </View>
  );
}

// ============================================================
// 判断题
// ============================================================
function TrueFalseQuiz({
  question,
  selectedAnswer,
  showResult,
  isFavorited,
  onAnswer,
  onToggleFavorite,
}: QuizComponentProps) {
  const correctAnswer = question.answer as string;

  const renderButton = (value: string, emoji: string, label: string) => {
    const isSelected = selectedAnswer === value;
    const isCorrect = showResult && value === correctAnswer;
    const isWrongSelection = showResult && isSelected && value !== correctAnswer;

    let borderClass = "border-gray-200 bg-gray-50";
    if (isSelected && !showResult) borderClass = "border-primary-500 bg-primary-50";
    if (isCorrect) borderClass = "border-green-500 bg-green-50";
    if (isWrongSelection) borderClass = "border-red-500 bg-red-50";

    return (
      <TouchableOpacity
        style={tw`flex-1 p-5 rounded-xl border items-center ${borderClass}`}
        onPress={() => onAnswer(value)}
        disabled={showResult}
      >
        <Text style={tw`text-3xl mb-1`}>{emoji}</Text>
        <Text style={tw`text-gray-700 font-medium text-lg`}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <View style={tw`flex-row gap-4 mt-2`}>
        {renderButton("true", "✅", "正确")}
        {renderButton("false", "❌", "错误")}
      </View>
      <FavoriteButton isFavorited={isFavorited} onPress={onToggleFavorite} />
    </View>
  );
}

// ============================================================
// 填空题
// ============================================================
function FillBlankQuiz({
  question,
  selectedAnswer,
  showResult,
  isFavorited,
  onAnswer,
  onToggleFavorite,
}: QuizComponentProps) {
  const correctAnswer = (question.answer as string) || "";
  const [localInput, setLocalInput] = useState(() => (selectedAnswer as string) || "");

  const isCorrect =
    showResult &&
    (selectedAnswer as string || "").trim().toLowerCase() === correctAnswer.trim().toLowerCase();

  return (
    <View>
      <TextInput
        style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900`}
        placeholder="请输入你的答案..."
        placeholderTextColor="#9ca3af"
        value={showResult ? (selectedAnswer as string) || "" : localInput}
        onChangeText={(text) => {
          setLocalInput(text);
          onAnswer(text);
        }}
        editable={!showResult}
      />

      {showResult && (
        <View style={tw`mt-4`}>
          {isCorrect ? (
            <View style={tw`bg-green-50 border border-green-200 rounded-xl p-4 flex-row items-center`}>
              <CheckCircle2 size={20} color="#22c55e" />
              <Text style={tw`text-green-700 ml-2 font-medium`}>回答正确！</Text>
            </View>
          ) : (
            <View style={tw`bg-red-50 border border-red-200 rounded-xl p-4`}>
              <View style={tw`flex-row items-center mb-2`}>
                <XCircle size={20} color="#ef4444" />
                <Text style={tw`text-red-700 ml-2 font-medium`}>回答错误</Text>
              </View>
              <Text style={tw`text-gray-700`}>正确答案：{correctAnswer}</Text>
            </View>
          )}
        </View>
      )}

      <FavoriteButton isFavorited={isFavorited} onPress={onToggleFavorite} />
    </View>
  );
}

// ============================================================
// 简答题
// ============================================================
function ShortAnswerQuiz({
  question,
  selectedAnswer,
  showResult,
  isFavorited,
  onAnswer,
  onToggleFavorite,
}: QuizComponentProps) {
  const correctAnswer = (question.answer as string) || "";
  const [localInput, setLocalInput] = useState(() => (selectedAnswer as string) || "");

  const checkKeywords = () => {
    const answer = (selectedAnswer as string) || "";
    if (!answer.trim() || !correctAnswer.trim()) return false;
    const keywords = correctAnswer
      .split(/[,，、\s]+/)
      .filter((k) => k.length >= 2);
    if (keywords.length === 0) return false;
    const matched = keywords.filter((kw) =>
      answer.toLowerCase().includes(kw.toLowerCase())
    );
    return matched.length >= Math.ceil(keywords.length / 2);
  };

  const isCorrect = showResult && checkKeywords();

  return (
    <View>
      <TextInput
        style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 min-h-[100px]`}
        placeholder="请输入你的回答..."
        placeholderTextColor="#9ca3af"
        multiline
        textAlignVertical="top"
        value={showResult ? (selectedAnswer as string) || "" : localInput}
        onChangeText={(text) => {
          setLocalInput(text);
          onAnswer(text);
        }}
        editable={!showResult}
      />

      {showResult && (
        <View style={tw`mt-4`}>
          <View
            style={tw`rounded-xl p-4 border ${
              isCorrect
                ? "bg-green-50 border-green-200"
                : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <View style={tw`flex-row items-center mb-2`}>
              {isCorrect ? (
                <CheckCircle2 size={20} color="#22c55e" />
              ) : (
                <Text style={tw`text-yellow-600 mr-2`}>⚠️</Text>
              )}
              <Text
                style={tw`font-medium ${
                  isCorrect ? "text-green-700" : "text-yellow-700"
                }`}
              >
                {isCorrect ? "关键词匹配通过" : "待人工批改（关键词匹配不完全）"}
              </Text>
            </View>
            <Text style={tw`text-gray-700 mt-2`}>
              <Text style={tw`font-medium`}>参考答案：</Text>
              {correctAnswer}
            </Text>
          </View>
        </View>
      )}

      <FavoriteButton isFavorited={isFavorited} onPress={onToggleFavorite} />
    </View>
  );
}

// ============================================================
// 选项列表组件（单选/多选共用）
// ============================================================
function OptionList({
  options,
  selectedIds,
  correctIds,
  showResult,
  multiSelect,
  onSelect,
}: {
  options: QuestionOption[];
  selectedIds: string[];
  correctIds: string[];
  showResult: boolean;
  multiSelect: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={tw`mt-2`}>
      {options.map((opt) => {
        const isSelected = selectedIds.includes(opt.id);
        const isCorrectOption = correctIds.includes(opt.id);
        const isWrongSelection = showResult && isSelected && !isCorrectOption;

        let containerClass = "border-gray-100 bg-gray-50";
        let badgeClass = "bg-gray-200";
        let badgeTextClass = "text-gray-500";

        if (isSelected && !showResult) {
          containerClass = "border-primary-400 bg-primary-50";
          badgeClass = "bg-primary-600";
          badgeTextClass = "text-white";
        }
        if (showResult && isCorrectOption) {
          containerClass = "border-green-400 bg-green-50";
          badgeClass = "bg-green-500";
          badgeTextClass = "text-white";
        }
        if (isWrongSelection) {
          containerClass = "border-red-400 bg-red-50";
          badgeClass = "bg-red-500";
          badgeTextClass = "text-white";
        }

        return (
          <TouchableOpacity
            key={opt.id}
            style={tw`flex-row items-center p-4 rounded-xl mb-2.5 border ${containerClass}`}
            onPress={() => onSelect(opt.id)}
            disabled={showResult}
          >
            <View
              style={tw`w-8 h-8 rounded-full items-center justify-center mr-3 ${badgeClass}`}
            >
              <Text style={tw`text-sm font-bold ${badgeTextClass}`}>
                {opt.id}
              </Text>
            </View>
            <Text style={tw`flex-1 text-gray-800 text-[15px] leading-5`}>
              {opt.content}
            </Text>
            {showResult && isCorrectOption && (
              <CheckCircle2 size={20} color="#22c55e" />
            )}
            {isWrongSelection && <XCircle size={20} color="#ef4444" />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ============================================================
// 收藏按钮
// ============================================================
function FavoriteButton({
  isFavorited,
  onPress,
}: {
  isFavorited: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={tw`flex-row items-center justify-center mt-4 py-2`}
      onPress={onPress}
    >
      <Star
        size={20}
        color={isFavorited ? "#f59e0b" : "#d1d5db"}
        fill={isFavorited ? "#f59e0b" : "none"}
      />
      <Text
        style={tw`ml-2 text-sm ${
          isFavorited ? "text-yellow-600" : "text-gray-400"
        }`}
      >
        {isFavorited ? "已收藏" : "收藏"}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================
// 主导出组件
// ============================================================
export default function QuizComponent({
  question,
  selectedAnswer,
  showResult,
  isFavorited,
  onAnswer,
  onToggleFavorite,
}: QuizComponentProps) {
  switch (question.type) {
    case QuestionType.SINGLE_CHOICE:
      return (
        <SingleChoiceQuiz
          question={question}
          selectedAnswer={selectedAnswer}
          showResult={showResult}
          isFavorited={isFavorited}
          onAnswer={onAnswer}
          onToggleFavorite={onToggleFavorite}
        />
      );
    case QuestionType.MULTI_CHOICE:
      return (
        <MultiChoiceQuiz
          question={question}
          selectedAnswer={selectedAnswer}
          showResult={showResult}
          isFavorited={isFavorited}
          onAnswer={onAnswer}
          onToggleFavorite={onToggleFavorite}
        />
      );
    case QuestionType.TRUE_FALSE:
      return (
        <TrueFalseQuiz
          question={question}
          selectedAnswer={selectedAnswer}
          showResult={showResult}
          isFavorited={isFavorited}
          onAnswer={onAnswer}
          onToggleFavorite={onToggleFavorite}
        />
      );
    case QuestionType.FILL_BLANK:
      return (
        <FillBlankQuiz
          question={question}
          selectedAnswer={selectedAnswer}
          showResult={showResult}
          isFavorited={isFavorited}
          onAnswer={onAnswer}
          onToggleFavorite={onToggleFavorite}
        />
      );
    case QuestionType.SHORT_ANSWER:
      return (
        <ShortAnswerQuiz
          question={question}
          selectedAnswer={selectedAnswer}
          showResult={showResult}
          isFavorited={isFavorited}
          onAnswer={onAnswer}
          onToggleFavorite={onToggleFavorite}
        />
      );
    default:
      return (
        <View style={tw`p-4`}>
          <Text style={tw`text-gray-400`}>未知题型</Text>
        </View>
      );
  }
}
