/*
  # 招聘系统数据库架构

  ## 新建表
  
  ### 1. jobs（岗位表）
    - `id` (text, primary key) - 岗位唯一标识
    - `title` (text) - 岗位标题
    - `location` (text) - 工作地点
    - `salary` (text) - 薪资范围
    - `persona_id` (text) - 关联画像ID
    - `created_at` (timestamptz) - 创建时间
    - `status` (text) - 状态：'在招' | '已结束'

  ### 2. personas（人才画像表）
    - `id` (text, primary key) - 画像唯一标识
    - `title` (text) - 画像标题
    - `description` (text) - 描述
    - `responsibilities` (text) - 岗位职责
    - `knowledge` (text) - 知识要求
    - `skills_detail` (text) - 技能详情
    - `literacy` (text) - 素养要求
    - `experience` (text) - 经验要求
    - `warning_traits` (text) - 警惕特质
    - `core_tags` (text) - 核心标签
    - `requirements` (jsonb) - 要求列表
    - `skills` (jsonb) - 技能列表
    - `ai_suggestions` (text) - AI建议

  ### 3. candidates（候选人表）
    - `id` (text, primary key) - 候选人唯一标识
    - `name` (text) - 姓名
    - `job_id` (text) - 关联岗位ID
    - `resume_url` (text) - 简历URL
    - `full_resume_text` (text) - 简历全文
    - `basic_info` (jsonb) - 基础信息
    - `status` (text) - 状态
    - `applied_at` (timestamptz) - 申请时间
    - `interviews` (jsonb) - 面试记录数组

  ## 安全配置
    - 所有表启用 RLS
    - 匿名用户可读写所有数据（适用于演示环境）
*/

-- 创建 personas 表
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

-- 创建 jobs 表
CREATE TABLE IF NOT EXISTS jobs (
  id text PRIMARY KEY,
  title text NOT NULL,
  location text NOT NULL,
  salary text NOT NULL,
  persona_id text REFERENCES personas(id) ON DELETE CASCADE,
  status text DEFAULT '在招',
  created_at timestamptz DEFAULT now()
);

-- 创建 candidates 表
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

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_jobs_persona_id ON jobs(persona_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);

-- 启用 RLS
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- 为匿名用户创建完全访问策略（演示环境）
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