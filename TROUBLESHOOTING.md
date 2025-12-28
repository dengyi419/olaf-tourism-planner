# 問題排查指南

## 問題 1：資料沒有保存到 Supabase

### 檢查步驟

1. **查看 Vercel 函數日誌**
   - 前往 Vercel Dashboard → Deployments → 最新部署
   - 點擊 "Functions" 標籤
   - 找到 `/api/trips` 函數
   - 查看日誌，應該看到：
     - `使用 Supabase 保存行程，用戶: xxx@example.com, 行程ID: trip-xxx`
     - `準備保存行程數據: {...}`
     - `行程創建成功: {...}` 或 `行程更新成功: {...}`

2. **檢查環境變數**
   - 確認 `SUPABASE_URL` 已設置
   - 確認 `SUPABASE_SERVICE_ROLE_KEY` 已設置（必須是 `service_role` key，不是 `anon` key）

3. **檢查 Supabase 表**
   - 前往 Supabase Dashboard → Table Editor → `trips` 表
   - 查看是否有新記錄
   - 確認 `user_email` 欄位有值

4. **檢查錯誤日誌**
   - 如果看到 `Supabase 插入錯誤`，查看錯誤詳情
   - 常見錯誤：
     - `relation "trips" does not exist` → 表未創建
     - `permission denied` → RLS 策略問題或使用了錯誤的 key
     - `duplicate key value` → ID 衝突

### 常見原因

1. **使用了 `anon` key 而不是 `service_role` key**
   - 解決方案：在 Supabase Dashboard → Settings → API 中複製 `service_role` key
   - 更新 Vercel 環境變數 `SUPABASE_SERVICE_ROLE_KEY`

2. **Supabase 客戶端初始化失敗**
   - 檢查日誌中是否有 `Supabase 客戶端初始化失敗`
   - 確認環境變數格式正確

3. **表結構不匹配**
   - 確認表已創建（執行 `supabase_setup_safe.sql`）
   - 確認欄位名稱正確（`user_email`, `created_at`, `updated_at`）

---

## 問題 2：可以看到其他人的資料

### 檢查步驟

1. **查看 API 日誌**
   - 在 Vercel 函數日誌中查看：
     - `GET /api/trips: 查詢用戶行程，email: xxx@example.com`
     - `返回 X 個行程給用戶: xxx@example.com`
   - 確認返回的行程數量是否正確

2. **檢查前端是否從 localStorage 載入**
   - 打開瀏覽器開發者工具（F12）
   - 前往 Application → Local Storage
   - 查看是否有 `travelgenie-storage` 鍵
   - 如果有，清除它：`localStorage.clear()`

3. **檢查用戶 session**
   - 確認當前登入的用戶 email
   - 確認 API 請求中的 `session.user.email` 是否正確

4. **檢查 Supabase 查詢**
   - 在 Supabase Dashboard → SQL Editor 中執行：
   ```sql
   SELECT id, user_email, name, created_at 
   FROM trips 
   ORDER BY updated_at DESC 
   LIMIT 10;
   ```
   - 確認每個行程的 `user_email` 是否正確

### 已實施的安全措施

1. **API 層面過濾**
   - 所有查詢都包含 `.eq('user_email', session.user.email)`
   - 更新和刪除操作都驗證用戶身份

2. **雙重驗證**
   - 在返回數據前再次過濾，確保只返回當前用戶的數據
   - 如果發現不屬於當前用戶的數據，會記錄錯誤日誌

3. **前端同步**
   - `TripList` 組件會從服務器同步數據
   - `MainMenu` 在登入時會同步數據

### 如果仍然看到其他用戶的數據

1. **清除瀏覽器緩存和 localStorage**
   ```javascript
   // 在瀏覽器控制台執行
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **檢查是否有多個用戶同時登入**
   - 確認每個用戶都使用不同的 Google 帳號登入
   - 確認 session 正確對應到當前用戶

3. **檢查 Supabase RLS 策略**
   - 雖然我們使用 `service_role` key 繞過 RLS，但確認策略正確設置
   - 在 Supabase Dashboard → Authentication → Policies 中檢查

---

## 調試命令

### 在瀏覽器控制台

```javascript
// 檢查當前 session
fetch('/api/auth/session').then(r => r.json()).then(console.log);

// 檢查行程數據
fetch('/api/trips').then(r => r.json()).then(console.log);

// 清除 localStorage
localStorage.clear();
```

### 在 Supabase SQL Editor

```sql
-- 查看所有行程
SELECT id, user_email, name, created_at, updated_at 
FROM trips 
ORDER BY updated_at DESC;

-- 查看特定用戶的行程
SELECT id, user_email, name, created_at, updated_at 
FROM trips 
WHERE user_email = 'your-email@example.com'
ORDER BY updated_at DESC;

-- 檢查是否有重複的行程 ID
SELECT id, COUNT(*) as count, array_agg(user_email) as users
FROM trips
GROUP BY id
HAVING COUNT(*) > 1;
```

---

## 聯繫支持

如果以上步驟都無法解決問題，請提供：

1. **Vercel 函數日誌**（從 Deployments → Functions）
2. **瀏覽器控制台錯誤**（F12 → Console）
3. **Network 請求響應**（F12 → Network → /api/trips）
4. **Supabase Dashboard 截圖**（Table Editor → trips 表）
5. **當前用戶 email**（用於驗證數據隔離）

