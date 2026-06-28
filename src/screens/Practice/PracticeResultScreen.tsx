import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  Target,
  RotateCcw,
  ArrowLeft,
} from "lucide-react-native";
import { formatTime } from "~/lib/utils";
import tw from "~/lib/tw";

export default function PracticeResultScreen({ route, navigation }: any) {
  const { total = 0, correct = 0, timeSpent = 0, mode } = route.params || {};

  const wrong = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const getGrade = () => {
    if (accuracy >= 90) return { label: "优秀", color: "text-green-600", emoji: "🎉" };
    if (accuracy >= 70) return { label: "良好", color: "text-blue-600", emoji: "👍" };
    if (accuracy >= 50) return { label: "加油", color: "text-yellow-600", emoji: "💪" };
    return { label: "继续努力", color: "text-red-600", emoji: "📚" };
  };

  const grade = getGrade();

  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      {/* 成绩展示 */}
      <View style={tw`items-center pt-4 pb-8`}>
        <Text style={tw`text-6xl mb-4`}>{grade.emoji}</Text>
        <Text style={tw`text-2xl font-bold ${grade.color}`}>
          {grade.label}
        </Text>
        <Text style={tw`text-6xl font-bold text-primary-600 mt-3`}>
          {accuracy}%
        </Text>
        <Text style={tw`text-gray-400 text-sm mt-1`}>正确率</Text>
      </View>

      {/* 统计卡片 */}
      <View style={tw`flex-row mx-4 gap-3`}>
        <View style={tw`flex-1 bg-green-50 rounded-2xl p-4 items-center border border-green-100`}>
          <View style={tw`flex-row items-center mb-1`}>
            <CheckCircle2 size={18} color="#22c55e" />
          </View>
          <Text style={tw`text-2xl font-bold text-green-700`}>{correct}</Text>
          <Text style={tw`text-green-500 text-xs mt-0.5`}>正确</Text>
        </View>

        <View style={tw`flex-1 bg-red-50 rounded-2xl p-4 items-center border border-red-100`}>
          <View style={tw`flex-row items-center mb-1`}>
            <XCircle size={18} color="#ef4444" />
          </View>
          <Text style={tw`text-2xl font-bold text-red-700`}>{wrong}</Text>
          <Text style={tw`text-red-500 text-xs mt-0.5`}>错误</Text>
        </View>

        <View style={tw`flex-1 bg-blue-50 rounded-2xl p-4 items-center border border-blue-100`}>
          <View style={tw`flex-row items-center mb-1`}>
            <Clock size={18} color="#3b82f6" />
          </View>
          <Text style={tw`text-xl font-bold text-blue-700`}>
            {formatTime(timeSpent)}
          </Text>
          <Text style={tw`text-blue-500 text-xs mt-0.5`}>用时</Text>
        </View>

        <View style={tw`flex-1 bg-purple-50 rounded-2xl p-4 items-center border border-purple-100`}>
          <View style={tw`flex-row items-center mb-1`}>
            <Target size={18} color="#8b5cf6" />
          </View>
          <Text style={tw`text-2xl font-bold text-purple-700`}>{total}</Text>
          <Text style={tw`text-purple-500 text-xs mt-0.5`}>总题数</Text>
        </View>
      </View>

      {/* 评价语 */}
      <View style={tw`mx-4 mt-6 bg-gray-50 rounded-2xl p-5 border border-gray-100`}>
        <Text style={tw`text-gray-600 text-center leading-6`}>
          {accuracy >= 90
            ? "太棒了！你对这些知识点掌握得非常扎实，继续保持！"
            : accuracy >= 70
            ? "不错的表现！还有提升空间，建议回顾错题巩固薄弱环节。"
            : accuracy >= 50
            ? "继续加油！多看看错题本，重点突破薄弱知识点。"
            : "不要气馁！学习是一个积累的过程，坚持练习一定能看到进步。"}
        </Text>
      </View>

      {/* 操作按钮 */}
      <View style={tw`mx-4 mt-6 mb-12 gap-3`}>
        <TouchableOpacity
          style={tw`bg-primary-600 rounded-xl py-3.5 items-center flex-row justify-center`}
          onPress={() => {
            navigation.popToTop();
            if (mode === "free") {
              navigation.navigate("RandomConfig");
            } else if (mode === "library") {
              navigation.navigate("LibrarySelect");
            } else {
              navigation.navigate("PracticeConfig");
            }
          }}
        >
          <RotateCcw size={20} color="white" />
          <Text style={tw`text-white font-semibold text-lg ml-2`}>
            再来一组
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`bg-white rounded-xl py-3.5 items-center flex-row justify-center border border-gray-200`}
          onPress={() => {
            navigation.popToTop();
          }}
        >
          <ArrowLeft size={20} color="#6b7280" />
          <Text style={tw`text-gray-600 font-medium text-lg ml-2`}>
            返回练习
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
