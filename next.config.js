/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 移除 webpack externals 配置，讓 @supabase/supabase-js 正常打包
  // 使用條件導入來避免構建時錯誤
}

module.exports = nextConfig

