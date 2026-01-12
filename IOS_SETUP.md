# iOS App 設定指南（自己用，不上架）

## 方案 1：Safari「加入主畫面」（最簡單，推薦）

### 步驟：
1. 在 iPhone Safari 打開 `https://www.ihaveatree.shop`
2. 點擊底部的「分享」按鈕（方框帶向上箭頭）
3. 選擇「加入主畫面」
4. 可以自訂名稱（預設是 "Olaf planner"）
5. 點擊「加入」

完成！現在主畫面會有一個 App 圖示，點開後會全螢幕運行，就像原生 App 一樣。

### 優點：
- ✅ 零成本、零設定
- ✅ 立即可用
- ✅ 不需要 Apple Developer 帳號
- ✅ 不需要 Xcode

### 限制：
- ⚠️ 功能與網頁版相同（沒有原生推播、離線快取等）
- ⚠️ 需要網路連線

---

## 方案 2：用 Xcode 打包成 iOS App（需要 Mac）

如果你想有更原生的體驗（例如離線快取、原生推播等），可以用 Capacitor 打包。

### 前置需求：
- ✅ Mac（你已經有）
- ✅ Xcode（從 App Store 免費下載）
- ✅ Apple ID（免費，不需要付費開發者帳號）

### 步驟：

#### 1. 安裝 Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios --save
```

#### 2. 初始化 Capacitor

```bash
npx cap init "Olaf tourism planner" com.yourname.olafplanner
```

這會建立 `capacitor.config.ts` 檔案。

#### 3. 設定 Capacitor（使用線上網站）

編輯 `capacitor.config.ts`：

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.olafplanner',
  appName: 'Olaf tourism planner',
  webDir: 'out', // Next.js 輸出目錄（如果使用靜態輸出）
  server: {
    url: 'https://www.ihaveatree.shop', // 直接使用線上網站
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f5f5dc',
    },
  },
};

export default config;
```

#### 4. 新增 iOS 平台

```bash
npx cap add ios
```

#### 5. 在 Xcode 中開啟專案

```bash
npx cap open ios
```

#### 6. 在 Xcode 中設定

1. **選擇專案**（左側導航欄最上方）
2. **General 標籤**：
   - Display Name: `Olaf tourism planner`
   - Bundle Identifier: `com.yourname.olafplanner`（改成你自己的）
   - Version: `1.0.0`
   - Build: `1`
3. **Signing & Capabilities 標籤**：
   - 勾選 "Automatically manage signing"
   - Team: 選擇你的 Apple ID（免費帳號即可）
4. **Info 標籤**：
   - 如果有使用相機/相簿，需要添加權限描述：
     - `NSCameraUsageDescription`: "需要相機權限以拍攝照片進行翻譯"
     - `NSPhotoLibraryUsageDescription`: "需要相簿權限以上傳照片進行翻譯"

#### 7. 連接到 iPhone 並執行

1. 用 USB 連接 iPhone 到 Mac
2. 在 iPhone 上：設定 → 一般 → VPN 與裝置管理 → 信任這台電腦
3. 在 Xcode 中選擇你的 iPhone 作為執行目標
4. 點擊「Run」按鈕（或按 `Cmd + R`）

#### 8. 信任開發者（第一次安裝時）

在 iPhone 上：
- 設定 → 一般 → VPN 與裝置管理
- 點擊你的 Apple ID
- 點擊「信任」

完成！現在 App 已經安裝到你的 iPhone 上了。

### 優點：
- ✅ 更像原生 App（離線快取、原生推播等）
- ✅ 可以使用原生 API（相機、相簿、推播等）
- ✅ 不需要付費開發者帳號（免費 Apple ID 即可）

### 限制：
- ⚠️ 需要 Mac 和 Xcode
- ⚠️ 免費帳號的 App 有效期 7 天（之後需要重新安裝）
- ⚠️ 只能安裝到自己的 iPhone（不能分享給其他人）

---

## 建議

**如果你只是自己用，建議直接用「方案 1：Safari 加入主畫面」**，因為：
- 零設定、立即可用
- 功能已經足夠（你的網站已經有完整的 PWA 設定）
- 不需要維護額外的 iOS 專案

只有在需要原生功能（例如離線快取、推播通知）時，才考慮方案 2。

