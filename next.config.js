/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 確保 @supabase/supabase-js 被打包到 serverless 函數中
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // 使用 webpack 配置確保模組被打包
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 確保 @supabase/supabase-js 被打包，而不是標記為外部
      const originalExternals = config.externals;
      config.externals = [
        (context, request, callback) => {
          // 如果是 @supabase/supabase-js，不標記為外部，讓它被打包
          if (request && request.includes('@supabase/supabase-js')) {
            return callback();
          }
          // 其他模組使用默認行為
          if (typeof originalExternals === 'function') {
            return originalExternals(context, request, callback);
          }
          return callback();
        },
      ];
    }
    return config;
  },
}

module.exports = nextConfig

