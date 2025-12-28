# 環境變數生成指南

本指南將詳細說明如何生成 `.env.local` 文件中所需的環境變數。

## 📋 快速開始

1. 複製範例文件：
```bash
cp .env.example .env.local
```

2. 按照以下步驟填入每個變數的值

---

## 1. Google OAuth 憑證（必須）

### GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET

**步驟：**

1. **前往 Google Cloud Console**
   - 網址：https://console.cloud.google.com/
   - 使用您的 Google 帳號登入

2. **創建或選擇專案**
   - 點擊頂部的專案選擇器
   - 點擊「新增專案」或選擇現有專案
   - 輸入專案名稱（例如：`olaf-tourism-planner`）

3. **啟用 Google+ API**
   - 在左側選單中，點擊「API 和服務」→「程式庫」
   - 搜尋「Google+ API」或「Google Identity」
   - 點擊「啟用」

4. **建立 OAuth 憑證**
   - 前往「API 和服務」→「憑證」
   - 點擊「建立憑證」→「OAuth 用戶端 ID」
   - 如果首次使用，需要先設定「OAuth 同意畫面」：
     - 選擇「外部」（除非您有 Google Workspace）
     - 填寫應用程式名稱（例如：`Olaf Tourism Planner`）
     - 填寫使用者支援電子郵件
     - 填寫開發人員聯絡資訊
     - 點擊「儲存並繼續」
     - 在「範圍」頁面直接點擊「儲存並繼續」
     - 在「測試使用者」頁面（可選）點擊「儲存並繼續」
     - 在「摘要」頁面點擊「返回資訊主頁」

5. **建立 OAuth 用戶端 ID**
   - 應用程式類型：選擇「網頁應用程式」
   - 名稱：輸入應用程式名稱（例如：`Olaf Tourism Planner Web`）
   - **授權的 JavaScript 來源**：
     - 開發環境：`http://localhost:3000`
     - 生產環境：`https://your-domain.com`（例如：`https://ihaveatree.shop`）
   - **授權的重新導向 URI**：
     - 開發環境：`http://localhost:3000/api/auth/callback/google`
     - 生產環境：`https://your-domain.com/api/auth/callback/google`
   - 點擊「建立」

6. **複製憑證**
   - 複製「用戶端 ID」→ 填入 `GOOGLE_CLIENT_ID`
   - 複製「用戶端密鑰」→ 填入 `GOOGLE_CLIENT_SECRET`

**範例：**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```

---

## 2. NextAuth 配置（必須）

### NEXTAUTH_URL

**開發環境：**
```env
NEXTAUTH_URL=http://localhost:3000
```

**生產環境（Vercel）：**
```env
NEXTAUTH_URL=https://your-domain.com
```
或讓 Vercel 自動設置（推薦）

### NEXTAUTH_SECRET

**生成方式：**

在終端機執行以下命令：

```bash
openssl rand -base64 32
```

**macOS/Linux：**
```bash
openssl rand -base64 32
```

**Windows (PowerShell)：**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Windows (Git Bash)：**
```bash
openssl rand -base64 32
```

**線上生成（如果沒有 openssl）：**
- 前往：https://generate-secret.vercel.app/32
- 複製生成的密鑰

**範例輸出：**
```
aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/=
```

將生成的密鑰填入 `.env.local`：
```env
NEXTAUTH_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/=
```

---

## 3. Google Gemini API Key（可選）

如果用戶會在應用中設定自己的 API Key，這項是可選的。

**取得方式：**

1. 前往：https://makersuite.google.com/app/apikey
2. 登入您的 Google 帳號
3. 點擊「Create API Key」
4. 複製 API Key

**填入：**
```env
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

---

## 4. Google Maps API Key（可選）

如果用戶會在應用中設定自己的 API Key，這項是可選的。

**取得方式：**

1. 前往：https://console.cloud.google.com/
2. 選擇專案
3. 啟用以下 API：
   - Maps JavaScript API
   - Places API
   - Directions API
4. 前往「憑證」→「建立憑證」→「API 金鑰」
5. 複製 API Key

**填入：**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

---

## 5. Cloudflare Zero Trust（可選）

只有在使用 Cloudflare Zero Trust 時才需要。

**取得方式：**

1. 登入 Cloudflare Zero Trust：https://one.dash.cloudflare.com/
2. 前往「Access」→「Applications」
3. 點擊「Add an application」
4. 選擇「Self-hosted」
5. 設定應用程式名稱和網域
6. 複製「Application Audience (AUD) Tag」

**填入：**
```env
CLOUDFLARE_ACCESS_AUDIENCE=your_audience_tag
CLOUDFLARE_ACCESS_PUBLIC_KEY=your_public_key
```

---

## ✅ 完成後的 `.env.local` 範例

```env
# Google OAuth 認證（必須）
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz

# NextAuth 配置（必須）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/=

# Google Gemini API Key（可選）
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567

# Google Maps API Key（可選）
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

---

## 🔒 安全提醒

1. **永遠不要將 `.env.local` 提交到 Git**
   - 確認 `.gitignore` 中包含 `.env.local`
   - 不要將環境變數分享給他人

2. **生產環境設置**
   - 在 Vercel 專案設定中添加環境變數
   - 不要將敏感信息寫在代碼中

3. **定期輪換密鑰**
   - 定期更新 `NEXTAUTH_SECRET`
   - 定期檢查 OAuth 憑證

---

## 🆘 常見問題

### Q: 找不到 openssl 命令？
**A:** 
- macOS：通常已內建
- Linux：執行 `sudo apt-get install openssl` 或 `sudo yum install openssl`
- Windows：使用 Git Bash 或線上生成工具

### Q: OAuth 憑證建立失敗？
**A:** 
- 確認已啟用 Google+ API
- 確認已設定 OAuth 同意畫面
- 確認重新導向 URI 格式正確

### Q: 如何確認環境變數是否正確？
**A:** 
- 重新啟動開發伺服器：`npm run dev`
- 檢查終端機是否有錯誤訊息
- 嘗試登入功能

