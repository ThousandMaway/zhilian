import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { FileUp, CheckCircle2, AlertTriangle, Download } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import Papa from "papaparse";
import { QuestionType, QuestionTypeLabel } from "~/types";
import { useBulkImportQuestions } from "~/queries/questions";
import { downloadTemplate } from "~/lib/templates";
import { parseDocxText } from "~/lib/docx-parser";
import mammoth from "mammoth";
import tw from "~/lib/tw";

interface ParsedQuestion {
  type: QuestionType;
  stem: string;
  options: { id: string; content: string }[] | null;
  answer: string | string[];
  analysis: string | null;
  difficulty: number;
}

export default function ImportQuestionsScreen({ navigation }: any) {
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [fileName, setFileName] = useState("");
  const [tagName, setTagName] = useState("");
  const [parseError, setParseError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const importMutation = useBulkImportQuestions();

  const typeMap: Record<string, QuestionType> = {
    单选: QuestionType.SINGLE_CHOICE,
    单选题: QuestionType.SINGLE_CHOICE,
    single_choice: QuestionType.SINGLE_CHOICE,
    single: QuestionType.SINGLE_CHOICE,
    多选: QuestionType.MULTI_CHOICE,
    多选题: QuestionType.MULTI_CHOICE,
    multi_choice: QuestionType.MULTI_CHOICE,
    multi: QuestionType.MULTI_CHOICE,
    判断: QuestionType.TRUE_FALSE,
    判断题: QuestionType.TRUE_FALSE,
    true_false: QuestionType.TRUE_FALSE,
    bool: QuestionType.TRUE_FALSE,
    填空: QuestionType.FILL_BLANK,
    填空题: QuestionType.FILL_BLANK,
    fill_blank: QuestionType.FILL_BLANK,
    fill: QuestionType.FILL_BLANK,
    简答: QuestionType.SHORT_ANSWER,
    简答题: QuestionType.SHORT_ANSWER,
    short_answer: QuestionType.SHORT_ANSWER,
    short: QuestionType.SHORT_ANSWER,
  };

  const parseJSON = (text: string): ParsedQuestion[] => {
    const data = JSON.parse(text);
    const questions = Array.isArray(data) ? data : data.questions || [];
    return questions.map((q: any, i: number) => {
      const type = typeMap[q.type || q.题型] || QuestionType.SINGLE_CHOICE;
      let options = null;
      if (q.options || q.选项) {
        const rawOptions = q.options || q.选项;
        options = Array.isArray(rawOptions)
          ? rawOptions.map((o: any, idx: number) => ({
              id: typeof o === "string" ? String.fromCharCode(65 + idx) : o.id || String.fromCharCode(65 + idx),
              content: typeof o === "string" ? o : o.content || o.text || "",
            }))
          : [];
      }
      const answer = q.answer ?? q.答案 ?? "";
      const analysis = q.analysis ?? q.解析 ?? null;
      const difficulty = q.difficulty ?? q.难度 ?? 1;
      return { type, stem: q.stem || q.题干 || `题目 ${i + 1}`, options, answer, analysis, difficulty };
    });
  };

  const parseCSV = (text: string): ParsedQuestion[] => {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    if (result.errors.length > 0) throw new Error(`CSV 解析错误: ${result.errors[0].message}`);
    return result.data.map((row: any) => {
      const rawType = row.type || row.题型 || "single_choice";
      const type = typeMap[rawType] || QuestionType.SINGLE_CHOICE;
      let options = null;
      const needsOptions = [QuestionType.SINGLE_CHOICE, QuestionType.MULTI_CHOICE].includes(type);
      if (needsOptions) {
        const optionKeys = ["A", "B", "C", "D", "E", "F", "G", "H"];
        options = optionKeys
          .filter((key) => row[key] || row[`选项${key}`])
          .map((key) => ({ id: key, content: row[key] || row[`选项${key}`] || "" }));
      }
      const answer = row.answer || row.答案 || "";
      return {
        type,
        stem: row.stem || row.题干 || "",
        options: options && options.length >= 2 ? options : null,
        answer: type === QuestionType.MULTI_CHOICE ? answer.split(/[,，]/).map((s: string) => s.trim()) : answer,
        analysis: row.analysis || row.解析 || null,
        difficulty: parseInt(row.difficulty || row.难度 || "1", 10) || 1,
      };
    });
  };

  const handlePickFile = async () => {
    setParseError("");
    setParsedQuestions([]);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/json",
          "text/csv",
          "text/comma-separated-values",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      setFileName(file.name);
      // 用文件名（去掉扩展名）作为标签名
      setTagName(file.name.replace(/\.[^.]+$/, ""));
      setIsParsing(true);
      const response = await fetch(file.uri);
      const isDOCX = file.name.endsWith(".docx");
      let questions: ParsedQuestion[];
      if (isDOCX) {
        const arrayBuffer = await response.arrayBuffer();
        const mammothResult = await mammoth.extractRawText({ arrayBuffer });
        questions = parseDocxText(mammothResult.value);
        if (questions.length === 0) {
          setParseError("未能从文档中识别出题目，请确认文档格式");
          setIsParsing(false);
          return;
        }
      } else {
        const content = await response.text();
        questions = file.name.endsWith(".json") ? parseJSON(content) : parseCSV(content);
      }
      if (questions.length === 0) {
        setParseError("文件中未找到有效题目");
      } else {
        setParsedQuestions(questions);
      }
    } catch (err: any) {
      setParseError(err.message || "文件解析失败");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedQuestions.length === 0) return;
    Alert.alert("确认导入", `即将导入 ${parsedQuestions.length} 道题目，确认继续？`, [
      { text: "取消", style: "cancel" },
      {
        text: "导入",
        onPress: async () => {
          try {
            await importMutation.mutateAsync({ questions: parsedQuestions, tagName });
            Alert.alert("导入成功", `成功导入 ${parsedQuestions.length} 道题目`, [
              { text: "好的", onPress: () => navigation.goBack() },
            ]);
          } catch (err: any) {
            Alert.alert("导入失败", err.message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      <View style={tw`px-4 pt-4`}>
        {/* 选择文件 */}
        <TouchableOpacity
          style={tw`border-2 border-dashed border-gray-300 rounded-2xl p-8 items-center`}
          onPress={handlePickFile}
        >
          <FileUp size={40} color="#9ca3af" />
          <Text style={tw`text-gray-500 mt-3 font-medium`}>
            {fileName ? fileName : "点击选择 JSON / CSV / DOCX 文件"}
          </Text>
          <Text style={tw`text-gray-400 text-sm mt-1`}>
            支持 .json / .csv / .docx 格式
          </Text>
        </TouchableOpacity>

        {/* 模板下载 */}
        <View style={tw`mt-6 flex-row gap-3`}>
          <TouchableOpacity
            style={tw`flex-1 flex-row items-center justify-center bg-white rounded-xl py-3 border border-gray-200`}
            onPress={() => downloadTemplate("json")}
          >
            <Download size={16} color="#3b82f6" />
            <Text style={tw`text-primary-600 ml-1.5 text-sm font-medium`}>JSON 模板</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`flex-1 flex-row items-center justify-center bg-white rounded-xl py-3 border border-gray-200`}
            onPress={() => downloadTemplate("csv")}
          >
            <Download size={16} color="#3b82f6" />
            <Text style={tw`text-primary-600 ml-1.5 text-sm font-medium`}>CSV 模板</Text>
          </TouchableOpacity>
        </View>

        {/* 格式说明 */}
        <View style={tw`mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100`}>
          <Text style={tw`text-blue-700 font-semibold text-sm mb-2`}>
            📋 支持的文件格式
          </Text>
          <Text style={tw`text-blue-600 text-xs leading-5`}>
            JSON: 数组格式，每项包含 stem/题干、type/题型、options/选项、answer/答案字段{"\n"}
            CSV: 表头包含 stem、type、A~H（选项列）、answer、analysis{"\n"}
            DOCX: 智能解析，自动识别题干+选项+答案+解析{"\n"}
            题型支持：单选/多选/判断/填空/简答{"\n"}
            点击上方按钮下载模板参考格式
          </Text>
        </View>

        {/* 解析状态 */}
        {isParsing && (
          <View style={tw`items-center mt-6`}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={tw`text-gray-500 mt-2`}>正在解析文件...</Text>
          </View>
        )}

        {parseError !== "" && (
          <View style={tw`mt-4 bg-red-50 rounded-xl p-4 border border-red-200 flex-row items-start`}>
            <AlertTriangle size={18} color="#ef4444" />
            <Text style={tw`text-red-600 ml-2 flex-1 text-sm`}>{parseError}</Text>
          </View>
        )}

        {/* 预览列表 */}
        {parsedQuestions.length > 0 && (
          <>
            <View style={tw`mt-4 flex-row items-center`}>
              <CheckCircle2 size={18} color="#22c55e" />
              <Text style={tw`text-green-600 ml-1.5 font-medium`}>
                解析成功，共 {parsedQuestions.length} 题
              </Text>
            </View>

            {/* 标签名输入 */}
            <View style={tw`mt-3`}>
              <Text style={tw`text-sm font-medium text-gray-500 mb-1.5`}>
                导入到哪个题库？不填以文件名作为标签
              </Text>
              <TextInput
                style={tw`bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900`}
                placeholder={fileName.replace(/\.[^.]+$/, "")}
                placeholderTextColor="#9ca3af"
                value={tagName}
                onChangeText={setTagName}
              />
            </View>

            <View style={tw`mt-3`}>
              {parsedQuestions.slice(0, 5).map((q, idx) => (
                <View key={idx} style={tw`bg-gray-50 rounded-xl p-3 mb-2 border border-gray-100`}>
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`bg-primary-100 rounded px-2 py-0.5`}>
                      <Text style={tw`text-primary-600 text-xs`}>
                        {QuestionTypeLabel[q.type]?.slice(0, 2) || "?"}
                      </Text>
                    </View>
                    <Text style={tw`text-gray-800 ml-2 flex-1 text-sm`} numberOfLines={1}>
                      {q.stem}
                    </Text>
                  </View>
                </View>
              ))}
              {parsedQuestions.length > 5 && (
                <Text style={tw`text-gray-400 text-xs text-center mt-1`}>
                  ... 还有 {parsedQuestions.length - 5} 题
                </Text>
              )}
            </View>

            {/* 导入按钮 */}
            <TouchableOpacity
              style={tw`mt-4 mb-10 rounded-xl py-3.5 items-center ${
                importMutation.isPending ? "bg-primary-400" : "bg-primary-600"
              }`}
              onPress={handleImport}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-white font-semibold text-lg`}>
                  导入全部 {parsedQuestions.length} 题
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {parsedQuestions.length === 0 && !isParsing && !parseError && (
          <View style={tw`items-center py-10`}>
            <Text style={tw`text-gray-300 text-sm`}>
              选择文件后，题目将在此预览
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
