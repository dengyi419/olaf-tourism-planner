/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 14 應該自動打包所有 server-side 依賴
  // 如果仍然失敗，可能是構建緩存問題
}

module.exports = nextConfig

