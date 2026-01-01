// Supabase 初始化函數
// 直接導入 Supabase，讓 Next.js 打包它
import { createClient } from '@supabase/supabase-js';

export async function initializeSupabase(): Promise<any> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase 環境變數未設置:');
      console.warn('  SUPABASE_URL:', supabaseUrl ? '已設置' : '未設置');
      console.warn('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '已設置' : '未設置');
      console.warn('將使用內存存儲');
      return null;
    }

    const client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    console.log('Supabase 客戶端初始化成功，URL:', supabaseUrl.substring(0, 30) + '...');
    return client;
  } catch (error: any) {
    console.error('Supabase 客戶端初始化失敗，將使用內存存儲:', error);
    console.error('錯誤詳情:', error?.message || error);
    if (error?.code) {
      console.error('錯誤代碼:', error.code);
    }
    if (error?.stack) {
      console.error('錯誤堆棧:', error.stack);
    }
    return null;
  }
}

