-- Supabase 用戶表設置 SQL
-- 用於保存所有使用 OAuth 登入的用戶信息

-- 創建 users 表
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  name TEXT,
  picture TEXT,
  provider TEXT DEFAULT 'google',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at DESC);

-- 啟用 Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 刪除現有策略（如果存在）
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

-- 創建策略：用戶可以查看自己的資料
-- 使用 auth.jwt() 來驗證用戶身份
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (
    -- 允許服務角色（後端使用）或當前用戶查看自己的資料
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND auth.jwt() ->> 'email' = email)
  );

-- 創建策略：用戶可以更新自己的資料
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (
    -- 允許服務角色（後端使用）或當前用戶更新自己的資料
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND auth.jwt() ->> 'email' = email)
  )
  WITH CHECK (
    -- 確保用戶只能更新自己的資料
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND auth.jwt() ->> 'email' = email)
  );

-- 創建策略：服務角色可以管理所有用戶（用於後端自動創建/更新）
-- 這個策略只允許 service_role 使用，用於後端 API 自動創建/更新用戶
CREATE POLICY "Service role can manage users"
  ON users FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 創建更新 updated_at 的觸發器函數
-- 設置 search_path 以防止 SQL 注入攻擊
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 創建觸發器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

