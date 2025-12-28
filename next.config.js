/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 確保 server-side 依賴被打包
  outputFileTracingIncludes: {
    '/api/**': ['./node_modules/@supabase/**/*'],
  },
}

module.exports = nextConfig

