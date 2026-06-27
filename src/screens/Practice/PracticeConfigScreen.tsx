import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Shuffle, FileText, RotateCcw, Star } from "lucide-react-native";
import { PracticeMode } from "~/types";
import { useWrongQuestions, useFavorites } from "~/queries/practice";
import { usePracticeStore } from "~/stores/practice";
import { pickRandom } from "~/lib/utils";
import type { Question } from "~/types";
import tw from "~/lib/tw";

export default function PracticeConfigScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const startPractice = usePracticeStore((s) => s.startPractice);

  const { data: favoritesData } = useFavorites();
  const { data: wrongQuestionsData } = useWrongQuestions();

  const handleStartPractice = async (mode: PracticeMode) => {
    setLoading(true);
    try {
      let selectedQuestions: Question[] = [];

      switch (mode) {
        case PracticeMode.WRONG: {
          const wrongPool = (wrongQuestionsData || [])
            .map((wq: any) => wq.questions)
            .filter(Boolean) as Question[];
          if (wrongPool.length === 0) {
            Alert.alert("提示", "没有错题记录，太棒了！");
            setLoading(false);
            return;
          }
          selectedQuestions = pickRandom(wrongPool, wrongPool.length);
          break;
        }

        case PracticeMode.FAVORITE: {
          const pool = (favoritesData || [])
            .map((f: any) => f.questions)
            .filter(Boolean) as Question[];
          if (pool.length === 0) {
            Alert.alert("提示", "没有收藏题目");
            setLoading(false);
            return;
          }
          selectedQuestions = pickRandom(pool, pool.length);
          break;
        }

        default:
          break;
      }

      if (selectedQuestions.length === 0 && mode !== PracticeMode.FREE && mode !== PracticeMode.LIBRARY) {
        Alert.alert("提示", "没有可用的题目");
        setLoading(false);
        return;
      }

      startPractice(selectedQuestions, mode);
      setLoading(false);
      if (selectedQuestions.length > 0) {
        navigation.navigate("PracticeQuiz");
      }
    } catch {
      setLoading(false);
    }
  };

  const modes = [
    {
      key: PracticeMode.FREE,
      title: "随机练习",
      desc: "选择题库、题型和数量",
      icon: <Shuffle size={24} color="#3b82f6" />,
      color: "bg-primary-100",
      onPress: () => navigation.navigate("RandomConfig"),
    },
    {
      key: PracticeMode.LIBRARY,
      title: "题库练习",
      desc: "选一个题库从头做到尾",
      icon: <FileText size={24} color="#8b5cf6" />,
      color: "bg-purple-100",
      onPress: () => navigation.navigate("LibrarySelect"),
    },
    {
      key: PracticeMode.WRONG,
      title: "错题重练",
      desc: "专攻错题，精准提升",
      icon: <RotateCcw size={24} color="#ef4444" />,
      color: "bg-red-100",
      onPress: () => handleStartPractice(PracticeMode.WRONG),
    },
    {
      key: PracticeMode.FAVORITE,
      title: "收藏练习",
      desc: "只练收藏的重点题",
      icon: <Star size={24} color="#f59e0b" />,
      color: "bg-yellow-100",
      onPress: () => handleStartPractice(PracticeMode.FAVORITE),
    },
  ];

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`pt-14 pb-4 px-4 bg-white border-b border-gray-100`}>
        <Text style={tw`text-2xl font-bold text-gray-800`}>开始练习</Text>
        <Text style={tw`text-gray-400 text-sm mt-1`}>
          选择练习模式
        </Text>
      </View>

      <Text style={tw`px-4 mt-6 mb-3 text-gray-800 font-semibold`}>
        练习模式
      </Text>
      <View style={tw`px-4 gap-3 mb-8`}>
        {modes.map((mode) => (
          <TouchableOpacity
            key={mode.key}
            style={tw`bg-white rounded-xl p-4 border border-gray-100 flex-row items-center`}
            onPress={mode.onPress}
            disabled={loading}
          >
            <View style={tw`${mode.color} w-12 h-12 rounded-full items-center justify-center mr-4`}>
              {mode.icon}
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-gray-800 font-semibold text-base`}>
                {mode.title}
              </Text>
              <Text style={tw`text-gray-400 text-sm mt-0.5`}>{mode.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
