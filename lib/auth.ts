import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
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
  },
  secret: process.env.NEXTAUTH_SECRET,
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

