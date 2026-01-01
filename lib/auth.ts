import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { initializeSupabase } from './supabase';

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

// 保存或更新用戶到資料庫
async function saveUserToDatabase(email: string, name?: string | null, picture?: string | null) {
  if (!email) {
    console.warn('[saveUserToDatabase] 無法保存用戶：email 為空');
    return;
  }

  console.log('[saveUserToDatabase] 開始保存用戶:', { email, name, picture });

  try {
    const supabase = await initializeSupabase();
    
    if (!supabase) {
      console.warn('[saveUserToDatabase] Supabase 未配置，跳過保存用戶');
      console.warn('[saveUserToDatabase] SUPABASE_URL:', process.env.SUPABASE_URL ? '已設置' : '未設置');
      console.warn('[saveUserToDatabase] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '已設置' : '未設置');
      return;
    }

    console.log('[saveUserToDatabase] Supabase 客戶端初始化成功');

    const now = new Date().toISOString();
    
    // 使用 upsert 來創建或更新用戶
    const { data, error } = await supabase
      .from('users')
      .upsert({
        email,
        name: name || null,
        picture: picture || null,
        provider: 'google',
        last_login_at: now,
        updated_at: now,
      }, {
        onConflict: 'email',
      })
      .select()
      .single();

    if (error) {
      console.error('[saveUserToDatabase] 保存用戶到資料庫失敗:', error);
      console.error('[saveUserToDatabase] 錯誤詳情:', JSON.stringify(error, null, 2));
    } else {
      console.log('[saveUserToDatabase] 用戶已成功保存到資料庫:', email);
      console.log('[saveUserToDatabase] 返回的資料:', data);
    }
  } catch (error: any) {
    console.error('[saveUserToDatabase] 保存用戶時發生錯誤:', error?.message || error);
    if (error?.stack) {
      console.error('[saveUserToDatabase] 錯誤堆棧:', error.stack);
    }
  }
}

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
    async jwt({ token, user, account, trigger }) {
      console.log('[jwt callback] 觸發:', { 
        hasAccount: !!account, 
        hasUser: !!user, 
        trigger,
        email: user?.email || token.email 
      });

      if (account && user) {
        console.log('[jwt callback] 首次登入，保存用戶資訊');
        token.accessToken = account.access_token;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        
        // 保存用戶到資料庫（僅在首次登入或更新時）
        if (user.email) {
          console.log('[jwt callback] 調用 saveUserToDatabase');
          await saveUserToDatabase(user.email, user.name || null, user.image || null);
        } else {
          console.warn('[jwt callback] user.email 為空，無法保存');
        }
      } else if (token.email && !token.userSaved) {
        // 如果 token 中有 email 但還沒有保存過，也嘗試保存（處理某些邊緣情況）
        console.log('[jwt callback] Token 中有 email，但用戶可能未保存，嘗試保存');
        await saveUserToDatabase(token.email as string, token.name as string || null, token.picture as string || null);
        token.userSaved = true; // 標記已保存，避免重複保存
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

