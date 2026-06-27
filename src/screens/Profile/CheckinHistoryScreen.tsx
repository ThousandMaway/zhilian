import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Flame, Target } from "lucide-react-native";
import { useDailyCheckins } from "~/queries/practice";
import { DAILY_CHECKIN_GOAL } from "~/constants";
import tw from "~/lib/tw";

export default function CheckinHistoryScreen() {
  const { data: checkins = [], isLoading } = useDailyCheckins(365);

  // 计算连续打卡天数
  const streak = useMemo(() => {
    const dates = new Set(checkins.map((c) => c.date));
    let count = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (dates.has(key)) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [checkins]);

  // 计算本月打卡天数
  const monthCheckins = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return checkins.filter((c) => {
      const d = new Date(c.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
  }, [checkins]);

  // 计算总打卡天数
  const totalCheckinDays = checkins.length;

  // 生成日历网格（最近 84 天 = 12 周）
  const calendarData = useMemo(() => {
    const dates = new Set(checkins.map((c) => c.date));
    const weeks: { date: string; checked: boolean; isToday: boolean }[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 从 12 周前开始
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 83); // 84 days total
    // 对齐到周一
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    let currentWeek: { date: string; checked: boolean; isToday: boolean }[] = [];

    for (let i = 0; i < 91; i++) {
      // 确保覆盖完整
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      const isToday =
        d.toDateString() === today.toDateString();

      if (d.getDay() === 1 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentWeek.push({
        date: key,
        checked: dates.has(key),
        isToday,
      });
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return weeks;
  }, [checkins]);

  if (isLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-white`}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      {/* 统计卡片 */}
      <View style={tw`px-4 pt-4`}>
        <View style={tw`flex-row gap-3`}>
          <View style={tw`flex-1 bg-orange-50 rounded-2xl p-4 border border-orange-100 items-center`}>
            <Flame size={24} color="#f59e0b" />
            <Text style={tw`text-3xl font-bold text-orange-600 mt-2`}>
              {streak}
            </Text>
            <Text style={tw`text-orange-400 text-xs mt-0.5`}>连续打卡</Text>
          </View>
          <View style={tw`flex-1 bg-green-50 rounded-2xl p-4 border border-green-100 items-center`}>
            <Target size={24} color="#22c55e" />
            <Text style={tw`text-3xl font-bold text-green-600 mt-2`}>
              {monthCheckins}
            </Text>
            <Text style={tw`text-green-400 text-xs mt-0.5`}>本月打卡</Text>
          </View>
          <View style={tw`flex-1 bg-blue-50 rounded-2xl p-4 border border-blue-100 items-center`}>
            <Text style={tw`text-2xl mt-1`}>📅</Text>
            <Text style={tw`text-3xl font-bold text-blue-600 mt-2`}>
              {totalCheckinDays}
            </Text>
            <Text style={tw`text-blue-400 text-xs mt-0.5`}>总打卡</Text>
          </View>
        </View>
      </View>

      {/* 日历热力图 */}
      <View style={tw`mx-4 mt-6 bg-gray-50 rounded-2xl p-4 border border-gray-100`}>
        <Text style={tw`text-gray-800 font-semibold mb-4`}>打卡日历</Text>

        {/* 周标签 */}
        <View style={tw`flex-row mb-1 ml-6`}>
          {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
            <View key={day} style={tw`flex-1 items-center`}>
              <Text style={tw`text-gray-400 text-[10px]`}>{day}</Text>
            </View>
          ))}
        </View>

        {/* 日历格子 */}
        {calendarData.map((week, wi) => (
          <View key={wi} style={tw`flex-row mb-1.5`}>
            {week.map((day, di) => (
              <View key={di} style={tw`flex-1 items-center`}>
                <View
                  style={tw`w-6 h-6 rounded m-0.5 ${
                    day.checked
                      ? "bg-primary-500"
                      : day.isToday
                      ? "bg-primary-100 border border-primary-300"
                      : "bg-gray-200"
                  }`}
                />
              </View>
            ))}
          </View>
        ))}

        {/* 图例 */}
        <View style={tw`flex-row items-center justify-center mt-3`}>
          <View style={tw`w-3 h-3 rounded bg-gray-200 mr-1`} />
          <Text style={tw`text-gray-400 text-[10px] mr-3`}>未打卡</Text>
          <View style={tw`w-3 h-3 rounded bg-primary-500 mr-1`} />
          <Text style={tw`text-gray-400 text-[10px]`}>已打卡</Text>
        </View>
      </View>

      {/* 每日目标 */}
      <View style={tw`mx-4 mt-4 mb-8 bg-blue-50 rounded-2xl p-4 border border-blue-100`}>
        <Text style={tw`text-blue-700 font-medium`}>
          💡 每日目标：完成 {DAILY_CHECKIN_GOAL} 道题即自动打卡
        </Text>
        <Text style={tw`text-blue-500 text-sm mt-1`}>
          坚持每天练习，进步看得见！
        </Text>
      </View>
    </ScrollView>
  );
}
