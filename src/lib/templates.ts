import * as Sharing from "expo-sharing";
import { Paths, File } from "expo-file-system";

const JSON_TEMPLATE = JSON.stringify(
  [
    {
      stem: "React Native 中用于布局的核心组件是什么？",
      type: "single_choice",
      options: [
        { id: "A", content: "View" },
        { id: "B", content: "Text" },
        { id: "C", content: "ScrollView" },
        { id: "D", content: "SafeAreaView" },
      ],
      answer: "A",
      analysis: "View 是 React Native 中最基础的布局容器组件。",
      difficulty: 1,
    },
    {
      stem: "以下哪些是 React Hook？（多选）",
      type: "multi_choice",
      options: [
        { id: "A", content: "useState" },
        { id: "B", content: "useEffect" },
        { id: "C", content: "componentDidMount" },
        { id: "D", content: "useCallback" },
      ],
      answer: ["A", "B", "D"],
      analysis: "componentDidMount 是类组件生命周期方法，不是 Hook。",
      difficulty: 2,
    },
    {
      stem: "TypeScript 是 JavaScript 的超集。",
      type: "true_false",
      options: null,
      answer: "true",
      analysis: "TypeScript 是 JavaScript 的类型超集，所有合法的 JS 代码也是合法的 TS 代码。",
      difficulty: 1,
    },
    {
      stem: "React 是由 ______ 公司开发的。",
      type: "fill_blank",
      options: null,
      answer: "Facebook/Meta",
      analysis: "React 最初由 Facebook（现 Meta）的 Jordan Walke 创建。",
      difficulty: 1,
    },
    {
      stem: "请简述虚拟 DOM 的工作原理。",
      type: "short_answer",
      options: null,
      answer: "虚拟 DOM 是真实 DOM 的轻量 JavaScript 对象表示。当状态变化时，React 先更新虚拟 DOM，然后通过 Diff 算法比较新旧虚拟 DOM 的差异，最后批量更新真实 DOM。",
      analysis: "核心要点：JS 对象模拟 → Diff 对比 → 批量更新。",
      difficulty: 2,
    },
  ],
  null,
  2
);

const CSV_TEMPLATE = `stem,type,A,B,C,D,answer,analysis,difficulty
React Native 中用于布局的核心组件是什么？,single_choice,View,Text,ScrollView,SafeAreaView,A,View 是 React Native 中最基础的布局容器组件。,1
以下哪些是 React Hook？（多选）,multi_choice,useState,useEffect,componentDidMount,useCallback,"A,B,D",componentDidMount 是类组件生命周期方法不是 Hook。,2
TypeScript 是 JavaScript 的超集。,true_false,,,,,true,TypeScript 是 JavaScript 的类型超集。,1
React 是由什么公司开发的？,fill_blank,,,,,Facebook/Meta,React 最初由 Facebook 创建。,1`;

export async function downloadTemplate(format: "json" | "csv"): Promise<void> {
  const fileName = format === "json" ? "quiz_template.json" : "quiz_template.csv";
  const content = format === "json" ? JSON_TEMPLATE : CSV_TEMPLATE;
  const mimeType = format === "json" ? "application/json" : "text/csv";

  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(content);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, { mimeType });
  }
}
