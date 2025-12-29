# AviationStack API 整合指南

本指南將幫助您整合 AviationStack API 以獲取實時航班信息。

## 步驟 1: 註冊 AviationStack 帳戶

1. 前往 [AviationStack](https://aviationstack.com/)
2. 點擊 "Sign Up" 或 "Get Started"
3. 創建帳戶並完成註冊

## 步驟 2: 申請 API Key

1. 登入 AviationStack 帳戶
2. 前往 [Dashboard](https://aviationstack.com/dashboard)
3. 在 "API Access" 或 "API Keys" 區域
4. 點擊 "Generate API Key" 或複製現有的 API Key
5. 選擇適合的訂閱層級：
   - **Free Plan**: 免費，但有限制（每月 100 次請求）
   - **Paid Plans**: 付費方案，提供更多請求次數和功能

## 步驟 3: 在應用中設定 API Key

1. 打開應用程式
2. 前往「主選單」→「API 金鑰設定」
3. 在 "AviationStack API Key" 欄位中貼上您的 API Key
4. 點擊「儲存設定」

## 步驟 4: 測試航班查詢

1. 前往「主選單」→「查詢航班信息」
2. 輸入航班編號（例如：CI100、BR101）
   - 注意：使用 IATA 格式（如 CI100）或 ICAO 格式
3. 點擊搜尋按鈕
4. 如果 API Key 正確，將顯示實時航班信息

## API 端點說明

AviationStack API 使用以下端點：

```
GET https://api.aviationstack.com/v1/flights?access_key={api_key}&flight_iata={flight_number}&limit=1
```

### 認證方式

使用 Query Parameter：
- `access_key`: 您的 API Key

### 請求範例

```bash
curl "https://api.aviationstack.com/v1/flights?access_key=YOUR_API_KEY&flight_iata=CI100&limit=1"
```

## 返回數據格式

AviationStack API 返回的數據包含：
- 航班編號（IATA 和 ICAO）
- 出發地（機場代碼、城市、航廈、登機門）
- 目的地（機場代碼、城市、航廈、登機門、行李轉盤）
- 航班狀態（scheduled, active, landed, cancelled, incident, diverted, redirected）
- 計劃時間和實際時間

## 常見問題

### Q: API Key 無效錯誤
**A:** 請確認：
- API Key 是否正確複製（沒有多餘空格）
- API Key 是否已啟用
- 訂閱層級是否允許使用該功能

### Q: 找不到航班信息
**A:** 可能原因：
- 航班編號格式不正確（應使用 IATA 格式，如 CI100）
- 該航班不在 AviationStack 數據庫中
- API 配額已用完
- 航班編號需要使用 `flight_iata` 參數（IATA 格式）或 `flight_icao` 參數（ICAO 格式）

### Q: 如何查看 API 使用情況？
**A:** 登入 [AviationStack Dashboard](https://aviationstack.com/dashboard) 查看：
- API 請求次數
- 剩餘配額
- 使用統計

### Q: 支援哪些航班編號格式？
**A:** AviationStack 支援：
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

詳細定價請參考 [AviationStack 定價頁面](https://aviationstack.com/pricing)

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

4. **HTTPS vs HTTP**：
   - 建議使用 HTTPS（如果 API 支持）
   - 某些計劃可能只支援 HTTPS

## 技術支援

如有問題，請參考：
- [AviationStack API 文檔](https://aviationstack.com/documentation)
- [AviationStack 支援](https://aviationstack.com/support)

## 與 FlightAware 的差異

- **認證方式**：AviationStack 使用 Query Parameter，FlightAware 使用 Basic Auth
- **數據格式**：返回的 JSON 結構不同
- **免費配額**：AviationStack 免費計劃提供 100 次/月，FlightAware 也類似
- **API 端點**：不同的 URL 和參數格式

