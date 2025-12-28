/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 確保 @supabase/supabase-js 被打包到 serverless 函數中
  serverComponentsExternalPackages: [],
  // 使用 webpack 配置來確保模組被打包
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 確保 @supabase/supabase-js 被打包，而不是標記為外部依賴
      config.externals = config.externals || [];
      // 移除 @supabase/supabase-js 從 externals（如果存在）
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter(
          (external) => typeof external !== 'string' || !external.includes('@supabase/supabase-js')
        );
      } else if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = [
          (context, request, callback) => {
            if (request && request.includes('@supabase/supabase-js')) {
              // 不標記為外部，讓它被打包
              return callback();
            }
            return originalExternals(context, request, callback);
          },
        ];
      }
    }
    return config;
  },
}

module.exports = nextConfig

