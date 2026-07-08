import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { Search, Plus, Upload, Trash2, BookOpen, ChevronRight, ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuestionType, QuestionTypeLabel } from "~/types";
import { useQuestions, useDeleteQuestion, useTags, useUpdateTag, useDeleteTag, useCreateTag } from "~/queries/questions";
import tw from "~/lib/tw";

export default function QuestionListScreen({ navigation }: any) {
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuestions({
    search,
    type: selectedType,
    tagId: selectedTagId === "__untagged__" ? null : selectedTagId,
    page,
  });
  const deleteMutation = useDeleteQuestion();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();
  const createTagMutation = useCreateTag();
  const [renameTagId, setRenameTagId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [renameSubmitted, setRenameSubmitted] = useState(false);

  // 用户确认重命名后，标签列表更新时自动关闭输入框
  useEffect(() => {
    if (renameTagId && renameSubmitted && tags.some((t) => t.id === renameTagId && t.name === renameText)) {
      setRenameTagId(null);
      setRenameSubmitted(false);
    }
  }, [tags, renameTagId, renameText, renameSubmitted]);
  const insets = useSafeAreaInsets();

  let questions = data?.data || [];
  // "未分类"：客户端过滤无标签题目
  if (selectedTagId === "__untagged__") {
    questions = questions.filter((q: any) => !q.tags || q.tags.length === 0);
  }
  const total = selectedTagId === "__untagged__" ? questions.length : (data?.total || 0);
  const selectedTag = tags.find((t) => t.id === selectedTagId);

  const typeFilters: { label: string; value: QuestionType | null }[] = [
    { label: "全部", value: null },
    { label: "单选题", value: QuestionType.SINGLE_CHOICE },
    { label: "多选题", value: QuestionType.MULTI_CHOICE },
    { label: "判断题", value: QuestionType.TRUE_FALSE },
    { label: "填空题", value: QuestionType.FILL_BLANK },
    { label: "简答题", value: QuestionType.SHORT_ANSWER },
  ];

  const getTypeBadge = (type: QuestionType) => {
    const colors: Record<string, string> = {
      single_choice: "bg-blue-100 text-blue-700",
      multi_choice: "bg-purple-100 text-purple-700",
      true_false: "bg-green-100 text-green-700",
      fill_blank: "bg-orange-100 text-orange-700",
      short_answer: "bg-pink-100 text-pink-700",
    };
    const shortLabels: Record<string, string> = {
      single_choice: "单选",
      multi_choice: "多选",
      true_false: "判断",
      fill_blank: "填空",
      short_answer: "简答",
    };
    return { className: colors[type] || "", label: shortLabels[type] || type };
  };

  // === 题库标签列表视图 ===
  if (!selectedTagId) {
    const tagColors = [
      "bg-blue-50 border-blue-200", "bg-purple-50 border-purple-200",
      "bg-green-50 border-green-200", "bg-orange-50 border-orange-200",
      "bg-pink-50 border-pink-200", "bg-teal-50 border-teal-200",
    ];
    const iconColors = [
      "text-blue-600 bg-blue-100", "text-purple-600 bg-purple-100",
      "text-green-600 bg-green-100", "text-orange-600 bg-orange-100",
      "text-pink-600 bg-pink-100", "text-teal-600 bg-teal-100",
    ];

    return (
      <ScrollView style={tw`flex-1 bg-gray-50`}>
        <View style={[tw`bg-white px-4 pb-4 border-b border-gray-100`, { paddingTop: insets.top }]}>
          <Text style={tw`text-2xl font-bold text-gray-800`}>题库</Text>
          <Text style={tw`text-gray-400 text-sm mt-1`}>
            选择一个题库查看或导入题目
          </Text>
        </View>

        {/* 操作按钮 */}
        <View style={tw`flex-row px-4 mt-4 gap-3`}>
          <TouchableOpacity
            style={tw`flex-1 flex-row items-center justify-center bg-white rounded-xl py-3 border border-gray-200`}
            onPress={() => navigation.navigate("QuestionEdit", {})}
          >
            <Plus size={18} color="#3b82f6" />
            <Text style={tw`text-primary-600 ml-1.5 font-medium`}>手动录题</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`flex-1 flex-row items-center justify-center bg-white rounded-xl py-3 border border-gray-200`}
            onPress={() => navigation.navigate("ImportQuestions")}
          >
            <Upload size={18} color="#3b82f6" />
            <Text style={tw`text-primary-600 ml-1.5 font-medium`}>导入题库</Text>
          </TouchableOpacity>
        </View>
        <View style={tw`px-4 mt-2`}>
          <TouchableOpacity
            style={tw`flex-row items-center justify-center bg-white rounded-xl py-3 border border-dashed border-gray-300`}
            onPress={() => {
              setRenameTagId(null);
              setRenameSubmitted(false);
              // 不立即创建，先弹出重命名框让用户输入
              const tempId = "new_" + Date.now();
              setRenameTagId(tempId);
              setRenameText("");
            }}
          >
            <Plus size={18} color="#9ca3af" />
            <Text style={tw`text-gray-400 ml-1.5 font-medium`}>创建空题库</Text>
          </TouchableOpacity>
        </View>

        {/* 题库标签列表 */}
        {renameTagId && (
          <View style={tw`mx-4 mb-4 bg-white rounded-xl p-4 border border-primary-300`}>
            <Text style={tw`text-sm font-medium text-gray-600 mb-2`}>
              {renameTagId?.startsWith("new_") ? "新建题库" : "重命名标签"}
            </Text>
            <TextInput
              style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base`}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
            />
            <View style={tw`flex-row gap-2 mt-3`}>
              <TouchableOpacity
                style={tw`flex-1 bg-gray-100 rounded-xl py-2 items-center`}
                onPress={() => setRenameTagId(null)}
              >
                <Text style={tw`text-gray-600`}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-primary-600 rounded-xl py-2 items-center`}
                onPress={async () => {
                  if (!renameText.trim()) return;
                  setRenameSubmitted(true);
                  // 如果是新标签（临时ID），先创建
                  if (renameTagId?.startsWith("new_")) {
                    // 去重：如果名字已存在，加 (1)/(2)...
                    let name = renameText.trim();
                    const existingNames = new Set(tags.map((t) => t.name));
                    if (existingNames.has(name)) {
                      let i = 1;
                      while (existingNames.has(`${name}(${i})`)) i++;
                      name = `${name}(${i})`;
                    }
                    try {
                      await createTagMutation.mutateAsync({
                        name,
                        color: "#3b82f6",
                      });
                      setRenameTagId(null);
                      setRenameSubmitted(false);
                    } catch {}
                  } else {
                    updateTagMutation.mutate({ id: renameTagId, name: renameText.trim() });
                  }
                }}
              >
                <Text style={tw`text-white`}>确认</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {tagsLoading ? (
          <View style={tw`items-center py-10`}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : tags.length === 0 ? (
          <View style={tw`items-center py-10`}>
            <Text style={tw`text-gray-400`}>还没有题库</Text>
            <Text style={tw`text-gray-300 text-sm mt-1`}>导入题库后这里会显示</Text>
          </View>
        ) : (
          <View style={tw`px-4 mt-4 gap-3 mb-8`}>
            {tags.map((tag, idx) => (
              <TouchableOpacity
                key={tag.id}
                style={tw`${tagColors[idx % tagColors.length]} rounded-2xl p-5 border`}
                onPress={() => setSelectedTagId(tag.id)}
                onLongPress={() => {
                  Alert.alert(tag.name, "选择操作", [
                    {
                      text: "重命名",
                      onPress: () => {
                        setRenameTagId(tag.id);
                        setRenameText(tag.name);
                      },
                    },
                    {
                      text: "删除",
                      style: "destructive",
                      onPress: () => {
                        Alert.alert("确认删除", `确定要删除"${tag.name}"吗？题库中的所有题目也会一并删除，此操作不可恢复。`, [
                          { text: "取消", style: "cancel" },
                          { text: "删除", style: "destructive", onPress: () => deleteTagMutation.mutate(tag.id) },
                        ]);
                      },
                    },
                    { text: "取消", style: "cancel" },
                  ]);
                }}
              >
                <View style={tw`flex-row items-center`}>
                  <View style={tw`${iconColors[idx % iconColors.length]} w-12 h-12 rounded-xl items-center justify-center`}>
                    <BookOpen size={22} />
                  </View>
                  <View style={tw`flex-1 ml-4`}>
                    <Text style={tw`text-gray-800 font-semibold text-lg`}>{tag.name}</Text>
                    <Text style={tw`text-gray-500 text-sm mt-0.5`}>点击查看题目</Text>
                  </View>
                  <ChevronRight size={20} color="#d1d5db" />
                </View>
              </TouchableOpacity>
            ))}
            {/* 未分类 */}
            <TouchableOpacity
              style={tw`bg-gray-50 border border-gray-300 border-dashed rounded-2xl p-5`}
              onPress={() => setSelectedTagId("__untagged__")}
            >
              <View style={tw`flex-row items-center`}>
                <View style={tw`bg-gray-200 w-12 h-12 rounded-xl items-center justify-center`}>
                  <BookOpen size={22} color="#6b7280" />
                </View>
                <View style={tw`flex-1 ml-4`}>
                  <Text style={tw`text-gray-800 font-semibold text-lg`}>未分类</Text>
                  <Text style={tw`text-gray-500 text-sm mt-0.5`}>手动录入的无标签题目</Text>
                </View>
                <ChevronRight size={20} color="#d1d5db" />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  }

  // === 题目列表视图 ===
  const renderItem = ({ item }: { item: any }) => {
    const badge = getTypeBadge(item.type);
    return (
      <TouchableOpacity
        style={tw`bg-white rounded-xl p-4 mb-3 border border-gray-100 mx-4`}
        onPress={() => navigation.navigate("QuestionDetail", { questionId: item.id })}
      >
        <View style={tw`flex-row items-start`}>
          <View style={tw`rounded px-2 py-0.5 mr-2 mt-0.5 ${badge.className}`}>
            <Text style={tw`text-xs font-medium`}>{badge.label}</Text>
          </View>
          <Text style={tw`text-gray-800 flex-1 leading-5 text-[15px]`} numberOfLines={2}>
            {item.stem}
          </Text>
          <TouchableOpacity
            style={tw`ml-2 p-1`}
            onPress={() => {
              Alert.alert("删除题目", "确定要删除吗？", [
                { text: "取消", style: "cancel" },
                { text: "删除", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
              ]);
            }}
          >
            <Trash2 size={16} color="#d1d5db" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* 顶部 */}
      <View style={[tw`bg-white px-4 pb-3 border-b border-gray-100`, { paddingTop: insets.top }]}>
        <View style={tw`flex-row items-center mb-2`}>
          <TouchableOpacity
            style={tw`mr-3 p-1`}
            onPress={() => setSelectedTagId(null)}
          >
            <ArrowLeft size={22} color="#3b82f6" />
          </TouchableOpacity>
          <Text style={tw`text-lg font-bold text-gray-800`}>
            {selectedTag?.name || "题目"}
          </Text>
          <View style={tw`flex-1`} />
          <TouchableOpacity
            style={tw`bg-primary-600 rounded-xl px-3 py-1.5 flex-row items-center`}
            onPress={() =>
              navigation.navigate("QuestionEdit", {
                tagId: selectedTagId,
              })
            }
          >
            <Plus size={14} color="white" />
            <Text style={tw`text-white ml-1 text-sm font-medium`}>录题</Text>
          </TouchableOpacity>
        </View>
        <View style={tw`flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5`}>
          <Search size={18} color="#9ca3af" />
          <TextInput
            style={tw`flex-1 ml-2 text-base text-gray-900`}
            placeholder="搜索题目..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={(text) => { setSearch(text); setPage(1); }}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mt-3`}>
          {typeFilters.map((tf) => (
            <TouchableOpacity
              key={tf.label}
              style={tw`mr-2 px-4 py-1.5 rounded-full ${selectedType === tf.value ? "bg-primary-600" : "bg-gray-100"}`}
              onPress={() => { setSelectedType(tf.value); setPage(1); }}
            >
              <Text style={tw`text-sm ${selectedType === tf.value ? "text-white" : "text-gray-600"}`}>
                {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 题目列表 */}
      {isLoading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={questions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={tw`flex-1 pt-4`}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListHeaderComponent={
            total > 0 ? (
              <Text style={tw`text-gray-400 text-xs px-4 mb-3`}>共 {total} 题</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={tw`items-center py-20`}>
              <Text style={tw`text-gray-400`}>暂无题目</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
