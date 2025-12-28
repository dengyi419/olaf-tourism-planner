/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // 在服務器端，將 @supabase/supabase-js 標記為外部依賴
    // 這樣 webpack 不會嘗試在構建時解析它
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@supabase/supabase-js': 'commonjs @supabase/supabase-js',
      });
    }
    return config;
  },
}

module.exports = nextConfig

