-- Supabase 分享行程表設置 SQL
-- 用於儲存可分享的行程連結

-- 創建 shared_trips 表
CREATE TABLE IF NOT EXISTS shared_trips (
  share_id TEXT PRIMARY KEY,
  trip_id TEXT,
  name TEXT NOT NULL,
  settings JSONB NOT NULL,
  itinerary JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_shared_trips_share_id ON shared_trips(share_id);
CREATE INDEX IF NOT EXISTS idx_shared_trips_expires_at ON shared_trips(expires_at);

-- 啟用 Row Level Security (RLS)
ALTER TABLE shared_trips ENABLE ROW LEVEL SECURITY;

-- 刪除現有策略（如果存在）
DROP POLICY IF EXISTS "Anyone can view shared trips" ON shared_trips;
DROP POLICY IF EXISTS "Authenticated users can create shared trips" ON shared_trips;

-- 創建策略：任何人都可以查看分享的行程（公開訪問）
CREATE POLICY "Anyone can view shared trips"
  ON shared_trips FOR SELECT
  USING (true);

-- 創建策略：已認證用戶可以創建分享連結
CREATE POLICY "Authenticated users can create shared trips"
  ON shared_trips FOR INSERT
  WITH CHECK (true); -- 在 API 層面驗證用戶身份

-- 可選：創建一個函數來自動清理過期的分享連結
CREATE OR REPLACE FUNCTION cleanup_expired_shared_trips()
RETURNS void AS $$
BEGIN
  DELETE FROM shared_trips
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

