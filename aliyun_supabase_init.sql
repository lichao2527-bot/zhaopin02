-- =====================================================
-- 招聘系统数据库初始化脚本
-- 适用于阿里云自部署 Supabase 实例
-- =====================================================
--
-- 使用说明：
-- 1. 登录阿里云 Supabase 管理后台 (http://8.162.34.33:80)
-- 2. 进入 SQL Editor
-- 3. 复制并粘贴本脚本的全部内容
-- 4. 点击 "Run" 执行
--
-- =====================================================

-- =====================================================
-- 第一部分：创建表结构
-- =====================================================

-- 1. 创建 personas（人才画像）表
CREATE TABLE IF NOT EXISTS personas (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text DEFAULT '',
  responsibilities text DEFAULT '',
  knowledge text DEFAULT '',
  skills_detail text DEFAULT '',
  literacy text DEFAULT '',
  experience text DEFAULT '',
  warning_traits text DEFAULT '',
  core_tags text DEFAULT '',
  requirements jsonb DEFAULT '[]'::jsonb,
  skills jsonb DEFAULT '[]'::jsonb,
  ai_suggestions text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 2. 创建 jobs（岗位）表
CREATE TABLE IF NOT EXISTS jobs (
  id text PRIMARY KEY,
  title text NOT NULL,
  location text NOT NULL,
  salary text NOT NULL,
  persona_id text REFERENCES personas(id) ON DELETE CASCADE,
  status text DEFAULT '在招',
  created_at timestamptz DEFAULT now()
);

-- 3. 创建 candidates（候选人）表
CREATE TABLE IF NOT EXISTS candidates (
  id text PRIMARY KEY,
  name text NOT NULL,
  job_id text REFERENCES jobs(id) ON DELETE CASCADE,
  resume_url text DEFAULT '',
  full_resume_text text DEFAULT '',
  basic_info jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT '新申请',
  applied_at timestamptz DEFAULT now(),
  interviews jsonb DEFAULT '[]'::jsonb
);

-- =====================================================
-- 第二部分：创建索引以提高查询性能
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_jobs_persona_id ON jobs(persona_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);

-- =====================================================
-- 第三部分：启用行级安全 (RLS)
-- =====================================================

ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 第四部分：创建 RLS 策略（允许匿名用户完全访问）
-- =====================================================

-- personas 表的策略
CREATE POLICY "Allow anonymous read personas"
  ON personas FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert personas"
  ON personas FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update personas"
  ON personas FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete personas"
  ON personas FOR DELETE
  TO anon
  USING (true);

-- jobs 表的策略
CREATE POLICY "Allow anonymous read jobs"
  ON jobs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert jobs"
  ON jobs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update jobs"
  ON jobs FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete jobs"
  ON jobs FOR DELETE
  TO anon
  USING (true);

-- candidates 表的策略
CREATE POLICY "Allow anonymous read candidates"
  ON candidates FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert candidates"
  ON candidates FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update candidates"
  ON candidates FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete candidates"
  ON candidates FOR DELETE
  TO anon
  USING (true);

-- =====================================================
-- 完成！
-- =====================================================
--
-- 数据库初始化完成。现在你可以：
-- 1. 验证表是否创建成功：在 Table Editor 中查看
-- 2. 测试前端应用是否能正常连接
-- 3. 开始使用招聘系统
--
-- =====================================================
