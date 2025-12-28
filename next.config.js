/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 使用 webpack 配置確保 @supabase/supabase-js 被打包
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 保存原始的 externals 配置
      const originalExternals = config.externals || [];
      
      // 創建新的 externals 函數，只針對 @supabase/supabase-js
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : []),
        ({ request }, callback) => {
          // 如果是 @supabase/supabase-js，不標記為外部，讓它被打包
          if (request && request.includes('@supabase/supabase-js')) {
            return callback();
          }
          // 其他模組使用默認行為（讓 webpack 處理）
          return callback();
        },
      ];
    }
    return config;
  },
}

module.exports = nextConfig

