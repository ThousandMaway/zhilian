import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Plus, X, Trash2 } from "lucide-react-native";
import {
  QuestionType,
  QuestionTypeLabel,
  Difficulty,
  DifficultyLabel,
} from "~/types";
import { useQuestion, useCreateQuestion, useUpdateQuestion, useTags } from "~/queries/questions";
import { generateId } from "~/lib/utils";
import tw from "~/lib/tw";

interface OptionInput {
  id: string;
  content: string;
}

export default function QuestionEditScreen({ route, navigation }: any) {
  const { questionId } = route.params || {};
  const isEdit = !!questionId;

  const { data: existingQuestion } = useQuestion(isEdit ? questionId : undefined);
  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();
  const { data: availableTags = [] } = useTags();

  // 表单状态
  const [type, setType] = useState<QuestionType>(QuestionType.SINGLE_CHOICE);
  const [stem, setStem] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [analysis, setAnalysis] = useState("");
  const [options, setOptions] = useState<OptionInput[]>([
    { id: "A", content: "" },
    { id: "B", content: "" },
    { id: "C", content: "" },
    { id: "D", content: "" },
  ]);
  const [singleAnswer, setSingleAnswer] = useState("A");
  const [multiAnswer, setMultiAnswer] = useState<string[]>([]);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState("true");
  const [textAnswer, setTextAnswer] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // 回填编辑数据
  useEffect(() => {
    if (existingQuestion) {
      setType(existingQuestion.type as QuestionType);
      setStem(existingQuestion.stem);
      setDifficulty(existingQuestion.difficulty as Difficulty);
      setAnalysis(existingQuestion.analysis || "");
      if (existingQuestion.options) {
        setOptions(existingQuestion.options as OptionInput[]);
      }
      if (Array.isArray(existingQuestion.answer)) {
        setMultiAnswer(existingQuestion.answer as string[]);
      } else {
        const ans = existingQuestion.answer as string;
        if (ans === "true" || ans === "false") {
          setTrueFalseAnswer(ans);
        } else if (/^[A-H]$/.test(ans)) {
          setSingleAnswer(ans);
        } else {
          setTextAnswer(ans);
        }
      }
      if (existingQuestion.tags) {
        setSelectedTags((existingQuestion.tags as any[]).map((t: any) => t.id));
      }
    }
  }, [existingQuestion]);

  const addOption = () => {
    if (options.length >= 8) return; // 最多 8 个选项
    const used = new Set(options.map((o) => o.id));
    let nextId = "A";
    for (let i = 0; i < 8; i++) {
      const char = String.fromCharCode(65 + i);
      if (!used.has(char)) {
        nextId = char;
        break;
      }
    }
    setOptions([...options, { id: nextId, content: "" }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return; // 至少保留 2 个选项
    const remaining = options.filter((o) => o.id !== id);
    setOptions(remaining);
    if (singleAnswer === id) setSingleAnswer(remaining[0].id);
    setMultiAnswer(multiAnswer.filter((a) => a !== id));
  };

  const updateOption = (id: string, content: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, content } : o)));
  };

  const toggleMultiAnswer = (id: string) => {
    setMultiAnswer((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const buildAnswer = (): string | string[] => {
    switch (type) {
      case QuestionType.SINGLE_CHOICE:
        return singleAnswer;
      case QuestionType.MULTI_CHOICE:
        return multiAnswer;
      case QuestionType.TRUE_FALSE:
        return trueFalseAnswer;
      case QuestionType.FILL_BLANK:
      case QuestionType.SHORT_ANSWER:
        return textAnswer;
      default:
        return "";
    }
  };

  const handleSave = async () => {
    if (!stem.trim()) {
      Alert.alert("提示", "请输入题干");
      return;
    }

    const needsOptions = [
      QuestionType.SINGLE_CHOICE,
      QuestionType.MULTI_CHOICE,
    ].includes(type);

    if (needsOptions) {
      const validOptions = options.filter((o) => o.content.trim());
      if (validOptions.length < 2) {
        Alert.alert("提示", "至少需要 2 个有效选项");
        return;
      }
      if (type === QuestionType.MULTI_CHOICE && multiAnswer.length < 2) {
        Alert.alert("提示", "多选题至少选择 2 个正确答案");
        return;
      }
    }

    const payload = {
      user_id: "", // Supabase RLS 自动填充
      type,
      stem: stem.trim(),
      options: needsOptions
        ? options.filter((o) => o.content.trim())
        : null,
      answer: buildAnswer(),
      analysis: analysis.trim() || null,
      difficulty,
      tag_ids: selectedTags,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: questionId, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("保存失败", err.message);
    }
  };

  const needsOptions = [
    QuestionType.SINGLE_CHOICE,
    QuestionType.MULTI_CHOICE,
  ].includes(type);

  const isTrueFalse = type === QuestionType.TRUE_FALSE;
  const isTextAnswer = [
    QuestionType.FILL_BLANK,
    QuestionType.SHORT_ANSWER,
  ].includes(type);

  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      {/* 题型选择 */}
      <View style={tw`px-4 pt-4`}>
        <Text style={tw`text-sm font-medium text-gray-500 mb-2`}>题型</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(QuestionTypeLabel).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={tw`mr-2 px-4 py-2 rounded-full ${type === key ? "bg-primary-600" : "bg-gray-100"}`}
              onPress={() => {
                setType(key as QuestionType);
                // 切换题型时重置答案
                if (key === QuestionType.MULTI_CHOICE) setMultiAnswer([]);
              }}
            >
              <Text
                style={tw`text-sm ${type === key ? "text-white" : "text-gray-600"}`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 题干 */}
      <View style={tw`px-4 mt-4`}>
        <Text style={tw`text-sm font-medium text-gray-500 mb-2`}>题干</Text>
        <TextInput
          style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 min-h-[80px]`}
          placeholder="请输入题目内容..."
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
          value={stem}
          onChangeText={setStem}
        />
      </View>

      {/* 选项（单选/多选） */}
      {needsOptions && (
        <View style={tw`px-4 mt-4`}>
          <View style={tw`flex-row justify-between items-center mb-2`}>
            <Text style={tw`text-sm font-medium text-gray-500`}>选项</Text>
            <TouchableOpacity onPress={addOption}>
              <Plus size={18} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          {options.map((opt, idx) => (
            <View key={opt.id} style={tw`flex-row items-center mb-2`}>
              {/* 选择按钮 */}
              {type === QuestionType.SINGLE_CHOICE ? (
                <TouchableOpacity
                  style={tw`w-8 h-8 rounded-full items-center justify-center mr-2 ${
                    singleAnswer === opt.id
                      ? "bg-primary-600"
                      : "bg-gray-200"
                  }`}
                  onPress={() => setSingleAnswer(opt.id)}
                >
                  <Text
                    style={tw`text-sm font-bold ${
                      singleAnswer === opt.id ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {opt.id}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={tw`w-8 h-8 rounded items-center justify-center mr-2 ${
                    multiAnswer.includes(opt.id)
                      ? "bg-primary-600"
                      : "bg-gray-200"
                  }`}
                  onPress={() => toggleMultiAnswer(opt.id)}
                >
                  <Text
                    style={tw`text-sm font-bold ${
                      multiAnswer.includes(opt.id) ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {opt.id}
                  </Text>
                </TouchableOpacity>
              )}

              <TextInput
                style={tw`flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900`}
                placeholder={`选项 ${opt.id}`}
                placeholderTextColor="#9ca3af"
                value={opt.content}
                onChangeText={(text) => updateOption(opt.id, text)}
              />

              {options.length > 2 && (
                <TouchableOpacity
                  style={tw`ml-2 p-2`}
                  onPress={() => removeOption(opt.id)}
                >
                  <X size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {type === QuestionType.MULTI_CHOICE && (
            <Text style={tw`text-gray-400 text-xs mt-1`}>
              已选 {multiAnswer.length} 个正确答案
            </Text>
          )}
        </View>
      )}

      {/* 判断题答案 */}
      {isTrueFalse && (
        <View style={tw`px-4 mt-4`}>
          <Text style={tw`text-sm font-medium text-gray-500 mb-2`}>
            正确答案
          </Text>
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              style={tw`flex-1 p-4 rounded-xl border items-center ${
                trueFalseAnswer === "true"
                  ? "bg-green-50 border-green-500"
                  : "bg-gray-50 border-gray-200"
              }`}
              onPress={() => setTrueFalseAnswer("true")}
            >
              <Text style={tw`text-lg`}>✅</Text>
              <Text style={tw`text-gray-700 font-medium mt-1`}>正确</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 p-4 rounded-xl border items-center ${
                trueFalseAnswer === "false"
                  ? "bg-red-50 border-red-500"
                  : "bg-gray-50 border-gray-200"
              }`}
              onPress={() => setTrueFalseAnswer("false")}
            >
              <Text style={tw`text-lg`}>❌</Text>
              <Text style={tw`text-gray-700 font-medium mt-1`}>错误</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 填空/简答答案 */}
      {isTextAnswer && (
        <View style={tw`px-4 mt-4`}>
          <Text style={tw`text-sm font-medium text-gray-500 mb-2`}>
            参考答案
          </Text>
          <TextInput
            style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 min-h-[60px]`}
            placeholder={
              type === QuestionType.FILL_BLANK ? "请输入标准答案" : "请输入参考答案或评分要点"
            }
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
            value={textAnswer}
            onChangeText={setTextAnswer}
          />
        </View>
      )}

      {/* 难度 */}
      <View style={tw`px-4 mt-4`}>
        <Text style={tw`text-sm font-medium text-gray-500 mb-2`}>难度</Text>
        <View style={tw`flex-row gap-3`}>
          {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((d) => (
            <TouchableOpacity
              key={d}
              style={tw`flex-1 py-2.5 rounded-xl border ${
                difficulty === d
                  ? d === Difficulty.EASY
                    ? "bg-green-50 border-green-500"
                    : d === Difficulty.MEDIUM
                    ? "bg-yellow-50 border-yellow-500"
                    : "bg-red-50 border-red-500"
                  : "bg-gray-50 border-gray-200"
              }`}
              onPress={() => setDifficulty(d)}
            >
              <Text
                style={tw`text-center text-sm font-medium ${
                  difficulty === d ? "text-gray-800" : "text-gray-500"
                }`}
              >
                {DifficultyLabel[d]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 标签 */}
      <View style={tw`px-4 mt-4`}>
        <Text style={tw`text-sm font-medium text-gray-500 mb-2`}>标签</Text>
        {availableTags.length > 0 ? (
          <View style={tw`flex-row flex-wrap gap-2`}>
            {availableTags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={tw`px-4 py-2 rounded-full border ${
                  selectedTags.includes(tag.id)
                    ? "bg-primary-600 border-primary-600"
                    : "bg-gray-50 border-gray-200"
                }`}
                onPress={() => toggleTag(tag.id)}
              >
                <Text
                  style={tw`text-sm ${
                    selectedTags.includes(tag.id) ? "text-white" : "text-gray-600"
                  }`}
                >
                  {tag.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={tw`text-gray-400 text-sm`}>暂无标签，保存题目后可创建</Text>
        )}
      </View>

      {/* 解析 */}
      <View style={tw`px-4 mt-4`}>
        <Text style={tw`text-sm font-medium text-gray-500 mb-2`}>
          题目解析（选填）
        </Text>
        <TextInput
          style={tw`bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 min-h-[60px]`}
          placeholder="输入解析内容..."
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
          value={analysis}
          onChangeText={setAnalysis}
        />
      </View>

      {/* 保存按钮 */}
      <View style={tw`px-4 mt-6 mb-10`}>
        <TouchableOpacity
          style={tw`rounded-xl py-3.5 items-center ${
            isSaving ? "bg-primary-400" : "bg-primary-600"
          }`}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={tw`text-white font-semibold text-lg`}>
              {isEdit ? "保存修改" : "创建题目"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
