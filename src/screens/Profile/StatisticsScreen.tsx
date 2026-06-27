import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  Target,
  TrendingUp,
  Award,
  AlertTriangle,
} from "lucide-react-native";
import { usePracticeRecords } from "~/queries/practice";
import { QuestionType, QuestionTypeLabel } from "~/types";
import tw from "~/lib/tw";

export default function StatisticsScreen() {
  const { data: records = [], isLoading } = usePracticeRecords({ limit: 200 });

  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        total: 0,
        correct: 0,
        accuracy: 0,
        totalTime: 0,
        byType: {} as Record<string, { total: number; correct: number }>,
        weakTypes: [] as { type: string; label: string; accuracy: number }[],
      };
    }

    const total = records.length;
    const correct = records.filter((r: any) => r.is_correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const totalTime = records.reduce(
      (sum: number, r: any) => sum + (r.time_spent || 0),
      0
    );

    // 按题型统计
    const byType: Record<string, { total: number; correct: number }> = {};
    for (const r of records) {
      const type = (r as any).questions?.type || "unknown";
      if (!byType[type]) byType[type] = { total: 0, correct: 0 };
      byType[type].total++;
      if ((r as any).is_correct) byType[type].correct++;
    }

    // 薄弱知识点（正确率最低的题型）
    const weakTypes = Object.entries(byType)
      .filter(([, data]) => data.total >= 3)
      .map(([type, data]) => ({
        type,
        label: QuestionTypeLabel[type as QuestionType] || type,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    return { total, correct, accuracy, totalTime, byType, weakTypes };
  }, [records]);

  if (isLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-white`}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (stats.total === 0) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-white px-8`}>
        <Text style={tw`text-6xl mb-4`}>📊</Text>
        <Text style={tw`text-gray-500 text-base text-center`}>
          还没有答题记录
        </Text>
        <Text style={tw`text-gray-300 text-sm mt-1 text-center`}>
          开始练习后，这里会展示你的学习统计
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`}>
      {/* 概览卡片 */}
      <View style={tw`px-4 pt-4`}>
        <View style={tw`flex-row gap-3`}>
          <View style={tw`flex-1 bg-white rounded-2xl p-4 border border-gray-100 items-center`}>
            <Target size={22} color="#3b82f6" />
            <Text style={tw`text-2xl font-bold text-gray-800 mt-2`}>
              {stats.total}
            </Text>
            <Text style={tw`text-gray-400 text-xs`}>总答题数</Text>
          </View>
          <View style={tw`flex-1 bg-white rounded-2xl p-4 border border-gray-100 items-center`}>
            <TrendingUp size={22} color="#22c55e" />
            <Text style={tw`text-2xl font-bold text-green-600 mt-2`}>
              {stats.accuracy}%
            </Text>
            <Text style={tw`text-gray-400 text-xs`}>正确率</Text>
          </View>
          <View style={tw`flex-1 bg-white rounded-2xl p-4 border border-gray-100 items-center`}>
            <Award size={22} color="#f59e0b" />
            <Text style={tw`text-2xl font-bold text-gray-800 mt-2`}>
              {stats.correct}
            </Text>
            <Text style={tw`text-gray-400 text-xs`}>正确数</Text>
          </View>
        </View>
      </View>

      {/* 题型正确率 */}
      <View style={tw`mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-100`}>
        <Text style={tw`text-gray-800 font-semibold mb-4`}>
          各题型正确率
        </Text>
        {Object.entries(stats.byType).map(([type, data]) => {
          const acc = data.total > 0
            ? Math.round((data.correct / data.total) * 100)
            : 0;
          const label = QuestionTypeLabel[type as QuestionType] || type;
          const colors: Record<string, string> = {
            single_choice: "bg-blue-500",
            multi_choice: "bg-purple-500",
            true_false: "bg-green-500",
            fill_blank: "bg-orange-500",
            short_answer: "bg-pink-500",
          };
          const barColor = colors[type] || "bg-gray-500";

          return (
            <View key={type} style={tw`mb-3`}>
              <View style={tw`flex-row justify-between mb-1`}>
                <Text style={tw`text-gray-600 text-sm`}>{label}</Text>
                <Text style={tw`text-gray-500 text-sm`}>
                  {data.correct}/{data.total} ({acc}%)
                </Text>
              </View>
              <View style={tw`bg-gray-100 rounded-full h-2.5 overflow-hidden`}>
                <View
                  style={[tw`${barColor} h-2.5 rounded-full`, { width: `${Math.max(acc, 4)}%` }]}
                />
              </View>
            </View>
          );
        })}
        {Object.keys(stats.byType).length === 0 && (
          <Text style={tw`text-gray-400 text-sm`}>暂无数据</Text>
        )}
      </View>

      {/* 薄弱知识点 */}
      {stats.weakTypes.length > 0 && (
        <View style={tw`mx-4 mt-4 mb-8 bg-white rounded-2xl p-4 border border-gray-100`}>
          <View style={tw`flex-row items-center mb-4`}>
            <AlertTriangle size={18} color="#f59e0b" />
            <Text style={tw`text-gray-800 font-semibold ml-2`}>
              需要加强的题型
            </Text>
          </View>
          {stats.weakTypes.map((wt, idx) => (
            <View
              key={wt.type}
              style={tw`flex-row items-center justify-between py-2.5 border-b border-gray-50 last:border-b-0`}
            >
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-6 h-6 rounded-full bg-red-100 items-center justify-center mr-2`}>
                  <Text style={tw`text-red-500 text-xs font-bold`}>
                    {idx + 1}
                  </Text>
                </View>
                <Text style={tw`text-gray-700`}>{wt.label}</Text>
              </View>
              <Text
                style={tw`font-bold ${
                  wt.accuracy < 50
                    ? "text-red-500"
                    : wt.accuracy < 70
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {wt.accuracy}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
