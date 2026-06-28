import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { PracticeStackParamList } from "./types";
import PracticeConfigScreen from "~/screens/Practice/PracticeConfigScreen";
import RandomConfigScreen from "~/screens/Practice/RandomConfigScreen";
import LibrarySelectScreen from "~/screens/Practice/LibrarySelectScreen";
import PracticeQuizScreen from "~/screens/Practice/PracticeQuizScreen";
import PracticeResultScreen from "~/screens/Practice/PracticeResultScreen";
import PaperListScreen from "~/screens/Practice/PaperListScreen";
import PaperEditScreen from "~/screens/Practice/PaperEditScreen";
import FavoritesScreen from "~/screens/Profile/FavoritesScreen";
import WrongQuestionsScreen from "~/screens/Profile/WrongQuestionsScreen";

const Stack = createNativeStackNavigator<PracticeStackParamList>();

export default function PracticeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PracticeConfig"
        component={PracticeConfigScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RandomConfig"
        component={RandomConfigScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LibrarySelect"
        component={LibrarySelectScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaperList"
        component={PaperListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaperEdit"
        component={PaperEditScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PracticeQuiz"
        component={PracticeQuizScreen}
        options={{ title: "答题中", headerBackVisible: false }}
      />
      <Stack.Screen
        name="PracticeResult"
        component={PracticeResultScreen}
        options={{ title: "练习结果", headerBackVisible: false }}
      />
      <Stack.Screen
        name="PracticeFavorites"
        component={FavoritesScreen}
        options={{ title: "我的收藏" }}
      />
      <Stack.Screen
        name="PracticeWrongQuestions"
        component={WrongQuestionsScreen}
        options={{ title: "错题记录" }}
      />
    </Stack.Navigator>
  );
}
