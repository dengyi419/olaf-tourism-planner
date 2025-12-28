# 資料庫遷移指南

## ⚠️ 當前狀態

**目前使用的是內存存儲（Map），不是真實資料庫。**

這意味著：
- ❌ 數據只存在於服務器內存中
- ❌ 服務器重啟後數據會丟失
- ❌ 在 Vercel 無服務器環境中，每次請求可能在不同實例，數據無法持久化
- ❌ 不同用戶的數據可能混在一起（雖然有按 email 分組）

## ✅ 需要遷移到真實資料庫

為了永久保存每位使用者的行程，需要遷移到真實資料庫。

---

## 🎯 推薦方案：Supabase（最簡單）

Supabase 是最適合 Vercel 部署的選擇，因為：
- ✅ 免費層級足夠使用
- ✅ 提供 PostgreSQL 資料庫
- ✅ 自動處理連接池
- ✅ 提供 REST API 和即時功能
- ✅ 易於設置和維護

### 設置步驟

#### 1. 創建 Supabase 專案

1. 前往：https://supabase.com/
2. 註冊/登入帳號
3. 點擊「New Project」
4. 填寫專案信息：
   - Project Name: `olaf-tourism-planner`
   - Database Password: 設置一個強密碼（記下來！）
   - Region: 選擇離您最近的區域
5. 點擊「Create new project」
6. 等待專案創建完成（約 2 分鐘）

#### 2. 獲取連接信息

1. 在 Supabase Dashboard 中，點擊左側「Settings」→「API」
2. 複製以下信息：
   - `Project URL`（例如：`https://xxxxx.supabase.co`）
   - `anon public` key
   - `service_role` key（用於服務器端）

#### 3. 創建資料表

在 Supabase Dashboard 中：

1. 點擊左側「SQL Editor」
2. 點擊「New query」
3. 執行以下 SQL：

```sql
-- 創建 trips 表
CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  settings JSONB NOT NULL,
  itinerary JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引以提高查詢性能
CREATE INDEX idx_trips_user_email ON trips(user_email);
CREATE INDEX idx_trips_updated_at ON trips(updated_at DESC);

-- 啟用 Row Level Security (RLS)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- 創建策略：用戶只能訪問自己的行程
CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can insert own trips"
  ON trips FOR INSERT
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  USING (auth.email() = user_email);

CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  USING (auth.email() = user_email);
```

#### 4. 安裝 Supabase 客戶端

```bash
npm install @supabase/supabase-js
```

#### 5. 設置環境變數

在 Vercel 環境變數中添加：

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🔄 方案 2：Vercel Postgres（Vercel 原生）

如果使用 Vercel，可以考慮 Vercel Postgres：

### 優點：
- ✅ 與 Vercel 完美集成
- ✅ 自動擴展
- ✅ 無需額外配置

### 設置步驟：

1. 在 Vercel Dashboard 中，點擊「Storage」→「Create Database」
2. 選擇「Postgres」
3. 創建資料庫
4. 在環境變數中會自動添加 `POSTGRES_URL`

---

## 🔄 方案 3：MongoDB Atlas（文檔型資料庫）

適合喜歡 NoSQL 的開發者：

### 設置步驟：

1. 前往：https://www.mongodb.com/cloud/atlas
2. 創建免費集群
3. 獲取連接字符串
4. 安裝 Mongoose：`npm install mongoose`

---

## 📝 遷移代碼示例（Supabase）

以下是使用 Supabase 的示例代碼：

### 1. 創建 Supabase 客戶端

創建 `lib/supabase.ts`：

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

### 2. 更新 API Route

修改 `app/api/trips/route.ts`：

```typescript
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: 獲取用戶的所有行程
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_email', session.user.email)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ trips: data || [] });
  } catch (error: any) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips', details: error.message },
      { status: 500 }
    );
  }
}

// POST: 保存或更新行程
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, settings, itinerary } = body;

    if (!settings || !itinerary) {
      return NextResponse.json(
        { error: 'Missing required fields: settings, itinerary' },
        { status: 400 }
      );
    }

    const tripData = {
      id: id || `trip-${Date.now()}`,
      user_email: session.user.email,
      name: name || `行程 ${new Date().toLocaleDateString('zh-TW')}`,
      settings,
      itinerary,
      updated_at: new Date().toISOString(),
    };

    // 檢查是否已存在
    const { data: existing } = await supabase
      .from('trips')
      .select('id, created_at')
      .eq('id', tripData.id)
      .eq('user_email', session.user.email)
      .single();

    if (existing) {
      // 更新現有行程
      const { data, error } = await supabase
        .from('trips')
        .update(tripData)
        .eq('id', tripData.id)
        .eq('user_email', session.user.email)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ trip: data, success: true });
    } else {
      // 創建新行程
      tripData.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ trip: data, success: true });
    }
  } catch (error: any) {
    console.error('Error saving trip:', error);
    return NextResponse.json(
      { error: 'Failed to save trip', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: 刪除行程
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('id');

    if (!tripId) {
      return NextResponse.json(
        { error: 'Missing trip id' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
      .eq('user_email', session.user.email);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { error: 'Failed to delete trip', details: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🚀 快速開始（Supabase）

1. **創建 Supabase 專案**（5 分鐘）
2. **執行 SQL 創建表**（2 分鐘）
3. **安裝依賴**：`npm install @supabase/supabase-js`
4. **設置環境變數**（在 Vercel）
5. **更新代碼**（使用上面的示例）
6. **測試**：創建一個行程，確認保存成功

---

## 📊 資料庫選項對比

| 選項 | 優點 | 缺點 | 適合場景 |
|------|------|------|----------|
| **Supabase** | 免費、易用、功能完整 | 免費層有使用限制 | 推薦 ⭐⭐⭐⭐⭐ |
| **Vercel Postgres** | 與 Vercel 完美集成 | 需要 Vercel Pro 計劃 | Vercel 用戶 |
| **MongoDB Atlas** | 免費、文檔型 | 需要學習 MongoDB | 喜歡 NoSQL |
| **PlanetScale** | 免費、MySQL | 需要學習 MySQL | 需要 MySQL |

---

## ⚠️ 重要提醒

1. **備份數據**：在遷移前，確保現有數據已備份
2. **測試環境**：先在測試環境中測試遷移
3. **數據遷移**：如果有現有用戶數據，需要編寫遷移腳本
4. **環境變數**：確保生產環境的環境變數已正確設置

---

