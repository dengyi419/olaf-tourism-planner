# FlightAware API 整合指南

本指南將幫助您整合 FlightAware AeroAPI 以獲取實時航班信息。

## 步驟 1: 註冊 FlightAware 帳戶

1. 前往 [FlightAware AeroAPI](https://flightaware.com/aeroapi/)
2. 點擊 "Sign Up" 或 "Get Started"
3. 創建帳戶並完成註冊

## 步驟 2: 申請 API Key

1. 登入 FlightAware 帳戶
2. 前往 [AeroAPI Dashboard](https://flightaware.com/aeroapi/dashboard/)
3. 點擊 "Create API Key" 或 "Generate Key"
4. 選擇適合的訂閱層級：
   - **Free Tier**: 免費，但有限制
   - **Paid Tiers**: 付費方案，提供更多請求次數和功能
5. 複製生成的 API Key

## 步驟 3: 在應用中設定 API Key

1. 打開應用程式
2. 前往「主選單」→「API 金鑰設定」
3. 在 "FlightAware API Key" 欄位中貼上您的 API Key
4. 點擊「儲存設定」

## 步驟 4: 測試航班查詢

1. 前往「主選單」→「查詢航班信息」
2. 輸入航班編號（例如：CI100、BR101）
3. 點擊搜尋按鈕
4. 如果 API Key 正確，將顯示實時航班信息

## API 端點說明

FlightAware AeroAPI 使用以下端點：

```
GET https://aeroapi.flightaware.com/aeroapi/flights/{flight_number}
```

### 認證方式

使用 Basic Authentication：
- 用戶名：您的 API Key
- 密碼：留空

### 請求範例

```bash
curl -X GET \
  "https://aeroapi.flightaware.com/aeroapi/flights/CI100" \
  -H "Authorization: Basic {base64_encoded_api_key}"
```

## 返回數據格式

FlightAware API 返回的數據包含：
- 航班編號
- 出發地（機場代碼、城市、航廈、登機門）
- 目的地（機場代碼、城市、航廈、登機門、行李轉盤）
- 航班狀態
- 計劃時間和實際時間

## 常見問題

### Q: API Key 無效錯誤
**A:** 請確認：
- API Key 是否正確複製（沒有多餘空格）
- API Key 是否已啟用
- 訂閱層級是否允許使用該功能

### Q: 找不到航班信息
**A:** 可能原因：
- 航班編號格式不正確（應為：航空公司代碼 + 數字，如 CI100）
- 該航班不在 FlightAware 數據庫中
- API 配額已用完

### Q: 如何查看 API 使用情況？
**A:** 登入 [FlightAware Dashboard](https://flightaware.com/aeroapi/dashboard/) 查看：
- API 請求次數
- 剩餘配額
- 使用統計

## 訂閱層級說明

### Free Tier（免費）
- 每月 100 次請求
- 基本航班信息
- 適合個人使用和測試

### Paid Tiers（付費）
- 更多請求次數
- 更詳細的航班信息
- 實時追蹤功能
- 歷史數據查詢

詳細定價請參考 [FlightAware 定價頁面](https://flightaware.com/aeroapi/pricing/)

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

## 技術支援

如有問題，請參考：
- [FlightAware API 文檔](https://flightaware.com/aeroapi/documentation/)
- [FlightAware 支援](https://flightaware.com/about/contact/)

