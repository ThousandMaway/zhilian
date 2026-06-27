import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  FileText,
  Plus,
  Trash2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePapers, useDeletePaper } from "~/queries/practice";
import tw from "~/lib/tw";

export default function PaperListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { data: papers = [], isLoading } = usePapers();
  const deleteMutation = useDeletePaper();

  const handleDelete = (paper: any) => {
    Alert.alert("删除试卷", `确定要删除"${paper.title}"吗？试卷中的题目不会被删除。`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: () => deleteMutation.mutate(paper.id),
      },
    ]);
  };

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`}>
      <View style={[tw`pb-4 px-4 bg-white border-b border-gray-100`, { paddingTop: insets.top }]}>
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity style={tw`mr-3 p-1`} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color="#3b82f6" />
          </TouchableOpacity>
          <View style={tw`flex-1`}>
            <Text style={tw`text-2xl font-bold text-gray-800`}>试卷</Text>
            <Text style={tw`text-gray-400 text-sm mt-1`}>创建试卷，模拟真实考试</Text>
          </View>
          <TouchableOpacity
            style={tw`bg-primary-600 rounded-xl px-4 py-2 flex-row items-center`}
            onPress={() => navigation.navigate("PaperEdit", {})}
          >
            <Plus size={16} color="white" />
            <Text style={tw`text-white ml-1 font-medium text-sm`}>新建</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={tw`items-center py-20`}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : papers.length === 0 ? (
        <View style={tw`items-center py-20`}>
          <FileText size={48} color="#d1d5db" />
          <Text style={tw`text-gray-400 mt-4 text-base`}>还没有试卷</Text>
          <Text style={tw`text-gray-300 text-sm mt-1`}>
            点击右上角创建第一份试卷
          </Text>
        </View>
      ) : (
        <View style={tw`px-4 mt-4 gap-3 mb-8`}>
          {papers.map((paper: any) => (
            <TouchableOpacity
              key={paper.id}
              style={tw`bg-white rounded-2xl p-5 border border-gray-100`}
              onPress={() =>
                navigation.navigate("PaperEdit", { paperId: paper.id })
              }
              onLongPress={() => handleDelete(paper)}
            >
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-12 h-12 bg-purple-100 rounded-xl items-center justify-center`}>
                  <FileText size={22} color="#8b5cf6" />
                </View>
                <View style={tw`flex-1 ml-4`}>
                  <Text style={tw`text-gray-800 font-semibold text-base`}>
                    {paper.title}
                  </Text>
                  <Text style={tw`text-gray-400 text-sm mt-0.5`}>
                    {paper.description || `${paper.question_count} 题`}
                  </Text>
                </View>
                <View style={tw`items-end`}>
                  <Text style={tw`text-gray-800 font-bold text-lg`}>
                    {paper.question_count}
                  </Text>
                  <Text style={tw`text-gray-400 text-xs`}>题</Text>
                </View>
                <ChevronRight size={20} color="#d1d5db" style={tw`ml-2`} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
