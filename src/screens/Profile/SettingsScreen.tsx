import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Download, Database, Shield } from "lucide-react-native";
import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useAllQuestions } from "~/queries/questions";
import { useWrongQuestions, useFavorites, useDailyCheckins } from "~/queries/practice";
import { APP_NAME } from "~/constants";
import tw from "~/lib/tw";

export default function SettingsScreen() {
  const { data: questionsData } = useAllQuestions();
  const { data: wrongQuestions } = useWrongQuestions();
  const { data: favorites } = useFavorites();
  const { data: checkins } = useDailyCheckins(365);

  const [exporting, setExporting] = React.useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportData = {
        export_time: new Date().toISOString(),
        app: APP_NAME,
        questions: questionsData?.data || [],
        wrong_questions: wrongQuestions || [],
        favorites: favorites || [],
        checkins: checkins || [],
      };

      const json = JSON.stringify(exportData, null, 2);
      const fileName = `quiz_backup_${new Date().toISOString().split("T")[0]}.json`;
      const file = new File(Paths.cache, fileName);
      file.create({ overwrite: true });
      file.write(json);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
        });
      } else {
        Alert.alert("提示", "当前设备不支持分享功能");
      }
    } catch (err: any) {
      Alert.alert("导出失败", err.message);
    } finally {
      setExporting(false);
    }
  };

  const menuItems = [
    {
      icon: <Download size={20} color="#3b82f6" />,
      label: "导出全部数据",
      desc: "导出题库、错题、收藏、打卡记录为 JSON 文件",
      bg: "bg-blue-100",
      onPress: handleExport,
      loading: exporting,
    },
  ];

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`}>
      {/* 数据管理 */}
      <Text style={tw`px-4 mt-4 mb-3 text-gray-500 text-xs font-medium uppercase`}>
        数据管理
      </Text>
      <View style={tw`mx-4 bg-white rounded-2xl border border-gray-100 overflow-hidden`}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={tw`flex-row items-center px-4 py-4 border-b border-gray-50 last:border-b-0`}
            onPress={item.onPress}
            disabled={item.loading}
          >
            <View style={tw`${item.bg} w-10 h-10 rounded-full items-center justify-center mr-3`}>
              {item.loading ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                item.icon
              )}
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-gray-800 font-medium`}>{item.label}</Text>
              <Text style={tw`text-gray-400 text-xs mt-0.5`}>{item.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 关于 */}
      <Text style={tw`px-4 mt-6 mb-3 text-gray-500 text-xs font-medium uppercase`}>
        关于
      </Text>
      <View style={tw`mx-4 bg-white rounded-2xl border border-gray-100 p-4`}>
        <View style={tw`flex-row items-center`}>
          <Shield size={20} color="#3b82f6" />
          <View style={tw`ml-3`}>
            <Text style={tw`text-gray-800 font-medium`}>{APP_NAME}</Text>
            <Text style={tw`text-gray-400 text-xs mt-0.5`}>
              智能刷题练习平台 v1.0.0
            </Text>
          </View>
        </View>
        <Text style={tw`text-gray-500 text-sm mt-3 leading-5`}>
          数据存储在 Supabase 云端，自动同步。所有数据仅你可见。
        </Text>
      </View>
    </ScrollView>
  );
}
