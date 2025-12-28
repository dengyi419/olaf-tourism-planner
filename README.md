# TravelGenie - AI 智能旅遊規劃 Web App

一個結合 AI 智能排程、地圖整合、記帳管理與完全可編輯行程表的旅遊規劃工具。

## 功能特色

- 🤖 **AI 智能推薦**：使用 Google Gemini API 自動生成旅遊行程
- 🗺️ **地圖整合**：每個行程都支援 Google Maps 導航
- 💰 **記帳管理**：即時追蹤預算與花費
- ✏️ **完全可編輯**：所有 AI 推薦的行程都可以自由修改、新增、刪除
- 📱 **響應式設計**：支援桌面與行動裝置

## 技術棧

- **Frontend**: Next.js 14+ (App Router), Tailwind CSS, Lucide React
- **State Management**: Zustand
- **AI Integration**: Google Gemini API (@google/generative-ai)
- **Maps**: Google Maps Embed API

## 開始使用

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

建立 `.env.local` 檔案：

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 執行開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看應用程式。

## 專案結構

```
travelgenie/
├── app/
│   ├── api/
│   │   └── gen-itinerary/    # AI 行程生成 API
│   ├── globals.css           # 全域樣式
│   ├── layout.tsx            # Root Layout
│   └── page.tsx              # 主頁面
├── components/
│   ├── ActivityCard.tsx      # 行程卡片組件
│   ├── AIGeneratorModal.tsx  # AI 生成 Modal
│   ├── BudgetHeader.tsx      # 預算標題列
│   └── DaySection.tsx        # 單日行程區塊
├── store/
│   └── useTravelStore.ts     # Zustand 狀態管理
├── types/
│   └── index.ts              # TypeScript 類型定義
└── package.json
```

## 核心功能說明

### 1. AI 智能推薦

- 使用者輸入目的地、天數、預算與偏好
- 後端 API 串接 Google Gemini Pro
- AI 回傳符合資料結構的 JSON
- 自動轉換為可編輯的行程表

### 2. 行程管理 (CRUD)

- **新增**：手動新增行程項目
- **編輯**：點擊編輯按鈕修改時間、地點、描述、花費
- **刪除**：移除不需要的行程
- **排序**：可透過拖曳調整順序（未來功能）

### 3. 預算追蹤

- 即時計算總花費與剩餘預算
- 顯示每日花費明細
- 預算使用率視覺化

### 4. 地圖整合

- 每個行程卡片都有「導航」按鈕
- 點擊後開啟 Google Maps 搜尋頁面

## 資料結構

```typescript
type Activity = {
  id: string;
  time: string;
  locationName: string;
  description: string;
  googleMapQuery: string;
  cost: number;
  category: 'food' | 'transport' | 'sightseeing' | 'shopping';
};

type DayItinerary = {
  dayId: number;
  date?: string;
  activities: Activity[];
};

type TripSettings = {
  totalBudget: number;
  destination: string;
  currency: string;
};
```

## 注意事項

1. 確保已設定 `GEMINI_API_KEY` 環境變數
2. Google Maps 導航功能需要網路連線
3. 所有資料目前儲存在記憶體中，重新整理頁面會重置（未來可加入本地儲存）

## License

MIT

