# TravelGenie 技術架構報告

## 📋 目錄
1. [技術棧總覽](#技術棧總覽)
2. [前端架構](#前端架構)
3. [後端架構](#後端架構)
4. [資料庫設計](#資料庫設計)
5. [前後端串聯流程](#前後端串聯流程)
6. [認證與授權](#認證與授權)
7. [API 端點說明](#api-端點說明)
8. [狀態管理](#狀態管理)
9. [第三方服務整合](#第三方服務整合)

---

## 技術棧總覽

### 前端技術
- **框架**: Next.js 14.2.5 (React 18.3.1)
- **語言**: TypeScript 5.5.3
- **樣式**: Tailwind CSS 3.4.4
- **狀態管理**: Zustand 4.5.2
- **UI 圖標**: Lucide React 0.344.0
- **PDF 生成**: jsPDF 2.5.2 + html2canvas 1.4.1
- **行動端**: Capacitor 8.0.0 (iOS 支援)

### 後端技術
- **框架**: Next.js API Routes (Serverless Functions)
- **認證**: NextAuth.js 4.24.13 (Google OAuth)
- **資料庫**: Supabase (PostgreSQL)
- **AI 服務**: Google Generative AI (Gemini)
- **郵件服務**: Resend 6.6.0
- **地圖服務**: Google Maps API

---

## 前端架構

### 頁面結構 (App Router)

```
app/
├── page.tsx                    # 首頁
├── layout.tsx                  # 根布局（包含 AuthProvider）
├── plan/                       # 行程規劃頁面
│   └── page.tsx
├── history/                    # 行程歷史頁面
│   └── page.tsx
├── ai-plan/                    # AI 規劃頁面
│   └── page.tsx
├── settings/                   # 設定頁面
│   └── page.tsx
├── auth/                       # 認證相關
│   ├── signin/
│   ├── callback/              # OAuth 回調處理
│   └── error/
└── share/                      # 公開分享頁面
    └── [shareId]/
        └── page.tsx
```

### 組件架構

```
components/
├── AuthProvider.tsx            # NextAuth 提供者
├── BudgetHeader.tsx            # 預算顯示與操作按鈕
├── DaySection.tsx              # 單日行程區塊
├── ActivityCard.tsx            # 活動卡片
├── Clock.tsx                   # 時間與倒數顯示
├── FlightInfoModal.tsx         # 航班資訊與登機證
├── AIGeneratorModal.tsx        # AI 行程生成器
├── TripList.tsx                # 行程列表
└── ...
```

### 狀態管理 (Zustand)

#### 1. `useTravelStore` - 行程狀態
```typescript
// store/useTravelStore.ts
- tripSettings: 行程設定（預算、目的地、貨幣、開始日期）
- itinerary: 行程資料（每日活動）
- Actions: 新增/更新/刪除天數、活動、設定額外費用
- Computed: 計算總花費、剩餘預算、每日花費
```

#### 2. `useStorageStore` - 本地儲存
```typescript
// store/useStorageStore.ts
- currentTrip: 當前編輯的行程
- savedTrips: 已儲存的行程列表
- 與後端 API 同步（GET/POST/DELETE）
```

#### 3. `useLanguageStore` - 語言設定
```typescript
// store/useLanguageStore.ts
- 管理多語言切換
```

---

## 後端架構

### API 路由結構

```
app/api/
├── auth/
│   └── [...nextauth]/
│       └── route.ts           # NextAuth 認證處理
├── trips/
│   └── route.ts               # 行程 CRUD (GET/POST/DELETE)
├── share-trip/
│   └── route.ts               # 分享連結 (GET/POST)
├── gen-itinerary/
│   └── route.ts               # AI 行程生成
├── generate-boarding-pass/
│   └── route.ts               # 登機證圖片生成
├── flight-info/
│   └── route.ts               # 航班資訊查詢
├── translate-image/
│   └── route.ts               # 圖片翻譯
└── ...
```

### 中間件 (Middleware)

```typescript
// middleware.ts
- 使用 NextAuth middleware 保護路由
- 檢查認證狀態
- 支援 Cloudflare Zero Trust（可選）
- 保護的路由：/plan, /history, /settings, /api/trips
```

---

## 資料庫設計

### 資料庫：Supabase (PostgreSQL)

#### 1. `users` 表 - 用戶資料

```sql
CREATE TABLE users (
  email TEXT PRIMARY KEY,              -- 用戶 email（主鍵）
  name TEXT,                           -- 用戶名稱
  picture TEXT,                        -- 頭像 URL
  provider TEXT DEFAULT 'google',      -- OAuth 提供者
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_last_login_at ON users(last_login_at DESC);

-- RLS 策略
- Users can view own profile
- Users can update own profile
- Service role can manage users (後端自動創建/更新)
```

**用途**：
- 儲存所有使用 Google OAuth 登入的用戶資訊
- 在首次登入時自動創建記錄
- 每次登入時更新 `last_login_at`

#### 2. `trips` 表 - 行程資料

```sql
CREATE TABLE trips (
  id TEXT PRIMARY KEY,                 -- 行程 ID（格式：trip-{timestamp}-{random}-{userPrefix}）
  user_email TEXT NOT NULL,            -- 用戶 email（外鍵）
  name TEXT NOT NULL,                  -- 行程名稱
  settings JSONB NOT NULL,             -- 行程設定（預算、目的地、貨幣、開始日期）
  itinerary JSONB NOT NULL,            -- 行程內容（每日活動陣列）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_trips_user_email ON trips(user_email);
CREATE INDEX idx_trips_updated_at ON trips(updated_at DESC);

-- RLS 策略
- Users can view own trips
- Users can insert own trips
- Users can update own trips
- Users can delete own trips
```

**JSONB 結構範例**：

```json
// settings
{
  "totalBudget": 50000,
  "destination": "東京",
  "currency": "TWD",
  "startDate": "2026-01-15"
}

// itinerary
[
  {
    "dayId": 1,
    "date": "2026-01-15",
    "activities": [
      {
        "id": "1704067200000-abc123",
        "time": "09:00",
        "locationName": "淺草寺",
        "description": "東京最古老的寺廟",
        "googleMapQuery": "淺草寺 東京",
        "estimatedCost": 0,
        "actualCost": 0,
        "category": "sightseeing",
        "transportCostFromPrevious": 500
      }
    ],
    "extraExpenses": 0
  }
]
```

#### 3. `shared_trips` 表 - 分享連結

```sql
CREATE TABLE shared_trips (
  share_id TEXT PRIMARY KEY,           -- 分享 ID（格式：share-{timestamp}-{random}）
  trip_id TEXT,                        -- 原始行程 ID（可選）
  name TEXT NOT NULL,                  -- 行程名稱
  settings JSONB NOT NULL,             -- 行程設定
  itinerary JSONB NOT NULL,            -- 行程內容
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL  -- 30 天後過期
);

-- 索引
CREATE INDEX idx_shared_trips_share_id ON shared_trips(share_id);
CREATE INDEX idx_shared_trips_expires_at ON shared_trips(expires_at);

-- RLS 策略
- Anyone can view shared trips（公開訪問）
- Authenticated users can create shared trips
```

**用途**：
- 儲存可分享的行程連結
- 30 天後自動過期
- 不需要登入即可查看（公開）

---

## 前後端串聯流程

### 1. 用戶認證流程

```
用戶點擊登入
    ↓
前端：/auth/signin/page.tsx
    ↓
調用 NextAuth signIn('google')
    ↓
重定向到 Google OAuth
    ↓
用戶授權後回調
    ↓
後端：/api/auth/[...nextauth]/route.ts
    ↓
JWT Callback：
  1. 保存用戶到 Supabase (users 表)
  2. 發送歡迎郵件 (Resend)
    ↓
Session Callback：建立 session
    ↓
重定向到應用程式
```

**關鍵代碼** (`lib/auth.ts`):
```typescript
callbacks: {
  async jwt({ token, user, account }) {
    if (account && user) {
      // 首次登入
      await saveUserToDatabase(user.email, user.name, user.image);
      await sendWelcomeEmail({ email: user.email, name: user.name });
    }
    return token;
  }
}
```

### 2. 行程儲存流程

```
前端：用戶點擊「儲存」
    ↓
useStorageStore.saveCurrentTrip()
    ↓
POST /api/trips
    ↓
後端驗證：
  1. 檢查 session（NextAuth）
  2. 驗證 user_email
    ↓
Supabase 操作：
  - 檢查行程是否存在
  - 如果存在且屬於用戶 → UPDATE
  - 如果不存在或強制創建 → INSERT
    ↓
返回行程資料（包含 id, createdAt, updatedAt）
    ↓
前端更新狀態
```

**關鍵代碼** (`app/api/trips/route.ts`):
```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = await initializeSupabase();
  // 檢查是否存在
  const { data: existing } = await supabase
    .from('trips')
    .select('id, user_email')
    .eq('id', tripId)
    .maybeSingle();
  
  if (shouldForceCreate || !existing) {
    // 創建新行程
    await supabase.from('trips').insert(tripData);
  } else {
    // 更新現有行程（雙重驗證 user_email）
    await supabase
      .from('trips')
      .update(tripData)
      .eq('id', tripId)
      .eq('user_email', session.user.email);
  }
}
```

### 3. 行程載入流程

```
前端：進入 /history 頁面
    ↓
useEffect 觸發
    ↓
GET /api/trips
    ↓
後端驗證 session
    ↓
Supabase 查詢：
  SELECT * FROM trips 
  WHERE user_email = session.user.email
  ORDER BY updated_at DESC
    ↓
返回行程列表
    ↓
前端更新 useStorageStore.savedTrips
    ↓
渲染行程列表
```

### 4. AI 行程生成流程

```
前端：用戶填寫 AI 規劃表單
    ↓
POST /api/gen-itinerary
  Body: {
    destination, days, budget, 
    preferences, userApiKey, imageBase64
  }
    ↓
後端驗證 API Key
    ↓
調用 Google Generative AI (Gemini)
  - 模型優先順序：gemini-2.5-flash → gemini-2.5-pro
  - 如果有圖片：gemini-3-flash-preview
    ↓
AI 生成 JSON 行程
    ↓
後端處理：
  1. 解析 JSON
  2. 為每個活動生成 ID
  3. 轉換 cost → estimatedCost
  4. 驗證預算使用率（目標 90%）
    ↓
返回行程資料
    ↓
前端更新 useTravelStore
```

### 5. 分享連結流程

```
前端：用戶點擊「分享連結」
    ↓
POST /api/share-trip
  Body: { tripId, name, settings, itinerary }
    ↓
後端驗證 session
    ↓
生成唯一 shareId
    ↓
計算過期時間（30 天後）
    ↓
Supabase INSERT shared_trips
    ↓
返回 shareUrl: {baseUrl}/share/{shareId}
    ↓
前端顯示分享連結
```

**查看分享連結**：
```
用戶訪問 /share/{shareId}
    ↓
GET /api/share-trip?shareId={shareId}
    ↓
後端查詢 Supabase（不需要認證）
    ↓
檢查是否過期
    ↓
返回行程資料
    ↓
前端渲染（readOnly 模式）
```

---

## 認證與授權

### NextAuth.js 配置

**提供者**: Google OAuth 2.0

**環境變數**:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

**JWT Callback** (`lib/auth.ts`):
```typescript
async jwt({ token, user, account }) {
  if (account && user) {
    // 首次登入
    token.email = user.email;
    token.name = user.name;
    token.picture = user.image;
    
    // 保存到資料庫
    await saveUserToDatabase(user.email, user.name, user.image);
    
    // 發送歡迎郵件
    await sendWelcomeEmail({ email: user.email, name: user.name });
  }
  return token;
}
```

**Session Callback**:
```typescript
async session({ session, token }) {
  session.user.id = token.id;
  session.accessToken = token.accessToken;
  return session;
}
```

### 路由保護

**Middleware** (`middleware.ts`):
- 使用 `withAuth` 保護特定路由
- 檢查 JWT token
- 支援 Cloudflare Zero Trust（可選）

**保護的路由**:
- `/plan/*`
- `/history/*`
- `/settings/*`
- `/api/trips/*`

### 資料安全

1. **Row Level Security (RLS)**: Supabase 資料庫層級安全
2. **API 層驗證**: 每個 API 都檢查 `session.user.email`
3. **雙重驗證**: 查詢和更新時都驗證 `user_email`
4. **分享連結**: 公開訪問，但只讀模式

---

## API 端點說明

### 認證相關

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth 認證處理 |

### 行程管理

| 端點 | 方法 | 說明 | 認證 |
|------|------|------|------|
| `/api/trips` | GET | 獲取用戶所有行程 | ✅ |
| `/api/trips` | POST | 儲存/更新行程 | ✅ |
| `/api/trips?id={id}` | DELETE | 刪除行程 | ✅ |

### 分享功能

| 端點 | 方法 | 說明 | 認證 |
|------|------|------|------|
| `/api/share-trip` | POST | 創建分享連結 | ✅ |
| `/api/share-trip?shareId={id}` | GET | 獲取分享行程 | ❌ |

### AI 功能

| 端點 | 方法 | 說明 | 認證 |
|------|------|------|------|
| `/api/gen-itinerary` | POST | AI 生成行程 | ❌ |
| `/api/generate-boarding-pass` | POST | 生成登機證圖片 | ❌ |
| `/api/translate-image` | POST | 圖片翻譯 | ❌ |

### 其他

| 端點 | 方法 | 說明 | 認證 |
|------|------|------|------|
| `/api/flight-info` | POST | 查詢航班資訊 | ❌ |

---

## 狀態管理

### Zustand Store 架構

#### 1. `useTravelStore` - 行程編輯狀態

**狀態**:
- `tripSettings`: 行程設定
- `itinerary`: 每日行程陣列

**Actions**:
- `setTripSettings()`: 設定行程參數
- `setItinerary()`: 設定完整行程
- `addDay()`: 新增一天
- `updateDay()`: 更新某天
- `addActivity()`: 新增活動
- `updateActivity()`: 更新活動
- `deleteActivity()`: 刪除活動
- `deleteDay()`: 刪除一天
- `setExtraExpenses()`: 設定額外費用

**Computed**:
- `getTotalSpent()`: 計算總花費
- `getRemainingBudget()`: 計算剩餘預算
- `getTodaySpent(dayId)`: 計算某天花費

#### 2. `useStorageStore` - 持久化儲存

**狀態**:
- `currentTrip`: 當前編輯的行程
- `savedTrips`: 已儲存的行程列表

**Actions**:
- `saveCurrentTrip()`: 儲存到後端
- `loadTrip(id)`: 從後端載入
- `updateCurrentTrip()`: 更新當前行程（本地）
- `clearCurrentTrip()`: 清除當前行程

**與後端同步**:
- `saveCurrentTrip()` → POST `/api/trips`
- `loadTrip()` → GET `/api/trips` → 過濾出指定 ID

---

## 第三方服務整合

### 1. Supabase

**用途**: PostgreSQL 資料庫 + 認證

**初始化** (`lib/supabase.ts`):
```typescript
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

**使用場景**:
- 儲存用戶資料 (`users` 表)
- 儲存行程資料 (`trips` 表)
- 儲存分享連結 (`shared_trips` 表)

### 2. Google Generative AI (Gemini)

**用途**: AI 行程生成、登機證圖片生成、圖片翻譯

**模型**:
- `gemini-2.5-flash`: 文字生成（優先）
- `gemini-2.5-pro`: 文字生成（備用）
- `gemini-3-flash-preview`: 視覺模型（圖片輸入）

**API Key**: 用戶自行提供（儲存在前端 localStorage）

### 3. Resend

**用途**: 發送歡迎郵件

**初始化** (`lib/email.ts`):
```typescript
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL,
  to: email,
  subject: '歡迎使用 Olaf Tourism Planner！',
  html: htmlContent, // 自訂 HTML 模板
});
```

### 4. Google Maps API

**用途**: 地圖顯示、地點搜尋、路線規劃

**載入方式**:
- 服務端：`layout.tsx` 中使用環境變數
- 客戶端：`GoogleMapsLoader.tsx` 中使用用戶設定的 API Key

### 5. NextAuth.js

**用途**: Google OAuth 認證

**流程**:
1. 用戶點擊登入
2. 重定向到 Google
3. 授權後回調
4. JWT Callback 處理
5. Session Callback 建立 session

---

## 資料流程圖

### 行程儲存流程

```
[前端] useStorageStore.saveCurrentTrip()
         ↓
[API] POST /api/trips
         ↓
[後端] 驗證 session
         ↓
[後端] 檢查 Supabase 是否存在
         ↓
[Supabase] INSERT 或 UPDATE
         ↓
[後端] 返回行程資料
         ↓
[前端] 更新狀態
```

### AI 生成流程

```
[前端] 提交表單
         ↓
[API] POST /api/gen-itinerary
         ↓
[後端] 驗證 API Key
         ↓
[Gemini API] 生成行程 JSON
         ↓
[後端] 處理與驗證
         ↓
[前端] 更新 useTravelStore
```

### 分享流程

```
[前端] 點擊分享
         ↓
[API] POST /api/share-trip
         ↓
[後端] 生成 shareId
         ↓
[Supabase] INSERT shared_trips
         ↓
[前端] 顯示分享連結
         ↓
[公開] GET /share/{shareId}
         ↓
[API] GET /api/share-trip?shareId={id}
         ↓
[Supabase] SELECT shared_trips
         ↓
[前端] 渲染（readOnly）
```

---

## 安全機制

### 1. 認證層
- NextAuth.js JWT 認證
- Session 管理
- 路由保護（Middleware）

### 2. 資料庫層
- Row Level Security (RLS)
- 用戶只能訪問自己的資料
- Service Role Key 僅用於後端

### 3. API 層
- 每個 API 都驗證 session
- 雙重驗證 `user_email`
- 分享連結公開但只讀

### 4. 前端層
- 敏感操作需要認證
- 分享頁面禁用編輯/刪除

---

## 部署架構

### 生產環境
- **平台**: Vercel
- **資料庫**: Supabase (雲端 PostgreSQL)
- **CDN**: Vercel Edge Network
- **認證**: NextAuth.js (Serverless)

### 環境變數

**必需**:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**可選**:
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `CLOUDFLARE_ACCESS_AUDIENCE`

---

## 總結

### 技術特點
1. **全棧 Next.js**: 前後端統一框架
2. **Serverless**: API Routes 自動擴展
3. **TypeScript**: 型別安全
4. **Supabase**: 快速資料庫設置
5. **NextAuth**: 簡化認證流程
6. **Zustand**: 輕量狀態管理
7. **AI 整合**: Gemini 多模型支援

### 資料流
- **前端** → Zustand Store → API Routes → Supabase
- **認證** → NextAuth → JWT → Session
- **AI** → Gemini API → 後端處理 → 前端更新

### 擴展性
- 支援多用戶（RLS）
- 支援分享功能（公開連結）
- 支援行動端（Capacitor iOS）
- 支援 PWA（可安裝）

---

**報告生成時間**: 2026-01-02
**專案版本**: 0.1.0

