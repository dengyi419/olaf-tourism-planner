# Public 資料夾說明

這個資料夾用於存放靜態資源，例如圖片、字體等。

## Logo 設定

要顯示您的 logo，請將圖片檔案放在此資料夾中：

**檔案名稱：** `logo.png`

**路徑：** `public/logo.png`

**支援的圖片格式：**
- PNG（推薦）
- JPG/JPEG
- SVG
- GIF

**建議尺寸：** 48x48 像素或更高（會自動縮放）

## 使用方式

1. 將您的 logo 圖片命名為 `logo.png`
2. 放在 `public/logo.png`
3. 重新啟動開發伺服器（如果正在運行）
4. 重新載入頁面即可看到 logo

## 自訂路徑

如果您想使用不同的檔案名稱或路徑，可以在 `.env.local` 中設定：

```
NEXT_PUBLIC_LOGO_PATH=/your-custom-logo.png
```

