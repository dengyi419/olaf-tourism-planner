# PDF 匯出功能安裝說明

PDF 匯出功能需要安裝 `jspdf` 套件。

## 安裝步驟

請在終端中執行以下命令：

```bash
cd /Users/dengyi/travelgenie
npm install jspdf
```

## 驗證安裝

安裝完成後，重新啟動開發伺服器：

```bash
npm run dev
```

如果安裝成功，PDF 匯出按鈕應該可以正常使用。

## 如果遇到權限問題

如果執行 `npm install` 時遇到權限問題，可以嘗試：

1. 使用 `sudo`（不推薦）：
   ```bash
   sudo npm install jspdf
   ```

2. 或者修復 npm 權限：
   ```bash
   sudo chown -R $(whoami) ~/.npm
   ```

3. 或者使用 `npx` 來執行：
   ```bash
   npx npm install jspdf
   ```

