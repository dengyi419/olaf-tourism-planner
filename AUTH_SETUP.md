# 認證設置說明

## Google OAuth 設置

### 1. 創建 Google OAuth 憑證

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇或創建一個專案
3. 啟用「Google+ API」
4. 前往「憑證」頁面
5. 點擊「建立憑證」→「OAuth 用戶端 ID」
6. 應用程式類型選擇「網頁應用程式」
7. 設定授權重新導向 URI：
   - 開發環境：`http://localhost:3000/api/auth/callback/google`
   - 生產環境：`https://your-domain.com/api/auth/callback/google`
8. 複製「用戶端 ID」和「用戶端密鑰」

### 2. 設置環境變數

在 `.env.local` 文件中添加：

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000  # 開發環境
# NEXTAUTH_URL=https://your-domain.com  # 生產環境
NEXTAUTH_SECRET=your_random_secret_key  # 使用 openssl rand -base64 32 生成
```

### 3. Vercel 部署設置

在 Vercel 專案設定中添加環境變數：
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` (自動設置，但可以手動覆蓋)
- `NEXTAUTH_SECRET`

## Cloudflare Zero Trust 設置

### 1. 在 Cloudflare Dashboard 設置

1. 登入 [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. 前往「Access」→「Applications」
3. 點擊「Add an application」
4. 選擇「Self-hosted」
5. 設定應用程式名稱和網域
6. 設定策略（Policy）來控制誰可以訪問
7. 複製「Application Audience (AUD) Tag」

### 2. 設置環境變數（可選）

如果要在後端驗證 Cloudflare Access token：

```env
CLOUDFLARE_ACCESS_AUDIENCE=your_audience_tag
CLOUDFLARE_ACCESS_PUBLIC_KEY=your_public_key
```

**注意**：Cloudflare Zero Trust 通常在邊緣網絡層完成驗證，後端驗證是可選的。

## 數據庫設置

目前使用內存數據庫（Map）來存儲行程數據。在生產環境中，應該使用真實的數據庫：

### 推薦選項：

1. **PostgreSQL** (推薦)
   - 使用 Prisma 或 Drizzle ORM
   - 適合結構化數據

2. **MongoDB**
   - 使用 Mongoose
   - 適合文檔型數據

3. **Supabase**
   - 提供 PostgreSQL + 認證
   - 易於設置和使用

### 遷移到數據庫的步驟：

1. 安裝數據庫客戶端或 ORM
2. 創建數據庫連接
3. 修改 `app/api/trips/route.ts` 使用數據庫而不是 Map
4. 設置數據庫遷移腳本

## 安全最佳實踐

1. **永遠不要將敏感信息提交到 Git**
   - 確保 `.env.local` 在 `.gitignore` 中
   - 使用環境變數管理工具（如 Vercel 的環境變數）

2. **使用 HTTPS**
   - 生產環境必須使用 HTTPS
   - Vercel 自動提供 HTTPS

3. **定期輪換密鑰**
   - 定期更新 `NEXTAUTH_SECRET`
   - 定期檢查 OAuth 憑證

4. **限制 API 訪問**
   - 使用 middleware 保護 API routes
   - 驗證用戶身份和權限

