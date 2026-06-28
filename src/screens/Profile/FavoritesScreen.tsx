import React, { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Trash2, Play, BookOpen, ChevronRight, Star } from "lucide-react-native";
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
      { text: "确定", onPress: () => toggleFavorite.mutate({ questionId, isFavorited: true }) },
    ]);
  };

  const handlePracticeSingle = (question: Question) => {
    startPractice([question], "favorite" as any);
    navigation.navigate("PracticeTab", { screen: "PracticeQuiz" });
  };

  const handlePracticeAll = () => {
    const questions = (favorites || [])
      .map((f: any) => f.questions)
      .filter(Boolean) as Question[];
    if (questions.length === 0) {
      Alert.alert("提示", "没有可练习的收藏题目");
      return;
    }
    startPractice(questions, "favorite" as any);
    navigation.navigate("PracticeTab", { screen: "PracticeQuiz" });
  };

  // 按标签分组
  const grouped = useMemo(() => {
    const tagMap: Record<string, { tagName: string; items: any[] }> = {};
    const untagged: any[] = [];
    for (const f of favorites || []) {
      const tags = f.questions?.tags || [];
      if (tags.length > 0) {
        for (const tag of tags) {
          if (!tagMap[tag.id]) tagMap[tag.id] = { tagName: tag.name, items: [] };
          if (!tagMap[tag.id].items.some((i) => i.id === f.id)) {
            tagMap[tag.id].items.push(f);
          }
        }
      } else {
        untagged.push(f);
      }
    }
    const sections: { key: string; tagName: string; items: any[] }[] = [];
    for (const [id, group] of Object.entries(tagMap)) {
      sections.push({ key: id, tagName: group.tagName, items: group.items });
    }
    if (untagged.length > 0) {
      sections.push({ key: "__untagged__", tagName: "未分类", items: untagged });
    }
    return sections;
  }, [favorites]);

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

  if (isLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-gray-50`}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const count = favorites?.length || 0;

  const renderSection = ({ item: section }: { item: typeof grouped[number] }) => (
    <View style={tw`mb-4`}>
      <View style={tw`flex-row items-center px-4 mb-2`}>
        <BookOpen size={16} color="#6b7280" />
        <Text style={tw`text-gray-500 text-sm font-medium ml-1.5`}>{section.tagName}</Text>
        <Text style={tw`text-gray-300 text-xs ml-2`}>{section.items.length} 题</Text>
      </View>
      {section.items.map((item: any) => {
        const question = item.questions as Question | null;
        if (!question) return null;
        const badge = getTypeBadge(question.type);

        return (
          <TouchableOpacity
            key={item.id}
            style={tw`bg-white rounded-xl p-4 mb-2 mx-4 border border-gray-100`}
            onPress={() => handlePracticeSingle(question)}
          >
            <View style={tw`flex-row items-start`}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" style={tw`mr-2 mt-0.5`} />
              <View style={tw`rounded px-2 py-0.5 mr-2 mt-0.5 ${badge.color}`}>
                <Text style={tw`text-xs font-medium`}>{badge.label}</Text>
              </View>
              <Text style={tw`text-gray-800 flex-1 leading-5 text-[15px]`} numberOfLines={2}>
                {question.stem}
              </Text>
              <ChevronRight size={16} color="#d1d5db" style={tw`mt-1 ml-1`} />
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
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <View style={tw`bg-white px-4 pb-3 border-b border-gray-100 flex-row items-center justify-between`}>
        <View>
          <Text style={tw`text-gray-400 text-sm`}>
            {count > 0 ? `共 ${count} 道收藏` : "暂无收藏"}
          </Text>
        </View>
        {count > 0 && (
          <TouchableOpacity
            style={tw`flex-row items-center bg-yellow-500 rounded-xl px-4 py-2`}
            onPress={handlePracticeAll}
          >
            <Play size={16} color="white" />
            <Text style={tw`text-white ml-1.5 font-medium text-sm`}>收藏练习</Text>
          </TouchableOpacity>
        )}
      </View>

      {count === 0 ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <Text style={tw`text-6xl mb-4`}>⭐</Text>
          <Text style={tw`text-gray-500 text-base`}>还没有收藏题目</Text>
          <Text style={tw`text-gray-300 text-sm mt-1`}>答题时点击收藏按钮即可收藏</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          renderItem={renderSection}
          keyExtractor={(item: any) => item.key}
          style={tw`flex-1 pt-4`}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
