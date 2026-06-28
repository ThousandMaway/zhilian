import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MainTabParamList } from "./types";
import HomeNavigator from "./HomeNavigator";
import QuestionsNavigator from "./QuestionsNavigator";
import PracticeNavigator from "./PracticeNavigator";
import ProfileNavigator from "./ProfileNavigator";
import { Home, BookOpen, Play, User } from "lucide-react-native";

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          borderTopColor: "#f3f4f6",
          paddingBottom: insets.bottom || 4,
          height: 56 + (insets.bottom || 0),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          tabBarLabel: "首页",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) navigation.popToTop();
          },
        })}
      />
      <Tab.Screen
        name="QuestionsTab"
        component={QuestionsNavigator}
        options={{
          tabBarLabel: "题库",
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) navigation.popToTop();
          },
        })}
      />
      <Tab.Screen
        name="PracticeTab"
        component={PracticeNavigator}
        options={{
          tabBarLabel: "答题",
          tabBarIcon: ({ color, size }) => <Play size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) navigation.popToTop();
          },
        })}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          tabBarLabel: "我的",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) navigation.popToTop();
          },
        })}
      />
    </Tab.Navigator>
  );
}
