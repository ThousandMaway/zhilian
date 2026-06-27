import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { PracticeStackParamList } from "./types";
import PracticeConfigScreen from "~/screens/Practice/PracticeConfigScreen";
import RandomConfigScreen from "~/screens/Practice/RandomConfigScreen";
import LibrarySelectScreen from "~/screens/Practice/LibrarySelectScreen";
import PracticeQuizScreen from "~/screens/Practice/PracticeQuizScreen";
import PracticeResultScreen from "~/screens/Practice/PracticeResultScreen";

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
        name="PracticeQuiz"
        component={PracticeQuizScreen}
        options={{ title: "答题中", headerBackVisible: false }}
      />
      <Stack.Screen
        name="PracticeResult"
        component={PracticeResultScreen}
        options={{ title: "练习结果", headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}
