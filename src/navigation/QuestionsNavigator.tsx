import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { QuestionsStackParamList } from "./types";
import QuestionListScreen from "~/screens/Questions/QuestionListScreen";
import QuestionDetailScreen from "~/screens/Questions/QuestionDetailScreen";
import QuestionEditScreen from "~/screens/Questions/QuestionEditScreen";
import ImportQuestionsScreen from "~/screens/Questions/ImportQuestionsScreen";

const Stack = createNativeStackNavigator<QuestionsStackParamList>();

export default function QuestionsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="QuestionList"
        component={QuestionListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QuestionDetail"
        component={QuestionDetailScreen}
        options={{ title: "题目详情" }}
      />
      <Stack.Screen
        name="QuestionEdit"
        component={QuestionEditScreen}
        options={{ title: "编辑题目" }}
      />
      <Stack.Screen
        name="ImportQuestions"
        component={ImportQuestionsScreen}
        options={{ title: "导入题库" }}
      />
    </Stack.Navigator>
  );
}
