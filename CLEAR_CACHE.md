# 清除 Vercel 構建緩存指南

## 問題
構建時出現 `Module not found: Can't resolve '@supabase/supabase-js'` 錯誤，即使 `package.json` 中已包含該依賴。

## 解決方案

### 方法 1：在 Vercel Dashboard 清除緩存

1. 前往 Vercel Dashboard → Deployments
2. 找到最新部署
3. 點擊右側的 "..." 菜單
4. 選擇 "Redeploy"
5. **重要**：取消勾選 "Use existing Build Cache"
6. 點擊 "Redeploy"

### 方法 2：強制重新安裝依賴

在 Vercel Dashboard → Settings → General → Build & Development Settings：

1. 找到 "Install Command"
2. 暫時設置為：`rm -rf node_modules package-lock.json && npm install`
3. 保存並觸發新的部署
4. 部署成功後，將 "Install Command" 改回默認值（留空或 `npm install`）

### 方法 3：通過 Git 觸發重新構建

```bash
# 創建一個空提交來觸發重新構建
git commit --allow-empty -m "chore: 觸發重新構建以清除緩存"
git push origin main
```

### 方法 4：檢查構建日誌

在 Vercel Dashboard → Deployments → 最新部署 → Build Logs：

1. 查看 "Installing dependencies" 部分
2. 確認是否看到 `@supabase/supabase-js@2.89.0` 被安裝
3. 如果沒有，可能是構建緩存問題

### 方法 5：驗證 package.json

確認 `@supabase/supabase-js` 在 `dependencies` 中（不是 `devDependencies`）：

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.89.0",
    ...
  }
}
```

### 方法 6：本地測試構建

在本地運行：

```bash
# 清除本地緩存
rm -rf .next node_modules package-lock.json

# 重新安裝依賴
npm install

# 測試構建
npm run build
```

如果本地構建成功但 Vercel 失敗，很可能是 Vercel 構建緩存問題。

## 當前狀態

- ✅ `package.json` 中包含 `@supabase/supabase-js`
- ✅ `package-lock.json` 中包含該依賴
- ✅ 代碼使用靜態 `import` 來確保正確打包
- ⚠️ 需要清除 Vercel 構建緩存

## 推薦步驟

1. **立即執行**：在 Vercel Dashboard 清除構建緩存並重新部署
2. **如果仍然失敗**：使用 "方法 2" 強制重新安裝依賴
3. **驗證**：檢查構建日誌，確認依賴被正確安裝

