# 下一步操作指南

## ✅ 已完成：環境變數設置

您已經設置好 `.env.local` 文件，包含：
- ✅ GOOGLE_CLIENT_ID
- ✅ GOOGLE_CLIENT_SECRET
- ✅ NEXTAUTH_URL
- ✅ NEXTAUTH_SECRET

---

## 📋 接下來的步驟

### 步驟 1：安裝依賴

確保所有依賴都已安裝，特別是 `next-auth`：

```bash
npm install
```

這會安裝所有必要的套件，包括：
- next-auth (認證)
- @google/generative-ai (AI 功能)
- 其他依賴

---

### 步驟 2：啟動開發伺服器

```bash
npm run dev
```

應該會看到類似以下的輸出：
```
  ▲ Next.js 14.2.5
  - Local:        http://localhost:3000
  - ready started server on 0.0.0.0:3000
```

---

### 步驟 3：測試應用功能

#### 3.1 測試登入功能

1. **訪問主頁**
   - 打開瀏覽器：http://localhost:3000
   - 應該會自動重定向到登入頁面：http://localhost:3000/auth/signin

2. **使用 Google 帳號登入**
   - 點擊「使用 Google 帳號登入」按鈕
   - 選擇您的 Google 帳號
   - 授權應用程式訪問您的帳號
   - 應該會重定向回主頁

3. **確認登入狀態**
   - 右上角應該顯示您的 Google 帳號頭像和名稱
   - 可以點擊登出按鈕測試登出功能

#### 3.2 測試主選單功能

登入後，您應該看到：
- ✅ 左側：所有行程列表（目前應該是空的）
- ✅ 右側：主選單選項
  - 1. 自行規劃行程
  - 2. AI 推薦行程
  - 3. 查看行程記錄
  - 4. API 金鑰設定

#### 3.3 測試 API 金鑰設定

1. 點擊「4. API 金鑰設定」
2. 輸入您的 Gemini API Key（如果有的話）
3. 輸入您的 Google Maps API Key（如果有的話）
4. 點擊「儲存設定」

#### 3.4 測試 AI 推薦行程（需要 API Key）

1. 點擊「2. AI 推薦行程」
2. 如果沒有設定 API Key，會看到警告提示
3. 如果已設定 API Key：
   - 輸入目的地（例如：東京）
   - 設定天數（例如：3）
   - 設定預算（例如：50000）
   - 點擊「AI 生成行程」
   - 等待 AI 生成行程

#### 3.5 測試行程保存

1. 創建或生成一個行程後
2. 點擊「儲存」按鈕
3. 行程應該會保存到：
   - 本地 localStorage（即時）
   - 後端服務器（永久保存）

#### 3.6 測試行程同步

1. 創建一個行程並保存
2. 登出
3. 重新登入
4. 行程應該會自動從服務器載入

---

## 🔍 檢查清單

### 環境變數檢查

確認 `.env.local` 文件包含：

```env
# 必須的
GOOGLE_CLIENT_ID=已設置 ✅
GOOGLE_CLIENT_SECRET=已設置 ✅
NEXTAUTH_URL=http://localhost:3000 ✅
NEXTAUTH_SECRET=已設置 ✅

# 可選的
GEMINI_API_KEY=已設置（可選）
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=已設置（可選）
```

### 功能檢查

- [ ] 可以訪問 http://localhost:3000
- [ ] 自動重定向到登入頁面
- [ ] Google 登入功能正常
- [ ] 登入後可以看到主選單
- [ ] 可以設定 API 金鑰
- [ ] AI 推薦行程功能正常（如果設定了 API Key）
- [ ] 行程可以保存
- [ ] 行程可以從服務器載入

---

## 🐛 常見問題排查

### 問題 1：無法登入

**錯誤訊息：** `Error: Invalid credentials` 或 `OAuth error`

**解決方案：**
1. 檢查 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 是否正確
2. 確認 Google Cloud Console 中的重新導向 URI 設定正確：
   - `http://localhost:3000/api/auth/callback/google`
3. 確認 OAuth 同意畫面已設定
4. 重新啟動開發伺服器

### 問題 2：環境變數未載入

**錯誤訊息：** `NEXTAUTH_SECRET is not defined`

**解決方案：**
1. 確認 `.env.local` 文件在專案根目錄
2. 確認文件名稱是 `.env.local`（不是 `.env`）
3. 重新啟動開發伺服器（修改 `.env.local` 後必須重啟）

### 問題 3：無法訪問受保護的路由

**錯誤訊息：** 一直重定向到登入頁面

**解決方案：**
1. 確認已成功登入（檢查右上角是否有用戶頭像）
2. 檢查 `middleware.ts` 是否正確配置
3. 確認 session 已建立

### 問題 4：行程無法保存到服務器

**錯誤訊息：** `Failed to sync trip to server`

**解決方案：**
1. 確認已登入
2. 檢查瀏覽器控制台是否有錯誤
3. 確認後端 API (`/api/trips`) 正常運作

---

## 🚀 準備部署到生產環境

### Vercel 部署前準備

1. **推送代碼到 GitHub**
   ```bash
   git add .
   git commit -m "準備部署"
   git push origin main
   ```

2. **在 Vercel 設置環境變數**
   - 前往 Vercel 專案設定
   - 點擊「Environment Variables」
   - 添加所有 `.env.local` 中的變數：
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
     - `NEXTAUTH_URL` (Vercel 會自動設置，但可以手動覆蓋)
     - `NEXTAUTH_SECRET`
     - `GEMINI_API_KEY` (可選)
     - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (可選)

3. **更新 Google OAuth 重新導向 URI**
   - 在 Google Cloud Console 中
   - 添加生產環境的重新導向 URI：
     - `https://your-domain.com/api/auth/callback/google`

4. **部署**
   - Vercel 會自動檢測 GitHub 推送並部署
   - 或手動觸發部署

---

## 📝 下一步優化建議

1. **數據庫遷移**
   - 目前使用內存數據庫（Map）
   - 建議遷移到 PostgreSQL 或 MongoDB
   - 參考 `AUTH_SETUP.md` 中的數據庫設置說明

2. **Cloudflare Zero Trust**
   - 如果需要額外的安全層
   - 參考 `AUTH_SETUP.md` 中的 Cloudflare 設置

3. **功能增強**
   - 添加更多語言支持
   - 優化行程同步機制
   - 添加行程分享功能

---

## ✅ 完成檢查

如果所有功能都正常，您應該能夠：
- ✅ 使用 Google 帳號登入
- ✅ 創建和保存行程
- ✅ 使用 AI 推薦功能
- ✅ 查看歷史行程
- ✅ 行程永久保存在服務器

恭喜！您的應用已經可以正常使用了！🎉

