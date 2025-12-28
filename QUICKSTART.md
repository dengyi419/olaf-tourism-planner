# TravelGenie 快速啟動指南

## 🚀 快速開始

### 1. 安裝依賴

```bash
cd /Users/dengyi/travelgenie
npm install
```

### 2. 設定環境變數

複製 `.env.example` 並填入你的 Gemini API Key：

```bash
cp .env.example .env.local
```

編輯 `.env.local`，填入你的 Google Gemini API Key：

```env
GEMINI_API_KEY=your_actual_api_key_here
```

**如何取得 Gemini API Key：**
1. 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登入你的 Google 帳號
3. 點擊「Create API Key」
4. 複製產生的 API Key 到 `.env.local`

### 3. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

## 📋 功能測試清單

### ✅ AI 智能推薦
- [ ] 點擊「開始規劃行程」按鈕
- [ ] 輸入目的地（例如：東京）
- [ ] 設定天數（例如：3 天）
- [ ] 設定總預算（例如：50000 TWD）
- [ ] 點擊「生成行程」
- [ ] 確認 AI 生成的行程出現在列表中

### ✅ 行程編輯功能
- [ ] 點擊行程卡片的「編輯」按鈕
- [ ] 修改時間、地點名稱、描述、花費
- [ ] 點擊「儲存」確認修改成功
- [ ] 點擊「刪除」按鈕移除行程

### ✅ 新增行程
- [ ] 點擊「新增行程」按鈕
- [ ] 填寫新行程資訊
- [ ] 確認新行程出現在列表中

### ✅ 預算追蹤
- [ ] 確認頂部顯示「今日總花費」
- [ ] 確認顯示「已花費」和「剩餘預算」
- [ ] 修改行程花費，確認預算即時更新
- [ ] 確認預算使用率進度條正常顯示

### ✅ 地圖整合
- [ ] 點擊行程卡片的「導航」按鈕
- [ ] 確認開啟 Google Maps 搜尋頁面
- [ ] 確認地圖連結正確指向該地點

## 🐛 常見問題

### 問題：AI 生成失敗 - API 金鑰無效
**錯誤訊息：** `API key not valid. Please pass a valid API key.`

**解決方案：**
1. **確認 `.env.local` 檔案存在**
   ```bash
   # 在專案根目錄建立 .env.local 檔案
   touch .env.local
   ```

2. **確認 API 金鑰格式正確**
   - Gemini API 金鑰通常以 `AIza` 開頭
   - 格式範例：`AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`
   - 確認沒有多餘的空格或換行

3. **檢查 `.env.local` 內容**
   ```env
   GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
   ```
   ⚠️ **注意：** 不要使用引號包住 API 金鑰

4. **重新取得 API 金鑰**
   - 前往 [Google AI Studio](https://makersuite.google.com/app/apikey)
   - 登入你的 Google 帳號
   - 點擊「Create API Key」或「Get API Key」
   - 複製新的 API 金鑰到 `.env.local`

5. **重新啟動開發伺服器**
   ```bash
   # 停止目前的伺服器 (Ctrl+C)
   # 重新啟動
   npm run dev
   ```
   ⚠️ **重要：** 修改 `.env.local` 後必須重新啟動伺服器才會生效

6. **檢查終端機錯誤訊息**
   - 如果看到 `GEMINI_API_KEY 未設定`，表示環境變數未正確載入
   - 確認檔案名稱是 `.env.local`（不是 `.env` 或 `.env.example`）
   - 確認檔案在專案根目錄（與 `package.json` 同一層）

### 問題：樣式未正確載入
**解決方案：**
- 確認已執行 `npm install`
- 確認 `tailwind.config.ts` 中的 `content` 路徑正確
- 重新啟動開發伺服器

### 問題：TypeScript 錯誤
**解決方案：**
- 確認已安裝所有依賴：`npm install`
- 確認 `tsconfig.json` 中的路徑別名設定正確
- 檢查是否有缺少的類型定義

## 📝 專案結構說明

```
travelgenie/
├── app/                      # Next.js App Router
│   ├── api/
│   │   └── gen-itinerary/   # AI 行程生成 API 端點
│   ├── globals.css          # 全域樣式（Tailwind）
│   ├── layout.tsx           # Root Layout
│   └── page.tsx             # 主頁面
├── components/               # React 組件
│   ├── ActivityCard.tsx     # 單一行程卡片
│   ├── AIGeneratorModal.tsx # AI 生成 Modal
│   ├── BudgetHeader.tsx     # 預算標題列
│   └── DaySection.tsx       # 單日行程區塊
├── store/                    # Zustand 狀態管理
│   └── useTravelStore.ts    # 行程與預算狀態
├── types/                    # TypeScript 類型定義
│   └── index.ts             # Activity, DayItinerary, TripSettings
└── package.json
```

## 🎯 下一步開發建議

1. **本地儲存**：使用 `localStorage` 或 `IndexedDB` 儲存行程資料
2. **拖曳排序**：整合 `react-beautiful-dnd` 或 `@dnd-kit/core`
3. **匯出功能**：支援匯出為 PDF 或 CSV
4. **分享功能**：生成分享連結
5. **多語言支援**：i18n 國際化

## 📚 相關文件

- [Next.js 文件](https://nextjs.org/docs)
- [Zustand 文件](https://zustand-demo.pmnd.rs/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

