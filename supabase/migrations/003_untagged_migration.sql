-- 将已有无标签题目归入"未分类"标签
-- 在 Supabase SQL Editor 中执行

DO $$
DECLARE
  uid UUID;
  tag_id UUID;
BEGIN
  -- 遍历所有用户
  FOR uid IN SELECT id FROM auth.users LOOP
    -- 检查该用户是否有"未分类"标签，没有则创建
    SELECT id INTO tag_id FROM tags WHERE user_id = uid AND name = '未分类';
    
    IF tag_id IS NULL THEN
      INSERT INTO tags (user_id, name, color) VALUES (uid, '未分类', '#6b7280')
      RETURNING id INTO tag_id;
    END IF;

    -- 将无标签题目关联到"未分类"
    INSERT INTO question_tags (question_id, tag_id)
    SELECT q.id, tag_id
    FROM questions q
    WHERE q.user_id = uid
      AND NOT EXISTS (
        SELECT 1 FROM question_tags qt WHERE qt.question_id = q.id
      )
    ON CONFLICT (question_id, tag_id) DO NOTHING;
  END LOOP;
END $$;
