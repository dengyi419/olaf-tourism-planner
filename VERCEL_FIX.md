# Vercel 構建問題最終解決方案

## 問題
構建時找不到 `@supabase/supabase-js`，即使 `package.json` 中包含該依賴。

## 根本原因
Vercel 可能使用了緩存的 `node_modules`，而緩存中沒有 `@supabase/supabase-js`。

## 解決方案

### 方法 1：在 Vercel 設置中強制重新安裝依賴（推薦）

1. 前往 Vercel Dashboard → Settings → General → Build & Development Settings
2. 找到 "Install Command"
3. **設置為**：`rm -rf node_modules package-lock.json && npm install`
4. 保存設置
5. 觸發新的部署（可以通過推送一個空提交）

### 方法 2：使用 npm ci 強制重新安裝

1. 前往 Vercel Dashboard → Settings → General → Build & Development Settings
2. 找到 "Install Command"
3. **設置為**：`npm ci`
4. 保存設置
5. 觸發新的部署

### 方法 3：檢查構建日誌

在 Vercel Dashboard → Deployments → 最新部署 → Build Logs：

查看 "Installing dependencies" 部分，確認是否看到：
```
added 144 packages in 10s
```

如果看到 "up to date in 739ms"，這意味著使用了緩存的 node_modules，可能缺少 `@supabase/supabase-js`。

### 方法 4：驗證 package-lock.json

確認 `package-lock.json` 已提交到 Git，並且包含 `@supabase/supabase-js`：

```bash
git add package-lock.json
git commit -m "chore: 確保 package-lock.json 包含所有依賴"
git push origin main
```

### 方法 5：升級 Next.js（可選）

如果以上方法都不行，可以嘗試升級 Next.js 到最新版本：

```bash
npm install next@latest
```

然後提交並推送。

## 當前狀態

- ✅ `package.json` 中包含 `@supabase/supabase-js@^2.89.0`
- ✅ `package-lock.json` 中包含該依賴
- ✅ 代碼使用靜態 `import { createClient } from '@supabase/supabase-js'`
- ⚠️ 構建時仍然找不到模組（可能是緩存問題）

## 推薦步驟

1. **立即執行**：使用方法 1 強制重新安裝依賴
2. **驗證**：檢查構建日誌，確認看到 "added X packages" 而不是 "up to date"
3. **如果仍然失敗**：使用方法 2 或考慮升級 Next.js

## 為什麼會發生這個問題？

Vercel 使用構建緩存來加速部署。如果之前的構建中沒有 `@supabase/supabase-js`，緩存中就不會有這個模組。即使後來在 `package.json` 中添加了依賴，如果使用緩存，構建時仍然找不到模組。

解決方法是強制重新安裝依賴，這樣 Vercel 會重新下載所有依賴，包括 `@supabase/supabase-js`。

