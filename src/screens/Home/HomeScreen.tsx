import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useAuthStore } from "~/stores/auth";
import {
  BookOpen,
  Target,
  CheckCircle2,
  TrendingUp,
  Flame,
} from "lucide-react-native";
import tw from "~/lib/tw";
import { usePracticeRecords, useTodayCheckin, useDailyCheckins } from "~/queries/practice";
import { DAILY_CHECKIN_GOAL } from "~/constants";

export default function HomeScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);

  // 总做题数 + 正确率
  const { data: records = [] } = usePracticeRecords({ limit: 500 });
  // 今日打卡
  const { data: todayCheckin } = useTodayCheckin();
  // 打卡历史（计算连续天数）
  const { data: checkins = [] } = useDailyCheckins(365);

  const stats = useMemo(() => {
    const totalQuestions = records.length;
    const correctCount = records.filter((r: any) => r.is_correct).length;
    const correctRate = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const todayCount = todayCheckin?.question_count || 0;

    // 计算连续打卡天数（从昨天开始，除非今天已打卡）
    const dates = new Set(checkins.map((c: any) => c.date));
    let streak = 0;
    const today = new Date();
    const todayKey = today.toISOString().split("T")[0];
    const hasToday = dates.has(todayKey);
    const start = new Date(today);
    if (!hasToday) start.setDate(start.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (dates.has(key)) streak++;
      else break;
    }

    return {
      todayCount,
      goalCount: DAILY_CHECKIN_GOAL,
      streak,
      totalQuestions,
      correctRate,
    };
  }, [records, todayCheckin, checkins]);

  const progressPercent = Math.min(
    (stats.todayCount / stats.goalCount) * 100,
    100
  );

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`}>
      {/* 顶部问候 */}
      <View style={tw`bg-primary-600 px-6 pt-14 pb-8 rounded-b-3xl`}>
        <Text style={tw`text-white/80 text-sm`}>早上好 👋</Text>
        <Text style={tw`text-white text-xl font-bold mt-1`}>
          {user?.email?.split("@")[0] || "同学"}
        </Text>
        <Text style={tw`text-white/70 text-sm mt-1`}>
          今天的努力，明天的收获
        </Text>
      </View>

      {/* 今日进度卡片 */}
      <View style={tw`mx-4 -mt-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100`}>
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <Text style={tw`text-gray-800 font-semibold text-base`}>
            今日进度
          </Text>
          <View style={tw`flex-row items-center`}>
            <Flame size={16} color="#f59e0b" />
            <Text style={tw`text-warning text-sm ml-1 font-medium`}>
              连续 {stats.streak} 天
            </Text>
          </View>
        </View>

        {/* 进度条 */}
        <View style={tw`bg-gray-100 rounded-full h-3 mb-2 overflow-hidden`}>
          <View
            style={[tw`bg-primary-500 h-3 rounded-full`, { width: `${progressPercent}%` }]}
          />
        </View>
        <Text style={tw`text-gray-400 text-xs`}>
          {stats.todayCount}/{stats.goalCount} 题
          {stats.todayCount < stats.goalCount
            ? ` · 还差 ${stats.goalCount - stats.todayCount} 题达标`
            : " · 今日已达标！"}
        </Text>
      </View>

      {/* 统计卡片 */}
      <View style={tw`flex-row mx-4 mt-4 gap-3`}>
        <View style={tw`flex-1 bg-white rounded-xl p-4 border border-gray-100`}>
          <BookOpen size={22} color="#3b82f6" />
          <Text style={tw`text-2xl font-bold text-gray-800 mt-2`}>
            {stats.totalQuestions}
          </Text>
          <Text style={tw`text-gray-400 text-xs mt-0.5`}>总做题数</Text>
        </View>
        <View style={tw`flex-1 bg-white rounded-xl p-4 border border-gray-100`}>
          <Target size={22} color="#22c55e" />
          <Text style={tw`text-2xl font-bold text-gray-800 mt-2`}>
            {stats.correctRate}%
          </Text>
          <Text style={tw`text-gray-400 text-xs mt-0.5`}>正确率</Text>
        </View>
        <View style={tw`flex-1 bg-white rounded-xl p-4 border border-gray-100`}>
          <TrendingUp size={22} color="#8b5cf6" />
          <Text style={tw`text-2xl font-bold text-gray-800 mt-2`}>
            {stats.streak}
          </Text>
          <Text style={tw`text-gray-400 text-xs mt-0.5`}>连续打卡</Text>
        </View>
      </View>

      {/* 快捷入口 */}
      <Text style={tw`mx-4 mt-6 mb-3 text-gray-800 font-semibold text-base`}>
        快捷练习
      </Text>
      <View style={tw`flex-row mx-4 gap-3 mb-6`}>
        <TouchableOpacity
          style={tw`flex-1 bg-white rounded-xl p-4 border border-gray-100 items-center`}
          onPress={() =>
            navigation.navigate("PracticeTab", { screen: "PracticeConfig" })
          }
        >
          <View style={tw`bg-primary-100 w-12 h-12 rounded-full items-center justify-center mb-2`}>
            <Target size={24} color="#3b82f6" />
          </View>
          <Text style={tw`text-gray-700 font-medium text-sm`}>自由练习</Text>
          <Text style={tw`text-gray-400 text-xs mt-0.5`}>随机抽题</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`flex-1 bg-white rounded-xl p-4 border border-gray-100 items-center`}
          onPress={() =>
            navigation.navigate("ProfileTab", { screen: "WrongQuestions" })
          }
        >
          <View style={tw`bg-red-100 w-12 h-12 rounded-full items-center justify-center mb-2`}>
            <CheckCircle2 size={24} color="#ef4444" />
          </View>
          <Text style={tw`text-gray-700 font-medium text-sm`}>错题重练</Text>
          <Text style={tw`text-gray-400 text-xs mt-0.5`}>巩固薄弱</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`flex-1 bg-white rounded-xl p-4 border border-gray-100 items-center`}
          onPress={() =>
            navigation.navigate("ProfileTab", { screen: "Favorites" })
          }
        >
          <View style={tw`bg-yellow-100 w-12 h-12 rounded-full items-center justify-center mb-2`}>
            <Flame size={24} color="#f59e0b" />
          </View>
          <Text style={tw`text-gray-700 font-medium text-sm`}>收藏练习</Text>
          <Text style={tw`text-gray-400 text-xs mt-0.5`}>重点回顾</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
