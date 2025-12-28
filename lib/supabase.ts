// 直接導入 Supabase（Next.js 會正確打包）
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export async function initializeSupabase(): Promise<SupabaseClient | null> {
  // 如果已經初始化，直接返回
  if (supabaseClient) {
    return supabaseClient;
  }

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

    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    console.log('Supabase 客戶端初始化成功，URL:', supabaseUrl.substring(0, 30) + '...');
    return supabaseClient;
  } catch (error: any) {
    console.error('Supabase 客戶端初始化失敗，將使用內存存儲:', error);
    console.error('錯誤詳情:', error?.message || error);
    if (error?.stack) {
      console.error('錯誤堆棧:', error.stack);
    }
    return null;
  }
}

