-- 智练 (Quiz App) 数据库迁移
-- Supabase PostgreSQL

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 题目表
-- ============================================================
CREATE TYPE question_type AS ENUM (
  'single_choice',
  'multi_choice',
  'true_false',
  'fill_blank',
  'short_answer'
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type question_type NOT NULL,
  stem TEXT NOT NULL,
  options JSONB,            -- [{"id":"A","content":"选项内容"},...]
  answer JSONB NOT NULL,    -- 单选"\"A\"", 多选"[\"A\",\"C\"]", 判断"true", 填空/简答为文本
  analysis TEXT,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_questions_user_id ON questions(user_id);
CREATE INDEX idx_questions_type ON questions(type);

-- ============================================================
-- 标签表
-- ============================================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  UNIQUE(user_id, name)
);

CREATE INDEX idx_tags_user_id ON tags(user_id);

-- ============================================================
-- 题目-标签关联表
-- ============================================================
CREATE TABLE question_tags (
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, tag_id)
);

-- ============================================================
-- 试卷表
-- ============================================================
CREATE TABLE papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_papers_user_id ON papers(user_id);

-- ============================================================
-- 试卷-题目关联表
-- ============================================================
CREATE TABLE paper_questions (
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (paper_id, question_id)
);

-- ============================================================
-- 答题记录表
-- ============================================================
CREATE TABLE practice_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  paper_id UUID REFERENCES papers(id) ON DELETE SET NULL,
  user_answer JSONB,
  is_correct BOOLEAN,       -- 简答题可能为 null（待批改）
  time_spent INTEGER DEFAULT 0, -- 秒
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_practice_records_user_id ON practice_records(user_id);
CREATE INDEX idx_practice_records_question_id ON practice_records(question_id);
CREATE INDEX idx_practice_records_created_at ON practice_records(created_at);

-- ============================================================
-- 错题表
-- ============================================================
CREATE TABLE wrong_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  wrong_count INTEGER DEFAULT 1,
  last_wrong_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_wrong_questions_user_id ON wrong_questions(user_id);

-- ============================================================
-- 收藏表
-- ============================================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- ============================================================
-- 每日打卡表
-- ============================================================
CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  question_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_checkins_user_id ON daily_checkins(user_id);

-- ============================================================
-- 用户笔记表
-- ============================================================
CREATE TABLE user_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX idx_user_notes_question_id ON user_notes(question_id);

-- ============================================================
-- RLS 策略：用户只能访问自己的数据
-- ============================================================
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wrong_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- 通用 RLS 策略宏（user_id = auth.uid()）
CREATE POLICY "Users can manage own questions" ON questions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tags" ON tags FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own papers" ON papers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own practice_records" ON practice_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own wrong_questions" ON wrong_questions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own daily_checkins" ON daily_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own user_notes" ON user_notes FOR ALL USING (auth.uid() = user_id);

-- question_tags 和 paper_questions 的 RLS 通过关联表检查
CREATE POLICY "Users can manage own question_tags" ON question_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM questions WHERE questions.id = question_id AND questions.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own paper_questions" ON paper_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM papers WHERE papers.id = paper_id AND papers.user_id = auth.uid())
  );

-- ============================================================
-- 自动更新 updated_at 触发器
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_user_notes_updated_at BEFORE UPDATE ON user_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
