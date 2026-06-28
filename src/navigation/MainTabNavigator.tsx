import React, { useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StackActions } from "@react-navigation/native";
import type { MainTabParamList } from "./types";
import HomeNavigator from "./HomeNavigator";
import QuestionsNavigator from "./QuestionsNavigator";
import PracticeNavigator from "./PracticeNavigator";
import ProfileNavigator from "./ProfileNavigator";
import { Home, BookOpen, Play, User } from "lucide-react-native";

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const tabNavRef = useRef<any>(null);

  const handleTabPress = (routeName: string) => {
    if (tabNavRef.current) {
      const state = tabNavRef.current.getState();
      const currentRoute = state.routes[state.index];
      // 如果已在这个 Tab 且该 Tab 内有子页面，回到根页面
      if (currentRoute?.name === routeName) {
        tabNavRef.current.dispatch({
          ...StackActions.popToTop(),
          target: currentRoute.key,
        });
      }
    }
  };

  return (
    <Tab.Navigator
      ref={tabNavRef}
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
        listeners={{
          tabPress: () => handleTabPress("HomeTab"),
        }}
      />
      <Tab.Screen
        name="QuestionsTab"
        component={QuestionsNavigator}
        options={{
          tabBarLabel: "题库",
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
        listeners={{
          tabPress: () => handleTabPress("QuestionsTab"),
        }}
      />
      <Tab.Screen
        name="PracticeTab"
        component={PracticeNavigator}
        options={{
          tabBarLabel: "答题",
          tabBarIcon: ({ color, size }) => <Play size={size} color={color} />,
        }}
        listeners={{
          tabPress: () => handleTabPress("PracticeTab"),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          tabBarLabel: "我的",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
        listeners={{
          tabPress: () => handleTabPress("ProfileTab"),
        }}
      />
    </Tab.Navigator>
  );
}
