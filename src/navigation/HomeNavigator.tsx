import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "./types";
import HomeScreen from "~/screens/Home/HomeScreen";
import PracticeResultScreen from "~/screens/Practice/PracticeResultScreen";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PracticeResult"
        component={PracticeResultScreen}
        options={{ title: "练习结果" }}
      />
    </Stack.Navigator>
  );
}
