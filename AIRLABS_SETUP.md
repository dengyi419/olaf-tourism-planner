

# AirLabs API 整合指南

本指南將幫助您整合 AirLabs API 以獲取實時航班信息。

## 步驟 1: 註冊 AirLabs 帳戶

1. 前往 [AirLabs](https://airlabs.co/)
2. 點擊 "Sign Up" 或 "Get Started"
3. 創建帳戶並完成註冊

## 步驟 2: 申請 API Key

1. 登入 AirLabs 帳戶
2. 前往 [Dashboard](https://airlabs.co/dashboard)
3. 在 "API Keys" 或 "API Access" 區域
4. 點擊 "Generate API Key" 或複製現有的 API Key
5. 選擇適合的訂閱層級：
   - **Free Plan**: 免費，但有限制（每月 100 次請求）
   - **Paid Plans**: 付費方案，提供更多請求次數和功能

## 步驟 3: 在應用中設定 API Key

1. 打開應用程式
2. 前往「主選單」→「API 金鑰設定」
3. 在 "AirLabs API Key" 欄位中貼上您的 API Key
4. 點擊「儲存設定」

## 步驟 4: 測試航班查詢

1. 前往「主選單」→「查詢航班信息」
2. 輸入航班編號（例如：CI100、BR101）
   - 注意：使用 IATA 格式（如 CI100）或 ICAO 格式
3. 選擇要查詢的日期（可選，預設為今天）
4. 點擊搜尋按鈕
5. 如果 API Key 正確，將顯示實時航班信息

## API 端點說明

AirLabs API 使用以下端點：

```
GET https://airlabs.co/api/v9/flight?api_key={api_key}&flight_iata={flight_number}&date={date}
```

### 認證方式

使用 Query Parameter：
- `api_key`: 您的 API Key
- `flight_iata`: 航班編號（IATA 格式）
- `date`: 查詢日期（可選，格式：YYYY-MM-DD）

### 請求範例

```bash
curl "https://airlabs.co/api/v9/flight?api_key=YOUR_API_KEY&flight_iata=CI100&date=2024-12-30"
```

## 返回數據格式

AirLabs API 返回的數據包含：
- 航班編號（IATA 和 ICAO）
- 出發地（機場代碼、城市、航廈、登機門）
- 目的地（機場代碼、城市、航廈、登機門、行李轉盤）
- 航班狀態
- 計劃時間和實際時間（Unix 時間戳）

## 常見問題

### Q: API Key 無效錯誤
**A:** 請確認：
- API Key 是否正確複製（沒有多餘空格）
- API Key 是否已啟用
- 訂閱層級是否允許使用該功能

### Q: 找不到航班信息
**A:** 可能原因：
- 航班編號格式不正確（應使用 IATA 格式，如 CI100）
- 該航班不在 AirLabs 數據庫中
- API 配額已用完
- 查詢的日期沒有該航班

### Q: 如何查看 API 使用情況？
**A:** 登入 [AirLabs Dashboard](https://airlabs.co/dashboard) 查看：
- API 請求次數
- 剩餘配額
- 使用統計

### Q: 支援哪些航班編號格式？
**A:** AirLabs 支援：
- **IATA 格式**：如 CI100, BR101（使用 `flight_iata` 參數）
- **ICAO 格式**：如 CAL100, EVA101（使用 `flight_icao` 參數）

## 訂閱層級說明

### Free Plan（免費）
- 每月 100 次請求
- 基本航班信息
- 適合個人使用和測試

### Paid Plans（付費）
- 更多請求次數（1,000 - 1,000,000+ 次/月）
- 更詳細的航班信息
- 實時追蹤功能
- 歷史數據查詢
- 優先支援

詳細定價請參考 [AirLabs 定價頁面](https://airlabs.co/pricing)

## 注意事項

1. **API Key 安全**：
   - 不要將 API Key 分享給他人
   - 不要在公開代碼庫中提交 API Key
   - 定期檢查 API Key 使用情況

2. **請求限制**：
   - 遵守 API 使用限制
   - 避免過度頻繁的請求
   - 考慮實現請求緩存

3. **數據準確性**：
   - 航班信息可能因實際情況而變動
   - 建議以機場公告為準
   - 重要行程請提前確認

4. **時間格式**：
   - AirLabs API 返回的時間是 Unix 時間戳（秒）
   - 應用會自動轉換為本地時間格式

## 技術支援

如有問題，請參考：
- [AirLabs API 文檔](https://airlabs.co/docs/)
- [AirLabs 支援](https://airlabs.co/support)

## 與 AviationStack 的差異

- **認證方式**：AirLabs 使用 `api_key` 參數，AviationStack 使用 `access_key`
- **數據格式**：返回的 JSON 結構不同，時間格式為 Unix 時間戳
- **API 端點**：不同的 URL 和參數格式
- **免費配額**：AirLabs 免費計劃提供 100 次/月，與 AviationStack 類似

