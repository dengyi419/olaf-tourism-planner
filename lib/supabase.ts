// 動態初始化 Supabase 客戶端（避免構建時解析）
// 使用 Function 構造函數來完全避免 webpack 在構建時解析模組
export async function initializeSupabase() {
  try {
    // 使用 Function 構造函數動態執行 import，完全避免構建時解析
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    const supabaseModule = await dynamicImport('@supabase/supabase-js');
    const { createClient } = supabaseModule;
    
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseServiceKey) {
      const client = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      console.log('Supabase 客戶端初始化成功，URL:', supabaseUrl.substring(0, 30) + '...');
      return client;
    } else {
      console.warn('Supabase 環境變數未設置:');
      console.warn('  SUPABASE_URL:', supabaseUrl ? '已設置' : '未設置');
      console.warn('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '已設置' : '未設置');
      console.warn('將使用內存存儲');
      return null;
    }
  } catch (error) {
    console.error('Supabase 客戶端初始化失敗，將使用內存存儲:', error);
    return null;
  }
}

