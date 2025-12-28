# 修復 redirect_uri_mismatch 錯誤

## 🔴 錯誤說明

`redirect_uri_mismatch` 表示 Google OAuth 配置中的重新導向 URI 與應用程式實際使用的 URI 不匹配。

---

## ✅ 解決步驟

### 步驟 1：確認您的實際網域

訪問您的網站，確認實際使用的網域是：
- `https://www.ihaveatree.shop`（有 www）
- 或 `https://ihaveatree.shop`（沒有 www）

**重要：** 必須確認是哪一個，因為 Google OAuth 對 URI 要求完全匹配。

---

### 步驟 2：在 Google Cloud Console 設置重新導向 URI

1. **前往 Google Cloud Console**
   - 網址：https://console.cloud.google.com/
   - 使用您的 Google 帳號登入

2. **選擇專案**
   - 點擊頂部的專案選擇器
   - 選擇您的專案（用於 OAuth 的專案）

3. **進入憑證頁面**
   - 左側選單：**「API 和服務」** → **「憑證」**

4. **編輯 OAuth 2.0 用戶端 ID**
   - 找到您的 OAuth 2.0 用戶端 ID（用於這個應用的）
   - 點擊該憑證的名稱或右側的編輯圖標（鉛筆圖標）

5. **添加重新導向 URI**
   
   在 **「授權的重新導向 URI」** 區塊中，點擊 **「+ 新增 URI」**，然後添加：

   **如果使用 www：**
   ```
   https://www.ihaveatree.shop/api/auth/callback/google
   ```

   **如果使用非 www：**
   ```
   https://ihaveatree.shop/api/auth/callback/google
   ```

   **建議同時添加兩個（以防萬一）：**
   ```
   https://www.ihaveatree.shop/api/auth/callback/google
   https://ihaveatree.shop/api/auth/callback/google
   ```

6. **保存更改**
   - 點擊底部的 **「儲存」** 按鈕
   - 等待幾秒鐘讓更改生效

---

### 步驟 3：確認 Vercel 環境變數

在 Vercel Dashboard 中，確認 `NEXTAUTH_URL` 設置正確：

1. **前往 Vercel Dashboard**
   - https://vercel.com/dashboard
   - 選擇您的專案

2. **檢查環境變數**
   - 點擊 **「Settings」** → **「Environment Variables」**
   - 找到 `NEXTAUTH_URL`
   - 確認值為：
     - `https://www.ihaveatree.shop`（如果使用 www）
     - 或 `https://ihaveatree.shop`（如果使用非 www）

3. **如果值不正確，更新它**
   - 點擊環境變數右側的編輯圖標
   - 更新值
   - 點擊 **「Save」**

---

### 步驟 4：確認其他環境變數

同時確認以下環境變數都已設置：

```
GOOGLE_CLIENT_ID=你的_google_client_id
GOOGLE_CLIENT_SECRET=你的_google_client_secret
NEXTAUTH_URL=https://www.ihaveatree.shop（或 https://ihaveatree.shop）
NEXTAUTH_SECRET=你的_random_secret_key
```

---

### 步驟 5：重新部署

1. **在 Vercel 中重新部署**
   - 前往 **「Deployments」** 標籤
   - 點擊最新部署右側的 **「⋯」** → **「Redeploy」**
   - 選擇 **「Use existing Build Cache」** 或 **「Redeploy」**
   - 等待部署完成

2. **清除瀏覽器緩存（可選）**
   - 按 `Ctrl+Shift+Delete`（Windows）或 `Cmd+Shift+Delete`（Mac）
   - 清除緩存和 Cookie
   - 或使用無痕模式測試

---

### 步驟 6：測試登入

1. 訪問您的網站：https://www.ihaveatree.shop
2. 點擊登入按鈕
3. 選擇 Google 帳號
4. 應該可以成功登入

---

## 🔍 詳細檢查清單

請確認以下所有項目：

- [ ] Google Cloud Console 中的重新導向 URI 包含：
  - `https://www.ihaveatree.shop/api/auth/callback/google`
  - 或 `https://ihaveatree.shop/api/auth/callback/google`
- [ ] Vercel 中的 `NEXTAUTH_URL` 設置正確
- [ ] `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 已設置
- [ ] `NEXTAUTH_SECRET` 已設置
- [ ] 已重新部署應用
- [ ] 等待了幾分鐘讓 Google 的更改生效

---

## ⚠️ 常見錯誤

### 錯誤 1：URI 格式不正確

**錯誤示例：**
- `http://www.ihaveatree.shop/api/auth/callback/google`（使用 http 而不是 https）
- `https://www.ihaveatree.shop/api/auth/callback`（缺少 `/google`）
- `https://ihaveatree.shop/api/auth/callback/google`（缺少 www，但實際使用 www）

**正確格式：**
- `https://www.ihaveatree.shop/api/auth/callback/google`（完全匹配）

### 錯誤 2：網域不匹配

如果您的網站實際使用 `www.ihaveatree.shop`，但 Google Console 中設置的是 `ihaveatree.shop`（沒有 www），會導致錯誤。

**解決方案：** 確保兩者完全一致。

### 錯誤 3：更改後未等待

Google 的更改可能需要幾分鐘才能生效。

**解決方案：** 等待 2-5 分鐘後再測試。

---

## 🆘 如果仍然無法解決

1. **檢查 Vercel 部署日誌**
   - 在 Vercel Dashboard 中查看部署日誌
   - 確認環境變數已正確載入

2. **檢查瀏覽器控制台**
   - 按 `F12` 打開開發者工具
   - 查看 Console 和 Network 標籤
   - 尋找錯誤訊息

3. **確認 Google OAuth 同意畫面**
   - 在 Google Cloud Console 中
   - 前往 **「API 和服務」** → **「OAuth 同意畫面」**
   - 確認已正確配置

4. **測試不同的瀏覽器**
   - 嘗試使用無痕模式
   - 或使用不同的瀏覽器

---

## 📝 快速檢查命令

如果您有訪問服務器的權限，可以檢查環境變數：

```bash
# 在 Vercel 中，環境變數會在構建時注入
# 檢查部署日誌確認環境變數是否正確
```

---

完成以上步驟後，錯誤應該就會解決。如果還有問題，請提供：
1. 您實際使用的網域（有 www 還是沒有）
2. Google Cloud Console 中設置的重新導向 URI
3. Vercel 中設置的 `NEXTAUTH_URL` 值

