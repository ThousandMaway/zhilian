import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { question, userAnswer, referenceAnswer } = await req.json();

    if (!question || !userAnswer || !referenceAnswer) {
      return new Response(
        JSON.stringify({ error: "缺少参数" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 验证用户身份
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "未登录" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "未登录" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY") ||
                   Deno.env.get("DEEPSEEK_API_KEY");
    const baseURL = Deno.env.get("AI_BASE_URL") ||
                    "https://api.openai.com/v1";
    const model = Deno.env.get("AI_MODEL") || "gpt-4o-mini";

    const aiRes = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `你是一个严格的阅卷老师。根据参考答案评价学生的回答质量。
返回纯 JSON（不要 markdown 代码块）：
{
  "score": 0-100 的整数,
  "comment": "简短的评语，30字以内",
  "isCorrect": true/false
}`,
          },
          {
            role: "user",
            content: `题目：${question}\n参考答案：${referenceAnswer}\n学生回答：${userAnswer}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!aiRes.ok) {
      throw new Error(`AI API error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // 解析 JSON，容错处理
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      // 尝试提取 JSON
      const match = content.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : null;
    }

    if (!result || typeof result.score !== "number") {
      throw new Error("AI 返回格式异常");
    }

    return new Response(
      JSON.stringify({
        score: result.score,
        comment: result.comment || "",
        isCorrect: result.isCorrect ?? result.score >= 60,
        source: "ai",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("AI evaluate error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "AI 服务暂不可用",
        fallback: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
