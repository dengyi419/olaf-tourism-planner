# Vercel 構建修復指南

## 問題：Module not found: Can't resolve '@supabase/supabase-js'

### 解決方案 1：清除構建緩存

1. 前往 Vercel Dashboard → Deployments
2. 點擊最新部署右側的 "..." 菜單
3. 選擇 "Redeploy"
4. **取消勾選** "Use existing Build Cache"
5. 點擊 "Redeploy"

### 解決方案 2：檢查 package.json

確保 `@supabase/supabase-js` 在 `dependencies` 中（不是 `devDependencies`）：

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.89.0",
    ...
  }
}
```

### 解決方案 3：強制重新安裝依賴

在 Vercel Dashboard → Settings → General → Build & Development Settings：

1. 找到 "Install Command"
2. 設置為：`npm ci` 或 `npm install --force`
3. 保存並重新部署

### 解決方案 4：檢查 node_modules

如果本地構建成功但 Vercel 失敗：

1. 刪除本地 `node_modules` 和 `package-lock.json`
2. 運行 `npm install`
3. 提交 `package-lock.json`
4. 推送到 GitHub
5. 觸發 Vercel 重新部署

### 解決方案 5：使用 .vercelignore（不推薦）

如果以上方法都不行，可以創建 `.vercelignore` 文件來排除某些文件，但這通常不是解決方案。

### 當前實現

代碼已經使用以下方法來避免構建時解析：

1. **webpack externals 配置**：在 `next.config.js` 中將 `@supabase/supabase-js` 標記為外部依賴
2. **Function 構造函數**：使用 `new Function()` 動態執行 import，完全避免 webpack 解析
3. **運行時加載**：只在 API 路由運行時才加載 Supabase 模組

### 驗證

如果構建成功，在 Vercel 函數日誌中應該看到：
- `Supabase 客戶端初始化成功`（如果環境變數已設置）
- 或 `Supabase 環境變數未設置`（如果環境變數未設置）

如果看到 `Supabase 客戶端初始化失敗`，檢查：
1. Vercel 環境變數是否正確設置
2. `SUPABASE_SERVICE_ROLE_KEY` 是否是 `service_role` key（不是 `anon` key）

