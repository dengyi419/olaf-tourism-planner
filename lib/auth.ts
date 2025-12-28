import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// 驗證必要的環境變數
if (!process.env.GOOGLE_CLIENT_ID) {
  console.warn('警告: GOOGLE_CLIENT_ID 未設置');
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('警告: GOOGLE_CLIENT_SECRET 未設置');
}

if (!process.env.NEXTAUTH_SECRET) {
  console.warn('警告: NEXTAUTH_SECRET 未設置');
}

// 獲取 NEXTAUTH_URL，優先使用環境變數，否則使用 Vercel 自動設置的 URL
const getNextAuthUrl = () => {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  // Vercel 自動設置的 URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // 開發環境默認值
  return 'http://localhost:3000';
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Cloudflare Zero Trust 驗證
// 注意：實際的 Cloudflare Zero Trust 驗證應該在 Cloudflare 邊緣網絡完成
// 這裡只是一個後端驗證的輔助函數
export function verifyCloudflareAccess(token: string | null): boolean {
  if (!process.env.CLOUDFLARE_ACCESS_AUDIENCE) {
    // 如果沒有設置 Cloudflare Access，跳過驗證（開發環境）
    return true;
  }

  if (!token) {
    return false;
  }

  // Cloudflare Zero Trust 會在請求頭中添加 cf-access-token
  // 實際驗證應該通過 Cloudflare 的 API 完成
  // 這裡只是檢查 token 是否存在
  return !!token;
}

