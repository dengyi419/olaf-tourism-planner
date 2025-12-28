# 部署指南 - 將 TravelGenie 部署到 ihaveatree.shop

本指南將幫助您將 TravelGenie 應用程式部署到 GoDaddy 購買的網域。

## 推薦部署平台

### 方案 1：Vercel（推薦，最簡單）

Vercel 是 Next.js 的官方部署平台，提供免費方案且設定簡單。

#### 步驟 1：準備專案

1. 確保所有變更已提交到 Git：
```bash
git add .
git commit -m "準備部署"
```

2. 將專案推送到 GitHub/GitLab/Bitbucket：
```bash
git remote add origin <your-repo-url>
git push -u origin main
```

#### 步驟 2：在 Vercel 部署

1. 前往 [Vercel](https://vercel.com)
2. 使用 GitHub 帳號登入
3. 點擊「Add New Project」
4. 選擇您的 TravelGenie 專案
5. 設定環境變數：
   - `GEMINI_API_KEY`: 您的 Google Gemini API 金鑰
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: 您的 Google Maps API 金鑰（如果使用地圖功能）
   - `NEXT_PUBLIC_LOGO_PATH`: `/logo.png`（可選）
6. 點擊「Deploy」

#### 步驟 3：連接 GoDaddy 網域

1. 在 Vercel 專案設定中，進入「Domains」
2. 輸入 `ihaveatree.shop` 和 `www.ihaveatree.shop`
3. Vercel 會提供 DNS 設定指示

#### 步驟 4：設定 GoDaddy DNS

在 GoDaddy 的 DNS 管理頁面，添加以下記錄：

**A 記錄：**
- 名稱：`@`（或留空）
- 值：`76.76.21.21`（Vercel 的 IP，請確認 Vercel 提供的 IP）

**CNAME 記錄：**
- 名稱：`www`
- 值：`cname.vercel-dns.com.`（請使用 Vercel 提供的實際值）

**或者使用 CNAME 記錄（推薦）：**
- 名稱：`@`
- 值：`76.76.21.21`（或 Vercel 提供的 CNAME 值）

**等待 DNS 傳播：**
- DNS 變更需要 24-48 小時才能完全生效
- 可以使用 [whatsmydns.net](https://www.whatsmydns.net) 檢查 DNS 傳播狀態

---

### 方案 2：Netlify

#### 步驟 1：準備專案

1. 確保專案已推送到 Git 倉庫

#### 步驟 2：在 Netlify 部署

1. 前往 [Netlify](https://www.netlify.com)
2. 使用 GitHub 帳號登入
3. 點擊「Add new site」→「Import an existing project」
4. 選擇您的專案
5. 設定建置指令：
   - Build command: `npm run build`
   - Publish directory: `.next`
6. 設定環境變數（同 Vercel）
7. 點擊「Deploy site」

#### 步驟 3：連接網域

1. 在 Netlify 專案設定中，進入「Domain settings」
2. 點擊「Add custom domain」
3. 輸入 `ihaveatree.shop`
4. 按照 Netlify 的指示設定 DNS

---

### 方案 3：自行架設 VPS（進階）

如果您想使用自己的伺服器：

#### 需要準備：
- VPS 主機（如 DigitalOcean、AWS、Linode 等）
- Node.js 18+ 環境
- PM2 或類似進程管理器

#### 部署步驟：

1. **在 VPS 上安裝依賴：**
```bash
# 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安裝 PM2
sudo npm install -g pm2
```

2. **上傳專案：**
```bash
# 使用 Git 或 SCP 上傳專案到 VPS
git clone <your-repo-url>
cd travelgenie
npm install
```

3. **設定環境變數：**
```bash
# 建立 .env.production
nano .env.production
```

添加：
```
GEMINI_API_KEY=your_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
NODE_ENV=production
```

4. **建置專案：**
```bash
npm run build
```

5. **使用 PM2 啟動：**
```bash
pm2 start npm --name "travelgenie" -- start
pm2 save
pm2 startup
```

6. **設定 Nginx 反向代理：**
```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/travelgenie
```

添加配置：
```nginx
server {
    listen 80;
    server_name ihaveatree.shop www.ihaveatree.shop;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

啟用配置：
```bash
sudo ln -s /etc/nginx/sites-available/travelgenie /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **設定 SSL（使用 Let's Encrypt）：**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d ihaveatree.shop -d www.ihaveatree.shop
```

8. **在 GoDaddy 設定 DNS：**
- A 記錄：`@` → 您的 VPS IP
- A 記錄：`www` → 您的 VPS IP

---

## 環境變數清單

部署前請確保設定以下環境變數：

### 必要變數：
- `GEMINI_API_KEY`: Google Gemini API 金鑰

### 選用變數：
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API 金鑰（用於地圖功能）
- `NEXT_PUBLIC_LOGO_PATH`: Logo 路徑（預設：`/logo.png`）

---

## 部署後檢查清單

- [ ] 環境變數已正確設定
- [ ] DNS 記錄已設定並傳播
- [ ] SSL 憑證已安裝（HTTPS）
- [ ] 網站可以正常訪問
- [ ] AI 生成行程功能正常
- [ ] 地圖功能正常（如果使用）
- [ ] Logo 正常顯示

---

## 常見問題

### DNS 設定後無法訪問？
- 等待 24-48 小時讓 DNS 完全傳播
- 清除瀏覽器快取
- 使用不同網路測試

### SSL 憑證問題？
- 確保 DNS 已正確設定
- 確保 80 和 443 端口已開放
- 檢查防火牆設定

### 環境變數未生效？
- 重新部署專案
- 檢查變數名稱是否正確
- 確認變數是否為公開變數（NEXT_PUBLIC_*）

---

## 推薦方案

**對於初學者：** 使用 Vercel（最簡單，免費方案足夠使用）
**對於進階用戶：** 使用 VPS 自行架設（更多控制權）

