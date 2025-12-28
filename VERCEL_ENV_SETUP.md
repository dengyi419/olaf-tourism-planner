# Vercel 環境變數設置指南

## 🔧 必須設置的環境變數

在 Vercel 專案設定中，必須添加以下環境變數：

### 1. Google OAuth 憑證

```
GOOGLE_CLIENT_ID=你的_google_client_id
GOOGLE_CLIENT_SECRET=你的_google_client_secret
```

**取得方式：**
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇專案 → 「API 和服務」→ 「憑證」
3. 找到您的 OAuth 2.0 用戶端 ID
4. 複製「用戶端 ID」和「用戶端密鑰」

**重要：** 確保在 Google Cloud Console 中已添加以下重新導向 URI：
- `https://www.ihaveatree.shop/api/auth/callback/google`
- `https://ihaveatree.shop/api/auth/callback/google`（如果使用）

### 2. NextAuth 配置

```
NEXTAUTH_URL=https://www.ihaveatree.shop
NEXTAUTH_SECRET=你的_random_secret_key
```

**NEXTAUTH_SECRET 生成：**
```bash
openssl rand -base64 32
```

**重要：** 
- `NEXTAUTH_URL` 必須與您的實際網域完全一致（包括 `www` 前綴）
- 如果使用 `ihaveatree.shop`（沒有 www），則設置為 `https://ihaveatree.shop`

### 3. 可選的環境變數

```
GEMINI_API_KEY=你的_gemini_api_key（可選）
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=你的_maps_api_key（可選）
```

---

## 📝 在 Vercel 中設置環境變數的步驟

1. **登入 Vercel Dashboard**
   - 前往：https://vercel.com/dashboard
   - 選擇您的專案

2. **進入專案設定**
   - 點擊專案名稱
   - 點擊頂部「Settings」標籤
   - 在左側選單中點擊「Environment Variables」

3. **添加環境變數**
   - 點擊「Add New」
   - 輸入變數名稱（例如：`GOOGLE_CLIENT_ID`）
   - 輸入變數值
   - 選擇環境（Production, Preview, Development）
   - 點擊「Save」

4. **重複步驟 3** 添加所有必要的環境變數

5. **重新部署**
   - 環境變數設置後，需要重新部署才能生效
   - 前往「Deployments」標籤
   - 點擊最新部署右側的「⋯」→「Redeploy」

---

## ✅ 檢查清單

在設置環境變數後，確認：

- [ ] `GOOGLE_CLIENT_ID` 已設置
- [ ] `GOOGLE_CLIENT_SECRET` 已設置
- [ ] `NEXTAUTH_URL` 設置為 `https://www.ihaveatree.shop`（或您的實際網域）
- [ ] `NEXTAUTH_SECRET` 已設置（32 字符以上的隨機字符串）
- [ ] Google Cloud Console 中的重新導向 URI 已添加
- [ ] 已重新部署應用

---

## 🐛 常見問題

### 問題 1：Configuration 錯誤

**錯誤訊息：** `There is a problem with the server configuration`

**解決方案：**
1. 確認所有環境變數都已設置
2. 確認 `NEXTAUTH_URL` 與實際網域完全一致
3. 確認 `NEXTAUTH_SECRET` 已設置
4. 重新部署應用

### 問題 2：OAuth 錯誤

**錯誤訊息：** `redirect_uri_mismatch`

**解決方案：**
1. 在 Google Cloud Console 中，確認已添加正確的重新導向 URI：
   - `https://www.ihaveatree.shop/api/auth/callback/google`
2. 確認 `NEXTAUTH_URL` 設置正確
3. 等待幾分鐘讓 Google 的更改生效

### 問題 3：環境變數未生效

**解決方案：**
1. 確認環境變數已保存
2. 重新部署應用（必須）
3. 清除瀏覽器緩存
4. 檢查 Vercel 部署日誌確認環境變數已載入

---

## 🔒 安全提醒

1. **不要將環境變數分享給他人**
2. **定期輪換密鑰**
3. **使用不同的密鑰用於開發和生產環境**
4. **定期檢查環境變數是否正確設置**

