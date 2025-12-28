# Vercel 重新部署指南

## 方法 1：在 Vercel 儀表板中重新部署（最簡單）

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇您的專案 `olaf-tourism-planner`
3. 點擊「Deployments」標籤
4. 找到最新的部署記錄
5. 點擊部署記錄右側的「...」選單
6. 選擇「Redeploy」

## 方法 2：推送空提交觸發重新部署

在終端執行以下命令：

```bash
cd /Users/dengyi/travelgenie
git commit --allow-empty -m "trigger: 重新部署"
git push origin main
```

這會觸發 Vercel 自動重新部署。

## 方法 3：檢查並修復構建錯誤

如果部署失敗，請檢查：

1. **查看 Vercel 構建日誌**：
   - 在 Vercel Dashboard 中點擊失敗的部署
   - 查看「Build Logs」以了解錯誤原因

2. **常見問題**：
   - TypeScript 類型錯誤
   - 缺少環境變數
   - 依賴套件問題

3. **本地測試構建**：
   ```bash
   npm run build
   ```
   如果本地構建成功，但 Vercel 失敗，可能是環境變數問題。

## 方法 4：清除構建快取並重新部署

1. 在 Vercel Dashboard 中
2. 前往專案設定 → 「Settings」→ 「General」
3. 找到「Build & Development Settings」
4. 點擊「Clear Build Cache」
5. 然後重新部署

## 檢查清單

- [ ] 確認所有代碼已推送到 GitHub
- [ ] 檢查 Vercel 環境變數是否正確設定
- [ ] 確認 `.env.local` 不在 Git 中（已在 .gitignore）
- [ ] 本地 `npm run build` 是否成功

