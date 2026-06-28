import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Flag,
  X,
} from "lucide-react-native";
import { usePracticeStore } from "~/stores/practice";
import {
  useBulkCreatePracticeRecords,
  useAddWrongQuestions,
  useUpsertCheckin,
  useFavoritedIds,
  useToggleFavorite,
  useAiEvaluate,
} from "~/queries/practice";
import { useQueryClient } from "@tanstack/react-query";
import QuizComponent from "~/components/QuizComponent";
import type { Question } from "~/types";
import { QuestionType, PracticeMode } from "~/types";
import { formatTime, checkShortAnswer } from "~/lib/utils";
import tw from "~/lib/tw";

export default function PracticeQuizScreen({ navigation }: any) {
  const store = usePracticeStore();
  const {
    questions,
    currentIndex,
    answers,
    startTime,
    mode,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    finishPractice,
    reset,
  } = store;

  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answeredInFreeMode, setAnsweredInFreeMode] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const startTimeRef = useRef<number>(startTime || Date.now());

  const bulkCreateRecords = useBulkCreatePracticeRecords();
  const addWrongQuestions = useAddWrongQuestions();
  const upsertCheckin = useUpsertCheckin();
  const aiEvaluate = useAiEvaluate();

  const currentQuestion = questions[currentIndex] as Question | undefined;
  const totalQuestions = questions.length;
  const currentAnswer = currentQuestion
    ? answers.get(currentQuestion.id) ?? null
    : null;

  // 计时器
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (startTimeRef.current === null) return;
    const timer = setInterval(() => {
      setElapsed(
        Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000)
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 收藏状态：一次性批量查出所有题目是否已收藏
  const queryClient = useQueryClient();
  const questionIds = questions.map((q) => q.id);
  const { data: favoritedIds = new Set<string>() } = useFavoritedIds(questionIds);
  const toggleFavorite = useToggleFavorite();

  const isFavorited = currentQuestion ? favoritedIds.has(currentQuestion.id) : false;

  const handleToggleFavorite = async () => {
    if (!currentQuestion) return;
    await toggleFavorite.mutateAsync({
      questionId: currentQuestion.id,
      isFavorited,
    });
    // 乐观更新本地缓存，无需重新请求
    queryClient.setQueryData<Set<string>>(
      ["favorites", "ids", questionIds],
      (prev) => {
        const next = new Set(prev);
        if (isFavorited) {
          next.delete(currentQuestion.id);
        } else {
          next.add(currentQuestion.id);
        }
        return next;
      }
    );
  };

  // 判断答案是否正确
  const checkAnswer = useCallback(
    (question: Question, userAnswer: string | string[] | null): boolean => {
      if (userAnswer === null || userAnswer === undefined) return false;

      switch (question.type) {
        case QuestionType.SINGLE_CHOICE:
          return userAnswer === question.answer;
        case QuestionType.MULTI_CHOICE: {
          const correct = question.answer as string[];
          const user = userAnswer as string[];
          if (!Array.isArray(correct) || !Array.isArray(user)) return false;
          return (
            correct.length === user.length &&
            correct.every((c) => user.includes(c))
          );
        }
        case QuestionType.TRUE_FALSE:
          return userAnswer === question.answer;
        case QuestionType.FILL_BLANK:
          return (
            String(userAnswer).trim().toLowerCase() ===
            String(question.answer).trim().toLowerCase()
          );
        case QuestionType.SHORT_ANSWER:
          return checkShortAnswer(String(userAnswer), String(question.answer));
        default:
          return false;
      }
    },
    []
  );

  // 自由练习模式：作答后即时显示结果（仅单选/判断）
  const handleAnswer = (answer: string | string[]) => {
    if (!currentQuestion) return;
    answerQuestion(currentQuestion.id, answer);
    const instantTypes = [QuestionType.SINGLE_CHOICE, QuestionType.TRUE_FALSE];
    if (mode === PracticeMode.FREE && instantTypes.includes(currentQuestion.type as QuestionType)) {
      setShowResult(true);
      setAnsweredInFreeMode(true);
    }
  };

  // 自由练习：切换下一题时重置结果
  const handleNextInFreeMode = () => {
    if (currentIndex < totalQuestions - 1) {
      setShowResult(false);
      setAnsweredInFreeMode(false);
      setAiResult(null);
      nextQuestion();
    }
  };

  // 普通切换：也重置结果
  const handleNext = () => {
    setShowResult(false);
    setAiResult(null);
    nextQuestion();
  };

  // 手动确认答案（多选/填空/简答）
  const handleConfirmAnswer = async () => {
    setShowResult(true);
    if (mode === PracticeMode.FREE) {
      setAnsweredInFreeMode(true);
    }
    // 简答题：触发 AI 判题（失败自动降级关键词）
    if (currentQuestion?.type === QuestionType.SHORT_ANSWER) {
      const result = await aiEvaluate.mutateAsync({
        question: currentQuestion.stem,
        userAnswer: (currentAnswer as string) || "",
        referenceAnswer: currentQuestion.answer as string,
      });
      setAiResult(result);
    } else {
      setAiResult(null);
    }
  };

  // 非自由模式：所有题型都需要确认后才显示答案
  // 自由模式：单选/判断即时显示，多选/填空/简答需确认
  const needsConfirmation = currentQuestion && !showResult && (
    mode !== PracticeMode.FREE ||
    [QuestionType.MULTI_CHOICE, QuestionType.FILL_BLANK, QuestionType.SHORT_ANSWER].includes(
      currentQuestion.type as QuestionType
    )
  );

  // 提交所有答案
  const handleSubmit = () => {
    const unanswered = questions.filter((q) => !answers.has(q.id));
    if (unanswered.length > 0) {
      Alert.alert(
        "确认提交",
        `还有 ${unanswered.length} 题未作答，确定提交吗？`,
        [
          { text: "继续作答", style: "cancel" },
          { text: "确定提交", onPress: submitAnswers },
        ]
      );
    } else {
      submitAnswers();
    }
  };

  const submitAnswers = async () => {
    setIsSubmitting(true);
    try {
      const timeSpent = Math.floor(
        (Date.now() - (startTimeRef.current || Date.now())) / 1000
      );
      const records: any[] = [];
      let correctCount = 0;
      const wrongIds: string[] = [];

      for (const q of questions) {
        const userAnswer = answers.get(q.id) ?? null;
        const isCorrect = checkAnswer(q, userAnswer);

        if (isCorrect) correctCount++;
        else wrongIds.push(q.id);

        records.push({
          question_id: q.id,
          paper_id: null,
          user_answer: userAnswer,
          is_correct: isCorrect,
          time_spent: Math.floor(timeSpent / questions.length),
        });
      }

      // 批量保存答题记录
      await bulkCreateRecords.mutateAsync(records);

      // 批量记录错题（并行，一次搞定）
      if (wrongIds.length > 0) {
        try {
          await addWrongQuestions.mutateAsync({ questionIds: wrongIds });
        } catch {
          // 静默处理
        }
      }

      // 更新打卡
      await upsertCheckin.mutateAsync(questions.length);

      finishPractice();

      // 跳转结果页
      navigation.replace("PracticeResult", {
        total: questions.length,
        correct: correctCount,
        timeSpent,
        mode,
      });
    } catch (err: any) {
      Alert.alert("提交失败", err.message || "请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-white`}>
        <Text style={tw`text-gray-400`}>没有题目</Text>
      </View>
    );
  }

  const answeredCount = answers.size;
  const progressPercent =
    totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  return (
    <View style={tw`flex-1 bg-white`}>
      {/* 顶部进度条 + 计时器 */}
      <View style={tw`pt-0 pb-2 bg-white border-b border-gray-100`}>
        {/* 进度条 */}
        <View style={tw`bg-gray-100 h-1.5 mb-3 mx-4 rounded-full overflow-hidden`}>
          <View
            style={[tw`bg-primary-500 h-1.5 rounded-full`, { width: `${progressPercent}%` }]}
          />
        </View>

        <View style={tw`flex-row items-center justify-between px-4`}>
          <View style={tw`flex-row items-center`}>
            <Text style={tw`text-gray-800 font-bold text-lg`}>
              {currentIndex + 1}
            </Text>
            <Text style={tw`text-gray-400`}> / {totalQuestions}</Text>
          </View>

          <View style={tw`flex-row items-center`}>
            <Clock size={16} color="#9ca3af" />
            <Text style={tw`text-gray-500 ml-1 text-sm`}>
              {formatTime(elapsed)}
            </Text>
          </View>

          <View style={tw`flex-row items-center`}>
            <CheckCircle2 size={16} color="#22c55e" />
            <Text style={tw`text-green-600 ml-1 text-sm`}>{answeredCount}</Text>
            <Text style={tw`text-gray-300 mx-1`}>|</Text>
            <XCircle size={16} color="#d1d5db" />
            <Text style={tw`text-gray-400 text-sm`}>
              {totalQuestions - answeredCount}
            </Text>
          </View>
        </View>
      </View>

      {/* 题目区域 */}
      <ScrollView style={tw`flex-1`} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={tw`px-4 pt-4 pb-2`}>
          {/* 题型标签 */}
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <View style={tw`flex-row items-center`}>
              <View style={tw`bg-primary-100 rounded-lg px-3 py-1`}>
                <Text style={tw`text-primary-600 text-xs font-medium`}>
                  {currentQuestion.type === QuestionType.SINGLE_CHOICE
                    ? "单选题"
                    : currentQuestion.type === QuestionType.MULTI_CHOICE
                    ? "多选题"
                    : currentQuestion.type === QuestionType.TRUE_FALSE
                    ? "判断题"
                    : currentQuestion.type === QuestionType.FILL_BLANK
                    ? "填空题"
                    : "简答题"}
                </Text>
              </View>
              {currentQuestion.difficulty > 1 && (
                <Text style={tw`text-gray-400 text-xs ml-2`}>
                  {"⭐".repeat(currentQuestion.difficulty)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={tw`flex-row items-center bg-gray-100 rounded-full px-3 py-1.5`}
              onPress={() => {
                Alert.alert("退出答题", "确定要退出吗？已答题目不会保存。", [
                  { text: "继续答题", style: "cancel" },
                  { text: "退出", style: "destructive", onPress: () => { reset(); navigation.goBack(); } },
                ]);
              }}
            >
              <X size={14} color="#9ca3af" />
              <Text style={tw`text-gray-500 text-xs ml-1`}>退出</Text>
            </TouchableOpacity>
          </View>

          {/* 题干 */}
          <Text style={tw`text-lg font-semibold text-gray-900 leading-7 mb-4`}>
            {currentQuestion.stem}
          </Text>

          {/* 答题组件 */}
          <QuizComponent
            key={currentQuestion.id}
            question={currentQuestion}
            selectedAnswer={currentAnswer}
            showResult={showResult}
            isFavorited={isFavorited}
            onAnswer={handleAnswer}
            onToggleFavorite={handleToggleFavorite}
            aiResult={aiResult}
          />
        </View>
      </ScrollView>

      {/* 底部导航 */}
      <View style={tw`border-t border-gray-100 px-4 py-3 bg-white`}>
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity
            style={tw`flex-row items-center py-2 px-3 rounded-xl ${currentIndex > 0 ? "" : "opacity-0"}`}
            onPress={() => {
              if (mode === PracticeMode.FREE) {
                setShowResult(false);
                setAnsweredInFreeMode(false);
              }
              setAiResult(null);
              prevQuestion();
            }}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={20} color="#3b82f6" />
            <Text style={tw`text-primary-600 ml-1 font-medium`}>上一题</Text>
          </TouchableOpacity>

          <View style={tw`flex-1`} />

          {/* 确认按钮（多选/填空/简答）- 中间 */}
          {needsConfirmation ? (
            <TouchableOpacity
              style={tw`rounded-xl py-2.5 px-6 bg-primary-600`}
              onPress={handleConfirmAnswer}
            >
              <Text style={tw`text-white font-semibold`}>确认答案</Text>
            </TouchableOpacity>
          ) : null}

          <View style={tw`flex-1 items-end`} />

          {/* 右侧按钮：提交 / 下一题 / 跳过 / 返回（单题） */}
          {currentIndex === totalQuestions - 1 ? (
            totalQuestions === 1 ? (
              <TouchableOpacity
                style={tw`rounded-xl py-3 px-8 bg-green-400`}
                onPress={() => navigation.goBack()}
              >
                <Text style={tw`text-white font-semibold`}>结束</Text>
              </TouchableOpacity>
            ) : (
            <TouchableOpacity
              style={tw`rounded-xl py-3 px-8 ${isSubmitting ? "bg-primary-400" : "bg-green-600"}`}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <View style={tw`flex-row items-center`}>
                  <Flag size={18} color="white" />
                  <Text style={tw`text-white font-semibold ml-1.5 text-base`}>
                    提交
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity
              style={tw`flex-row items-center py-2 px-3 rounded-xl`}
              onPress={
                mode === PracticeMode.FREE && answeredInFreeMode
                  ? handleNextInFreeMode
                  : handleNext
              }
            >
              <Text style={tw`text-primary-600 mr-1 font-medium`}>
                {mode === PracticeMode.FREE && !answeredInFreeMode
                  ? "跳过"
                  : "下一题"}
              </Text>
              <ChevronRight size={20} color="#3b82f6" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
