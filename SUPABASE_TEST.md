# Supabase 設置驗證和測試指南

## ✅ 設置檢查清單

請確認以下項目已完成：

- [ ] Supabase 專案已創建
- [ ] `trips` 表已創建（執行 SQL）
- [ ] 索引已創建
- [ ] RLS 策略已設置
- [ ] Vercel 環境變數已設置：
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] 代碼已更新（已推送）

---

## 🧪 測試步驟

### 1. 檢查環境變數

在 Vercel Dashboard 中確認：
- `SUPABASE_URL` 已設置（格式：`https://xxxxx.supabase.co`）
- `SUPABASE_SERVICE_ROLE_KEY` 已設置（以 `eyJ` 開頭的長字符串）

### 2. 重新部署

在 Vercel 中重新部署應用，確保環境變數生效。

### 3. 測試功能

#### 測試 1：創建行程
1. 登入應用
2. 創建一個新行程或使用 AI 生成行程
3. 點擊「儲存」
4. 檢查 Supabase Dashboard → Table Editor → `trips` 表
5. 應該能看到新創建的行程記錄

#### 測試 2：查看行程
1. 在主選單左側應該能看到所有行程
2. 在「查看行程記錄」頁面應該能看到保存的行程

#### 測試 3：修改行程
1. 在「查看行程記錄」中選擇一個行程
2. 修改花費
3. 等待自動保存或點擊「儲存」
4. 檢查 Supabase 中該行程的 `updated_at` 是否更新

#### 測試 4：刪除行程
1. 在「查看行程記錄」中刪除一個行程
2. 檢查 Supabase 中該行程是否被刪除

#### 測試 5：多用戶隔離
1. 使用不同的 Google 帳號登入
2. 創建行程
3. 確認每個用戶只能看到自己的行程

---

## 🔍 驗證 Supabase 連接

### 方法 1：檢查 Vercel 日誌

1. 前往 Vercel Dashboard
2. 點擊「Deployments」→ 最新部署 → 「Functions」標籤
3. 查看 `/api/trips` 的日誌
4. 如果看到 Supabase 相關錯誤，檢查環境變數

### 方法 2：檢查瀏覽器控制台

1. 打開瀏覽器開發者工具（F12）
2. 前往「Network」標籤
3. 創建或查看行程
4. 檢查 `/api/trips` 請求的響應
5. 確認返回的數據格式正確

### 方法 3：直接查詢 Supabase

在 Supabase Dashboard → SQL Editor 中執行：

```sql
-- 查看所有行程（測試用）
SELECT id, user_email, name, created_at, updated_at 
FROM trips 
ORDER BY updated_at DESC 
LIMIT 10;
```

---

## 🐛 常見問題排查

### 問題 1：數據沒有保存到 Supabase

**檢查：**
1. 環境變數是否正確設置
2. `SUPABASE_SERVICE_ROLE_KEY` 是否使用 service_role key（不是 anon key）
3. Vercel 是否已重新部署
4. 檢查 Vercel 日誌是否有錯誤

**解決方案：**
- 確認使用 `service_role` key（在 Supabase Settings → API → service_role key）
- 重新部署應用

### 問題 2：無法查詢數據

**檢查：**
1. RLS 策略是否正確設置
2. 用戶 email 是否匹配

**解決方案：**
- 確認 RLS 策略允許查詢（我們設置為 `USING (true)`，在 API 層面驗證）
- 檢查 `user_email` 欄位是否正確

### 問題 3：環境變數未生效

**解決方案：**
1. 在 Vercel 中確認環境變數已保存
2. 重新部署應用（必須）
3. 清除 Vercel 構建緩存（可選）

---

## ✅ 成功標誌

如果設置成功，您應該能夠：

- ✅ 創建行程後，在 Supabase Dashboard 中看到記錄
- ✅ 修改行程後，Supabase 中的 `updated_at` 會更新
- ✅ 刪除行程後，Supabase 中的記錄會消失
- ✅ 不同用戶的行程完全隔離
- ✅ 數據永久保存，不會因為服務器重啟而丟失

---

## 📊 監控建議

1. **定期檢查 Supabase Dashboard**
   - 查看數據庫使用量
   - 監控查詢性能

2. **設置 Supabase 警報**
   - 在 Supabase Dashboard → Settings → Billing
   - 設置使用量警報

3. **備份數據**
   - Supabase 免費層提供每日備份
   - 可以在 Settings → Database → Backups 查看

---

如果所有測試都通過，恭喜！您的應用已經成功使用 Supabase 資料庫了！🎉

