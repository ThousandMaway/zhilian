-- AI 用量追踪表
-- 用于限制每人每天的 AI 评分次数

CREATE TABLE IF NOT EXISTS ai_usage (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, date);

-- RLS 策略
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai_usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert ai_usage" ON ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
