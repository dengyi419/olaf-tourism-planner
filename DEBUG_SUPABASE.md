# Supabase 調試指南

## 🔍 問題排查步驟

### 問題 1：資料沒有保存到 Supabase

#### 步驟 1：檢查環境變數

在 Vercel Dashboard 中確認：
- `SUPABASE_URL` 已設置（格式：`https://xxxxx.supabase.co`）
- `SUPABASE_SERVICE_ROLE_KEY` 已設置（以 `eyJ` 開頭的長字符串）

**重要**：必須使用 `service_role` key，不是 `anon` key！

**如何確認是 service_role key**：
1. 前往 Supabase Dashboard → Settings → API
2. 找到 "service_role" key（通常在 "Project API keys" 區域的最下方）
3. 複製這個 key（不是 "anon" key）
4. 可以通過 JWT 解碼驗證：如果 JWT payload 中的 `"role"` 是 `"service_role"`，那就是正確的

**錯誤示例**：如果 JWT payload 顯示 `"role":"anon"`，那就是錯誤的 key！

#### 步驟 2：檢查 Vercel 日誌

1. 前往 Vercel Dashboard → Deployments → 最新部署
2. 點擊「Functions」標籤
3. 找到 `/api/trips` 函數
4. 查看日誌，應該能看到：
   - `Supabase 客戶端初始化成功` 或 `Supabase 環境變數未設置`
   - `使用 Supabase 保存行程` 或 `Supabase 未配置，使用內存存儲`
   - 如果有錯誤，會顯示詳細錯誤訊息

#### 步驟 3：測試 API

在瀏覽器開發者工具中：

1. 打開 Network 標籤
2. 創建一個行程並保存
3. 找到 `/api/trips` 的 POST 請求
4. 查看 Response，確認是否成功
5. 如果有錯誤，查看錯誤訊息

#### 步驟 4：直接測試 Supabase 連接

在 Supabase Dashboard → SQL Editor 中執行：

```sql
-- 查看所有行程（測試用）
SELECT id, user_email, name, created_at, updated_at 
FROM trips 
ORDER BY updated_at DESC 
LIMIT 10;
```

如果沒有資料，可能是：
- 環境變數未正確設置
- Supabase 客戶端初始化失敗
- 插入操作失敗但沒有拋出錯誤

---

### 問題 2：用戶可以看到其他人的資料

#### 檢查點 1：確認查詢過濾

所有查詢都應該包含 `.eq('user_email', session.user.email)`

已確認的代碼位置：
- ✅ GET `/api/trips` - 已過濾
- ✅ POST `/api/trips` - 已過濾（檢查和更新/插入）
- ✅ DELETE `/api/trips` - 已過濾

#### 檢查點 2：檢查前端是否正確載入

前端應該只顯示從 `/api/trips` 獲取的數據，該 API 已經過濾了用戶。

#### 檢查點 3：檢查 localStorage

如果前端從 localStorage 載入舊數據，可能會顯示其他用戶的數據。

**解決方案**：清除瀏覽器 localStorage：
```javascript
// 在瀏覽器控制台執行
localStorage.clear();
```

---

## 🛠️ 手動測試步驟

### 測試 1：檢查 Supabase 連接

在 Vercel 函數日誌中應該看到：
```
Supabase 客戶端初始化成功，URL: https://...
```

如果看到：
```
Supabase 環境變數未設置
```
→ 需要設置環境變數

### 測試 2：檢查保存操作

創建行程時，日誌應該顯示：
```
使用 Supabase 保存行程，用戶: user@example.com, 行程ID: trip-1234567890
創建新行程: trip-1234567890
行程創建成功: trip-1234567890
```

如果看到：
```
Supabase 未配置，使用內存存儲
```
→ Supabase 未正確初始化

### 測試 3：檢查查詢操作

查看行程時，日誌應該顯示：
```
使用 Supabase 查詢行程，用戶: user@example.com
Supabase 查詢成功，找到 X 個行程
```

---

## 🔧 常見問題修復

### 問題 A：環境變數未設置

**症狀**：日誌顯示「Supabase 環境變數未設置」

**解決方案**：
1. 在 Vercel Dashboard → Settings → Environment Variables
2. 確認 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 已設置
3. 確認使用的是 `service_role` key（不是 `anon` key）
4. 重新部署應用

### 問題 B：Supabase 初始化失敗

**症狀**：日誌顯示「Supabase 客戶端初始化失敗」

**解決方案**：
1. 檢查 `SUPABASE_URL` 格式是否正確
2. 檢查 `SUPABASE_SERVICE_ROLE_KEY` 是否完整
3. 確認 Supabase 專案狀態正常

### 問題 C：插入失敗但沒有錯誤

**症狀**：資料沒有保存，但沒有錯誤訊息

**解決方案**：
1. 檢查 Supabase Dashboard → Logs
2. 查看是否有 RLS 策略阻止插入
3. 確認表結構正確（特別是 `user_email` 欄位）

### 問題 D：用戶可以看到其他人的資料

**症狀**：用戶 A 可以看到用戶 B 的行程

**解決方案**：
1. 確認所有 API 查詢都包含 `.eq('user_email', session.user.email)`
2. 清除瀏覽器 localStorage
3. 檢查前端是否從正確的 API 載入數據

---

## 📋 檢查清單

- [ ] Vercel 環境變數已設置
- [ ] 使用的是 `service_role` key（不是 `anon` key）
- [ ] Supabase 表已創建
- [ ] RLS 策略已設置（雖然我們在 API 層面驗證）
- [ ] 已重新部署應用
- [ ] 檢查 Vercel 日誌確認 Supabase 已初始化
- [ ] 測試創建行程，檢查 Supabase 是否有記錄
- [ ] 測試不同用戶，確認數據隔離

---

## 🆘 如果仍然無法解決

請提供以下信息：

1. **Vercel 函數日誌**（從 Deployments → Functions）
2. **瀏覽器控制台錯誤**（F12 → Console）
3. **Network 請求響應**（F12 → Network → /api/trips）
4. **Supabase Dashboard 截圖**（Table Editor → trips 表）

這樣我可以更準確地診斷問題。

