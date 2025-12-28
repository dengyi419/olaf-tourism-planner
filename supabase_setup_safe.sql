-- Supabase 資料庫設置 SQL（安全版本 - 不刪除現有數據）
-- 如果表已存在，只創建缺失的索引和策略

-- 創建 trips 表（如果不存在）
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  settings JSONB NOT NULL,
  itinerary JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_trips_user_email ON trips(user_email);
CREATE INDEX IF NOT EXISTS idx_trips_updated_at ON trips(updated_at DESC);

-- 啟用 Row Level Security (RLS)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- 刪除現有策略（如果存在）
DROP POLICY IF EXISTS "Users can view own trips" ON trips;
DROP POLICY IF EXISTS "Users can insert own trips" ON trips;
DROP POLICY IF EXISTS "Users can update own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON trips;

-- 創建策略：用戶只能訪問自己的行程
-- 注意：由於使用 NextAuth，我們在 API 層面驗證用戶身份
CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  USING (true); -- API 層面會驗證 user_email

CREATE POLICY "Users can insert own trips"
  ON trips FOR INSERT
  WITH CHECK (true); -- API 層面會驗證 user_email

CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  USING (true); -- API 層面會驗證 user_email

CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  USING (true); -- API 層面會驗證 user_email

