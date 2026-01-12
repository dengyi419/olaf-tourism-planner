# 手機端分享連結問題排查指南

## 問題描述

電腦端可以成功建立分享連結，但手機端無法建立。

## 已實施的修復

### 1. 添加詳細的錯誤日誌

**API 路由** (`app/api/share-trip/route.ts`)：
- 記錄 session 檢查詳情
- 記錄請求體內容
- 記錄錯誤詳情和堆疊

**前端** (`app/plan/page.tsx`, `app/history/page.tsx`)：
- 記錄請求發送前的狀態
- 記錄 API 回應狀態
- 顯示詳細的錯誤訊息

### 2. 確保 Session Cookie 正確傳遞

**關鍵修復**：在 `fetch` 請求中添加 `credentials: 'include'`：

```typescript
const response = await fetch('/api/share-trip', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ← 確保包含 cookies（session）
  body: JSON.stringify({...}),
});
```

這確保了：
- Session cookie 會被正確發送到伺服器
- 手機端的 session 驗證可以正常工作

### 3. 改進錯誤處理

- 顯示具體的錯誤訊息（而不只是「失敗」）
- 提供排查建議
- 剪貼板複製失敗時提供 fallback

## 可能的原因和解決方案

### 原因 1：Session Cookie 未正確傳遞

**症狀**：
- API 返回 `401 Unauthorized`
- 錯誤訊息顯示「請先登入以使用分享功能」

**解決方案**：
1. ✅ 已修復：添加 `credentials: 'include'`
2. 確認手機端已正確登入：
   - 檢查右上角是否顯示用戶資訊
   - 嘗試登出後重新登入

**如何驗證**：
- 打開手機瀏覽器的開發者工具（如果可用）
- 檢查 Network 標籤中的請求
- 確認請求 Headers 中包含 `Cookie` 欄位

### 原因 2：手機端未登入

**症狀**：
- 錯誤訊息：「請先登入以使用分享功能」
- Session 檢查失敗

**解決方案**：
1. 在手機端點擊「登入」
2. 完成 Google OAuth 登入流程
3. 確認登入成功後再嘗試分享

**如何驗證**：
- 檢查頁面右上角是否顯示用戶名稱或頭像
- 如果沒有，表示未登入

### 原因 3：網路連線問題

**症狀**：
- 請求超時
- 網路錯誤

**解決方案**：
1. 檢查手機網路連線（Wi-Fi 或行動數據）
2. 確認可以訪問網站的其他功能
3. 嘗試重新載入頁面

### 原因 4：行程資料不完整

**症狀**：
- 錯誤訊息：「缺少必要的行程資料」
- API 返回 `400 Bad Request`

**解決方案**：
1. 確認行程設定已保存（目的地、預算等）
2. 確認至少有一天的行程
3. 嘗試重新載入行程後再分享

### 原因 5：跨域問題（Capacitor iOS App）

**症狀**：
- 在 iOS App 中無法建立分享連結
- CORS 錯誤

**解決方案**：
1. 確認 `capacitor.config.ts` 中的 `server.url` 設置正確
2. 確認 Next.js 的 CORS 設置允許來自 App 的請求

## 診斷步驟

### 步驟 1：檢查 Console 日誌

1. 在手機端打開瀏覽器的開發者工具（如果可用）
2. 或使用遠程調試（Chrome DevTools → Remote Devices）
3. 點擊「分享連結」按鈕
4. 查看 Console 中的日誌：

```
[handleShareTrip] 準備發送請求: {...}
[handleShareTrip] API 回應: {...}
```

### 步驟 2：檢查 Network 請求

1. 打開 Network 標籤
2. 找到 `/api/share-trip` 請求
3. 檢查：
   - **Status Code**：應該是 `200`，如果是 `401` 表示未登入
   - **Request Headers**：確認包含 `Cookie` 欄位
   - **Response**：查看錯誤訊息

### 步驟 3：檢查 Session

在 API 路由的日誌中查找：

```
[share-trip POST] Session check: {
  hasSession: true/false,
  hasUser: true/false,
  hasEmail: true/false,
  email: "..."
}
```

如果 `hasSession: false` 或 `hasEmail: false`，表示 session 未正確設置。

## 如何查看伺服器日誌

### Vercel

1. 登入 Vercel Dashboard
2. 選擇專案
3. 進入「Functions」或「Logs」標籤
4. 查找 `[share-trip POST]` 開頭的日誌

### 本地開發

在終端機中查看 Next.js 的輸出日誌。

## 常見錯誤訊息和解決方法

### 「請先登入以使用分享功能」

**原因**：Session 未找到或無效

**解決方法**：
1. 登出後重新登入
2. 清除瀏覽器 cookies 後重新登入
3. 確認網站使用 HTTPS（某些瀏覽器要求 HTTPS 才能設置 secure cookies）

### 「缺少必要的行程資料」

**原因**：行程設定或行程資料不完整

**解決方法**：
1. 確認已設置目的地和預算
2. 確認至少有一天的行程
3. 嘗試重新載入頁面

### 「建立分享連結時發生錯誤」

**原因**：伺服器錯誤或資料庫錯誤

**解決方法**：
1. 檢查伺服器日誌查看詳細錯誤
2. 確認 Supabase 連接正常
3. 確認環境變數設置正確

## 測試檢查清單

- [ ] 手機端已登入（右上角顯示用戶資訊）
- [ ] 網路連線正常
- [ ] 行程設定完整（目的地、預算、日期）
- [ ] 至少有一天的行程
- [ ] 瀏覽器 Console 無錯誤
- [ ] Network 請求返回 `200` 狀態碼
- [ ] 請求 Headers 包含 `Cookie` 欄位

## 如果問題仍然存在

1. **收集資訊**：
   - 手機型號和瀏覽器版本
   - 錯誤訊息的完整內容
   - Console 日誌（如果可用）
   - Network 請求詳情（如果可用）

2. **檢查伺服器日誌**：
   - 查看 API 路由的日誌輸出
   - 確認 session 檢查的結果
   - 確認錯誤詳情

3. **嘗試以下操作**：
   - 清除瀏覽器快取和 cookies
   - 使用不同的瀏覽器測試
   - 使用無痕模式測試
   - 確認網站使用 HTTPS

## 技術細節

### Session Cookie 設置

NextAuth.js 會設置 session cookie，但需要：
- **SameSite 設置**：`lax` 或 `none`（跨域時）
- **Secure 設置**：HTTPS 環境下為 `true`
- **HttpOnly**：`true`（防止 XSS）

### 手機端特殊情況

1. **iOS Safari**：
   - 需要 HTTPS 才能設置 secure cookies
   - 某些版本的 Safari 對 cookies 有嚴格限制

2. **Android Chrome**：
   - 通常支援良好
   - 但需要注意 SameSite 設置

3. **Capacitor WebView**：
   - 可能需要特殊的 cookie 設置
   - 確認 `capacitor.config.ts` 中的設置

## 相關檔案

- `app/api/share-trip/route.ts`：API 路由
- `app/plan/page.tsx`：行程規劃頁面
- `app/history/page.tsx`：行程歷史頁面
- `lib/auth.ts`：NextAuth 配置

