# Supabase 安全修復說明

## 修復的問題

### 1. 分享連結按鈕錯誤

**問題**：在 `app/history/page.tsx` 中，`handleShareTrip` 函數使用了 `currentTrip` 變數，但該變數在函數定義之後才聲明，導致運行時錯誤。

**修復**：將 `currentTrip` 的聲明移到 `handleShareTrip` 函數之前，確保函數可以正確訪問該變數。

### 2. Supabase 安全警告修復

#### 2.1 Function Search Path Mutable

**問題**：PostgreSQL 函數沒有設置 `search_path`，可能導致 SQL 注入攻擊。

**修復**：為以下函數添加了 `SET search_path` 參數：
- `cleanup_expired_shared_trips()`：設置 `search_path = public, pg_temp`
- `update_updated_at_column()`：設置 `search_path = public, pg_temp`

**說明**：
- `SECURITY DEFINER`：函數以定義者的權限執行
- `SET search_path`：限制函數可以訪問的 schema，防止惡意代碼注入

#### 2.2 RLS Policy Always True

**問題**：多個 RLS 策略使用了 `USING (true)` 或 `WITH CHECK (true)`，這意味著策略過於寬鬆，實際上沒有提供安全保護。

**修復**：

##### `shared_trips` 表

**INSERT 策略**：
```sql
CREATE POLICY "Authenticated users can create shared trips"
  ON shared_trips FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' OR auth.role() = 'service_role'
  );
```

**說明**：
- 檢查用戶是否已認證（`authenticated`）或使用服務角色（`service_role`）
- 實際的安全控制由 API 層面的 session 驗證提供
- 這個策略主要用於滿足 RLS 要求

##### `users` 表

**SELECT 策略**：
```sql
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND auth.jwt() ->> 'email' = email)
  );
```

**UPDATE 策略**：
```sql
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND auth.jwt() ->> 'email' = email)
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND auth.jwt() ->> 'email' = email)
  );
```

**ALL 策略（Service Role）**：
```sql
CREATE POLICY "Service role can manage users"
  ON users FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

**說明**：
- 用戶只能查看和更新自己的資料（通過 JWT 中的 email 驗證）
- `service_role` 可以管理所有用戶（用於後端 API 自動創建/更新）
- `auth.jwt() ->> 'email'`：從 JWT token 中提取 email

## 重要注意事項

### Service Role 和 RLS

**重要**：當使用 `service_role` key（在 API 路由中）時，RLS 策略實際上會被繞過。這是 Supabase 的預期行為：

- `service_role` key 擁有完整的數據庫訪問權限
- 這允許後端 API 自動創建/更新用戶，無需通過 RLS 檢查
- **實際的安全控制由 API 層面的 session 驗證提供**

### 安全架構

本專案採用**雙層安全架構**：

1. **API 層面**：
   - 使用 NextAuth.js 驗證 session
   - 檢查 `session?.user?.email` 是否存在
   - 只有已登入用戶才能創建分享連結

2. **數據庫層面**：
   - RLS 策略提供額外的安全保護
   - 防止直接數據庫訪問繞過 API 層
   - 對於使用 `service_role` 的後端操作，RLS 會被繞過（這是預期的）

### 如何應用這些修復

1. **在 Supabase Dashboard 中執行 SQL**：
   - 打開 Supabase Dashboard
   - 進入 SQL Editor
   - 執行更新後的 SQL 文件：
     - `supabase_shared_trips_setup.sql`
     - `supabase_users_setup.sql`

2. **驗證修復**：
   - 在 Supabase Dashboard 中檢查 Database Linter
   - 確認所有警告都已解決

3. **測試功能**：
   - 測試分享連結功能是否正常
   - 測試用戶登入和資料保存功能

## 參考資料

- [Supabase RLS 文檔](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL search_path 安全](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)

