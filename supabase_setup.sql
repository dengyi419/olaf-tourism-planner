-- Supabase 資料庫設置 SQL
-- 如果表已存在，會先刪除再重建

-- 刪除現有的表（如果存在）
DROP TABLE IF EXISTS trips CASCADE;

-- 創建 trips 表
CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  settings JSONB NOT NULL,
  itinerary JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引以提高查詢性能
CREATE INDEX idx_trips_user_email ON trips(user_email);
CREATE INDEX idx_trips_updated_at ON trips(updated_at DESC);

-- 啟用 Row Level Security (RLS)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- 刪除現有策略（如果存在）
DROP POLICY IF EXISTS "Users can view own trips" ON trips;
DROP POLICY IF EXISTS "Users can insert own trips" ON trips;
DROP POLICY IF EXISTS "Users can update own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON trips;

-- 創建策略：用戶只能訪問自己的行程
-- 注意：如果使用 NextAuth，auth.email() 可能不可用，我們會在 API 層面驗證
CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  USING (true); -- 暫時允許所有查詢，在 API 層面驗證

CREATE POLICY "Users can insert own trips"
  ON trips FOR INSERT
  WITH CHECK (true); -- 暫時允許所有插入，在 API 層面驗證

CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  USING (true); -- 暫時允許所有更新，在 API 層面驗證

CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  USING (true); -- 暫時允許所有刪除，在 API 層面驗證

