import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Cloudflare Zero Trust 驗證
    const cfAccessToken = req.headers.get('cf-access-token');
    if (process.env.CLOUDFLARE_ACCESS_AUDIENCE && !cfAccessToken) {
      // 如果設置了 Cloudflare Access，但沒有 token，返回 403
      return NextResponse.json(
        { error: 'Cloudflare Access verification required' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 檢查用戶是否已登入
        if (!token) {
          return false;
        }

        // 檢查 Cloudflare Zero Trust（如果啟用）
        if (process.env.CLOUDFLARE_ACCESS_AUDIENCE) {
          const cfAccessToken = req.headers.get('cf-access-token');
          if (!cfAccessToken) {
            return false;
          }
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/plan/:path*',
    '/ai-plan/:path*',
    '/history/:path*',
    '/settings/:path*',
    '/api/trips/:path*',
  ],
};

