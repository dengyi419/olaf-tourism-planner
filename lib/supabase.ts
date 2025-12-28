// 動態初始化 Supabase 客戶端
// 在服務器端使用 require，在客戶端使用動態 import
let supabaseModule: any = null;
let loadAttempted = false;

export async function initializeSupabase() {
  try {
    let createClient: any;
    
    // 如果已經載入，直接使用
    if (supabaseModule) {
      createClient = supabaseModule.createClient;
    } else if (typeof window === 'undefined' && !loadAttempted) {
      // 在服務器端（Node.js 環境）使用 require
      try {
        loadAttempted = true;
        // 使用動態 require 避免構建時解析
        const requireModule = eval('require');
        supabaseModule = requireModule('@supabase/supabase-js');
        createClient = supabaseModule.createClient;
      } catch (requireError) {
        // 如果 require 失敗，嘗試動態 import
        console.warn('require 失敗，嘗試使用動態 import:', requireError);
        const module = await import('@supabase/supabase-js');
        createClient = module.createClient;
        supabaseModule = module;
      }
    } else {
      // 在客戶端或 require 失敗時使用動態 import
      const module = await import('@supabase/supabase-js');
      createClient = module.createClient;
      supabaseModule = module; // 緩存模組
    }
    
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
  } catch (error: any) {
    console.error('Supabase 客戶端初始化失敗，將使用內存存儲:', error);
    console.error('錯誤詳情:', error?.message || error);
    if (error?.stack) {
      console.error('錯誤堆棧:', error.stack);
    }
    return null;
  }
}

