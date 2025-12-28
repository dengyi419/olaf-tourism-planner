// 動態初始化 Supabase 客戶端
// 在服務器端使用 require，在客戶端使用動態 import
let supabaseModule: any = null;

// 嘗試在模組加載時預先載入（僅在服務器端）
if (typeof window === 'undefined') {
  try {
    // 在 Node.js 環境中使用 require
    supabaseModule = require('@supabase/supabase-js');
  } catch (error) {
    // 如果 require 失敗，將在運行時使用動態 import
    console.warn('無法預先載入 Supabase 模組，將在運行時動態載入');
  }
}

export async function initializeSupabase() {
  try {
    let createClient: any;
    
    // 如果已經載入，直接使用
    if (supabaseModule) {
      createClient = supabaseModule.createClient;
    } else {
      // 否則使用動態 import（適用於客戶端或運行時）
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
    return null;
  }
}

