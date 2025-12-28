// 動態導入 Supabase，避免構建時錯誤
let supabaseClient: any = null;
let supabaseInitialized = false;

// 異步初始化 Supabase 客戶端
async function initializeSupabase() {
  if (supabaseInitialized) {
    return supabaseClient;
  }

  try {
    // 使用動態 import 在運行時加載模組
    const supabaseModule = await import('@supabase/supabase-js');
    const { createClient } = supabaseModule;
    
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseServiceKey) {
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      console.log('Supabase 客戶端初始化成功，URL:', supabaseUrl.substring(0, 30) + '...');
      supabaseInitialized = true;
    } else {
      console.warn('Supabase 環境變數未設置:');
      console.warn('  SUPABASE_URL:', supabaseUrl ? '已設置' : '未設置');
      console.warn('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '已設置' : '未設置');
      console.warn('將使用內存存儲');
      supabaseInitialized = true;
    }
  } catch (error) {
    console.error('Supabase 客戶端初始化失敗，將使用內存存儲:', error);
    supabaseInitialized = true;
  }

  return supabaseClient;
}

// 同步導出（用於類型檢查），實際使用時需要先調用 initializeSupabase
export const supabase = supabaseClient;

// 導出初始化函數
export { initializeSupabase };

