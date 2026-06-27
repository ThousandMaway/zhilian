import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "./types";
import ProfileScreen from "~/screens/Profile/ProfileScreen";
import WrongQuestionsScreen from "~/screens/Profile/WrongQuestionsScreen";
import FavoritesScreen from "~/screens/Profile/FavoritesScreen";
import CheckinHistoryScreen from "~/screens/Profile/CheckinHistoryScreen";
import StatisticsScreen from "~/screens/Profile/StatisticsScreen";
import SettingsScreen from "~/screens/Profile/SettingsScreen";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WrongQuestions"
        component={WrongQuestionsScreen}
        options={{ title: "错题记录" }}
      />
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: "我的收藏" }}
      />
      <Stack.Screen
        name="CheckinHistory"
        component={CheckinHistoryScreen}
        options={{ title: "打卡记录" }}
      />
      <Stack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ title: "学习统计" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "设置" }}
      />
    </Stack.Navigator>
  );
}
