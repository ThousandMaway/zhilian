import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import {
  User,
  BookMarked,
  RotateCcw,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import { useAuthStore } from "~/stores/auth";
import tw from "~/lib/tw";

export default function ProfileScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const menuItems = [
    {
      icon: <RotateCcw size={20} color="#ef4444" />,
      label: "错题记录",
      desc: "查看和重练错题",
      screen: "WrongQuestions",
      bg: "bg-red-100",
    },
    {
      icon: <BookMarked size={20} color="#f59e0b" />,
      label: "我的收藏",
      desc: "已收藏的题目",
      screen: "Favorites",
      bg: "bg-yellow-100",
    },
    {
      icon: <CalendarDays size={20} color="#22c55e" />,
      label: "打卡记录",
      desc: "每日打卡日历",
      screen: "CheckinHistory",
      bg: "bg-green-100",
    },
    {
      icon: <BarChart3 size={20} color="#8b5cf6" />,
      label: "学习统计",
      desc: "正确率与趋势分析",
      screen: "Statistics",
      bg: "bg-purple-100",
    },
    {
      icon: <Settings size={20} color="#6b7280" />,
      label: "设置",
      desc: "账号与偏好设置",
      screen: "Settings",
      bg: "bg-gray-100",
    },
  ];

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`}>
      {/* 用户信息 */}
      <View style={tw`bg-white pt-14 pb-6 px-4 border-b border-gray-100`}>
        <View style={tw`flex-row items-center`}>
          <View style={tw`w-16 h-16 bg-primary-100 rounded-full items-center justify-center`}>
            <User size={28} color="#3b82f6" />
          </View>
          <View style={tw`ml-4 flex-1`}>
            <Text style={tw`text-gray-800 text-lg font-bold`}>
              {user?.email?.split("@")[0] || "同学"}
            </Text>
            <Text style={tw`text-gray-400 text-sm mt-0.5`}>
              {user?.email || ""}
            </Text>
          </View>
          <ChevronRight size={20} color="#d1d5db" />
        </View>
      </View>

      {/* 菜单 */}
      <View style={tw`mx-4 mt-4 bg-white rounded-2xl border border-gray-100 overflow-hidden`}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.screen}
            style={tw`flex-row items-center px-4 py-4 ${idx < menuItems.length - 1 ? "border-b border-gray-50" : ""}`}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View
              style={tw`${item.bg} w-10 h-10 rounded-full items-center justify-center mr-3`}
            >
              {item.icon}
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-gray-800 font-medium`}>{item.label}</Text>
              <Text style={tw`text-gray-400 text-xs mt-0.5`}>{item.desc}</Text>
            </View>
            <ChevronRight size={18} color="#d1d5db" />
          </TouchableOpacity>
        ))}
      </View>

      {/* 退出登录 */}
      <TouchableOpacity
        style={tw`mx-4 mt-6 mb-8 bg-white rounded-2xl border border-gray-100 py-4 items-center`}
        onPress={signOut}
      >
        <View style={tw`flex-row items-center`}>
          <LogOut size={18} color="#ef4444" />
          <Text style={tw`text-red-500 ml-2 font-medium`}>退出登录</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}
