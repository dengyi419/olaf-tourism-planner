/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 使用 webpack 配置確保 @supabase/supabase-js 被打包
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 保存原始的 externals 配置
      const originalExternals = config.externals;
      
      // 創建新的 externals 函數
      config.externals = [
        ({ context, request }, callback) => {
          // 如果是 @supabase/supabase-js，不標記為外部，讓它被打包
          if (request && request.includes('@supabase/supabase-js')) {
            return callback();
          }
          // 其他模組使用原始 externals 處理
          if (Array.isArray(originalExternals)) {
            // 如果是數組，檢查是否匹配
            for (const external of originalExternals) {
              if (typeof external === 'function') {
                const result = external({ context, request }, callback);
                if (result !== undefined) return result;
              } else if (typeof external === 'string' && request === external) {
                return callback(null, external);
              } else if (external instanceof RegExp && external.test(request)) {
                return callback(null, request);
              }
            }
          } else if (typeof originalExternals === 'function') {
            return originalExternals({ context, request }, callback);
          }
          // 默認行為：讓 webpack 處理
          return callback();
        },
      ];
    }
    return config;
  },
}

module.exports = nextConfig

