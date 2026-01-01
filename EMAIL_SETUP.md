# Email 發送功能設置指南

## 📧 功能說明

當用戶首次登入時，系統會自動發送歡迎郵件到用戶的 Google 信箱。

## 🚀 設置步驟

### 步驟 1：安裝 Resend 套件

在專案根目錄執行：

```bash
npm install resend
```

### 步驟 2：註冊 Resend 帳號

1. 前往 [Resend](https://resend.com/)
2. 註冊/登入帳號（免費）
3. 驗證您的 email 地址

### 步驟 3：獲取 API Key

1. 在 Resend Dashboard 中，點擊左側「API Keys」
2. 點擊「Create API Key」
3. 輸入名稱（例如：`travelgenie-production`）
4. 選擇權限（選擇「Full Access」）
5. 點擊「Add」
6. 複製 API Key（只會顯示一次，請妥善保存）

### 步驟 4：設置發送者 Email（可選）

1. 在 Resend Dashboard 中，點擊左側「Domains」
2. 點擊「Add Domain」添加您的網域
3. 按照指示設置 DNS 記錄
4. 驗證網域後，可以使用 `noreply@yourdomain.com` 作為發送者

**注意**：如果沒有設置網域，可以使用 Resend 提供的測試 email：`onboarding@resend.dev`

### 步驟 5：設置環境變數

#### 本地開發環境（`.env.local`）

```env
# Resend Email 配置
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
# 或使用您驗證過的網域：
# RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### Vercel 生產環境

1. 前往 Vercel Dashboard
2. 選擇您的專案
3. 點擊「Settings」→「Environment Variables」
4. 添加以下環境變數：

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
```

5. 選擇環境（Production, Preview, Development）
6. 點擊「Save」
7. 重新部署應用

## ✅ 測試

### 測試 1：檢查環境變數

登入後，查看 Vercel 日誌，應該看到：

```
[sendWelcomeEmail] 郵件發送成功: { email: 'user@example.com', messageId: '...' }
```

### 測試 2：檢查郵箱

1. 使用新的 Google 帳號登入
2. 檢查該帳號的收件箱
3. 應該收到歡迎郵件

### 測試 3：查看 Resend Dashboard

1. 前往 Resend Dashboard
2. 點擊左側「Emails」
3. 應該看到發送的郵件記錄

## 🔍 故障排查

### 問題 1：郵件沒有發送

**檢查點：**
- ✅ `RESEND_API_KEY` 是否正確設置
- ✅ API Key 是否有效（沒有過期）
- ✅ 查看 Vercel 日誌是否有錯誤訊息

**解決方法：**
- 確認環境變數已正確設置
- 重新生成 API Key
- 檢查日誌中的錯誤訊息

### 問題 2：郵件進入垃圾郵件

**原因：**
- 使用 `onboarding@resend.dev` 作為發送者
- 沒有設置 SPF/DKIM 記錄

**解決方法：**
- 設置自己的網域並驗證
- 配置 SPF 和 DKIM 記錄
- 使用驗證過的網域作為發送者

### 問題 3：郵件發送失敗但不影響登入

**這是正常的！**

郵件發送是**非阻塞**的，即使發送失敗也不會影響用戶登入。這是設計上的考量，確保：
- 用戶體驗不受影響
- 系統穩定性更高
- 可以稍後重試發送

## 📊 Resend 免費層級限制

- ✅ 每月 3,000 封郵件
- ✅ 每天 100 封郵件
- ✅ 單一 API Key
- ✅ 基本分析功能

對於大多數應用來說，免費層級已經足夠使用。

## 🎨 自訂郵件內容

如需修改郵件內容，請編輯 `lib/email.ts` 中的 `sendWelcomeEmail` 函數。

## 📝 相關文件

- [Resend 官方文檔](https://resend.com/docs)
- [Resend API 參考](https://resend.com/docs/api-reference)

