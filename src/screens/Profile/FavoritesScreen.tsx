import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Trash2, Play } from "lucide-react-native";
import { useFavorites, useToggleFavorite } from "~/queries/practice";
import { usePracticeStore } from "~/stores/practice";
import { QuestionType } from "~/types";
import type { Question } from "~/types";
import tw from "~/lib/tw";

export default function FavoritesScreen({ navigation }: any) {
  const { data: favorites, isLoading } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const startPractice = usePracticeStore((s) => s.startPractice);

  const handleRemove = (questionId: string) => {
    Alert.alert("取消收藏", "确定要取消收藏这道题吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "确定",
        onPress: () =>
          toggleFavorite.mutate({ questionId, isFavorited: true }),
      },
    ]);
  };

  const handlePracticeFavorites = () => {
    const questions = (favorites || [])
      .map((f: any) => f.questions)
      .filter(Boolean) as Question[];
    if (questions.length === 0) {
      Alert.alert("提示", "没有可练习的收藏题目");
      return;
    }
    startPractice(questions, "favorite" as any);
    navigation.navigate("PracticeTab", {
      screen: "PracticeQuiz",
    });
  };

  const getTypeBadge = (type: string) => {
    const map: Record<string, { color: string; label: string }> = {
      single_choice: { color: "bg-blue-100 text-blue-700", label: "单选" },
      multi_choice: { color: "bg-purple-100 text-purple-700", label: "多选" },
      true_false: { color: "bg-green-100 text-green-700", label: "判断" },
      fill_blank: { color: "bg-orange-100 text-orange-700", label: "填空" },
      short_answer: { color: "bg-pink-100 text-pink-700", label: "简答" },
    };
    return map[type] || { color: "bg-gray-100 text-gray-600", label: type };
  };

  const renderItem = ({ item }: { item: any }) => {
    const question = item.questions as Question | null;
    if (!question) return null;

    const badge = getTypeBadge(question.type);

    return (
      <View style={tw`bg-white rounded-xl p-4 mb-3 mx-4 border border-gray-100`}>
        <View style={tw`flex-row items-start justify-between`}>
          <View style={tw`flex-row items-start flex-1 mr-2`}>
            <View style={tw`rounded px-2 py-0.5 mr-2 mt-0.5 ${badge.color}`}>
              <Text style={tw`text-xs font-medium`}>{badge.label}</Text>
            </View>
            <Text style={tw`text-gray-800 flex-1 leading-5 text-[15px]`} numberOfLines={2}>
              {question.stem}
            </Text>
          </View>
        </View>

        <View style={tw`flex-row items-center justify-end mt-3 pt-3 border-t border-gray-50`}>
          <TouchableOpacity
            style={tw`flex-row items-center`}
            onPress={() => handleRemove(question.id)}
          >
            <Trash2 size={16} color="#9ca3af" />
            <Text style={tw`text-gray-400 text-xs ml-1`}>取消收藏</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-gray-50`}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const count = favorites?.length || 0;

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <View style={tw`bg-white px-4 pt-4 pb-3 border-b border-gray-100 flex-row items-center justify-between`}>
        <View>
          <Text style={tw`text-gray-800 font-semibold text-lg`}>我的收藏</Text>
          <Text style={tw`text-gray-400 text-sm`}>
            {count > 0 ? `共 ${count} 道收藏` : "暂无收藏"}
          </Text>
        </View>
        {count > 0 && (
          <TouchableOpacity
            style={tw`flex-row items-center bg-yellow-500 rounded-xl px-4 py-2`}
            onPress={handlePracticeFavorites}
          >
            <Play size={16} color="white" />
            <Text style={tw`text-white ml-1.5 font-medium text-sm`}>
              收藏练习
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {count === 0 ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <Text style={tw`text-6xl mb-4`}>⭐</Text>
          <Text style={tw`text-gray-500 text-base`}>还没有收藏题目</Text>
          <Text style={tw`text-gray-300 text-sm mt-1`}>
            答题时点击收藏按钮即可收藏
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.id}
          style={tw`flex-1 pt-4`}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
