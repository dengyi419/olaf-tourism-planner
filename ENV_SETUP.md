# API 金鑰設定說明

## 🔐 安全說明

**重要**：API 金鑰不會被提交到 GitHub，也不會上傳到伺服器。所有 API 金鑰都儲存在您的瀏覽器本地（localStorage）。

## 📝 設定方式

### 方式 1：在應用程式中設定（推薦）

1. 開啟應用程式
2. 點擊主選單的「4. API 金鑰設定」
3. 輸入您的 API 金鑰
4. 點擊「儲存設定」

### 方式 2：使用環境變數（開發環境）

如果您在本地開發，可以在 `.env.local` 檔案中設定：

```env
# Google Gemini API Key（用於 AI 行程生成）
GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps API Key（用於地圖和地點自動完成）
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key_here
```

**注意**：`.env.local` 檔案不會被提交到 Git，請確保它已在 `.gitignore` 中。

## 🔑 取得 API 金鑰

### Google Gemini API Key

1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登入您的 Google 帳號
3. 點擊「Create API Key」
4. 複製產生的 API Key

### Google Maps API Key

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用以下 API：
   - Maps JavaScript API
   - Places API
   - Directions API
4. 前往「憑證」頁面
5. 點擊「建立憑證」→「API 金鑰」
6. 複製產生的 API Key

## 🚀 Vercel 部署設定

如果您在 Vercel 上部署，需要在 Vercel 專案設定中添加環境變數：

1. 前往 Vercel 專案設定
2. 點擊「Environment Variables」
3. 添加以下變數：
   - `GEMINI_API_KEY`: 您的 Gemini API 金鑰（可選，如果使用者會自己設定）
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: 您的 Google Maps API 金鑰（可選）

**注意**：
- 如果未設定環境變數，使用者必須在應用程式中設定自己的 API 金鑰
- 環境變數中的 API 金鑰會作為預設值，但使用者設定的 API 金鑰優先級更高

## 🔒 安全性最佳實踐

1. **不要將 API 金鑰提交到 Git**
   - 確保 `.env.local` 在 `.gitignore` 中
   - 不要將 API 金鑰寫在程式碼中

2. **限制 API 金鑰權限**
   - 在 Google Cloud Console 中限制 API 金鑰的使用範圍
   - 設定 HTTP 引用來源限制（如果可能）

3. **定期輪換 API 金鑰**
   - 定期更換 API 金鑰以提高安全性

4. **監控 API 使用量**
   - 定期檢查 API 使用情況
   - 設定使用量限制和預算警報

