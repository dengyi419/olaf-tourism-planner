// 動態載入 Supabase，避免構建時解析
// 使用類型定義來避免 TypeScript 錯誤
type SupabaseClient = any;

let supabaseClient: SupabaseClient | null = null;
let supabaseModule: any = null;

export async function initializeSupabase(): Promise<SupabaseClient | null> {
  // 如果已經初始化，直接返回
  if (supabaseClient) {
    return supabaseClient;
  }

  try {
    // 動態載入 Supabase 模組（避免構建時解析）
    if (!supabaseModule) {
      // 使用動態 import，構建時不會解析
      supabaseModule = await import('@supabase/supabase-js');
    }

    const { createClient } = supabaseModule;
    
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
    if (error?.code) {
      console.error('錯誤代碼:', error.code);
    }
    if (error?.stack) {
      console.error('錯誤堆棧:', error.stack);
    }
    return null;
  }
}

