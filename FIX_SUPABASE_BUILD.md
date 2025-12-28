# 修復 Supabase 構建錯誤

## 問題
構建時出現錯誤：`Module not found: Can't resolve '@supabase/supabase-js'`

## 解決方案

### 1. 確保 package-lock.json 已提交

```bash
git add package-lock.json
git commit -m "chore: 提交 package-lock.json"
git push origin main
```

### 2. 清除 Vercel 構建緩存

在 Vercel Dashboard：
1. 前往 Deployments → 最新部署
2. 點擊 "..." → "Redeploy"
3. **取消勾選** "Use existing Build Cache"
4. 點擊 "Redeploy"

### 3. 檢查 Vercel 構建日誌

在 Vercel Dashboard → Deployments → 最新部署 → Build Logs：
- 確認看到 `Installing dependencies...`
- 確認看到 `@supabase/supabase-js` 被安裝
- 如果沒有，可能是構建緩存問題

### 4. 強制重新安裝依賴

在 Vercel Dashboard → Settings → General → Build & Development Settings：
- 找到 "Install Command"
- 設置為：`npm ci` 或 `npm install --force`
- 保存並重新部署

### 5. 驗證 package.json

確認 `@supabase/supabase-js` 在 `dependencies` 中（不是 `devDependencies`）：

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.89.0",
    ...
  }
}
```

### 6. 本地測試構建

在本地運行：
```bash
npm install
npm run build
```

如果本地構建成功但 Vercel 失敗，可能是：
- Vercel 構建緩存問題 → 清除緩存
- Vercel 環境變數問題 → 檢查環境變數設置
- Node.js 版本不匹配 → 檢查 `.nvmrc` 或 `package.json` 中的 `engines`

## 當前實現

代碼已使用動態 `import()` 來避免構建時解析：

```typescript
// 動態載入 Supabase 模組（避免構建時解析）
if (!supabaseModule) {
  supabaseModule = await import('@supabase/supabase-js');
}
```

這應該可以避免構建時錯誤，但如果 Vercel 在運行時仍然找不到模組，可能是：
1. 依賴沒有被正確安裝
2. 需要清除構建緩存
3. 需要提交 package-lock.json

## 如果仍然失敗

請提供：
1. Vercel 構建日誌（特別是 "Installing dependencies" 部分）
2. 本地 `npm run build` 的輸出
3. `package-lock.json` 是否已提交到 Git

