// 動態導入 Supabase，避免構建時錯誤
let supabaseClient: any = null;

try {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (supabaseUrl && supabaseServiceKey) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } else {
    console.warn('Supabase 環境變數未設置，將使用內存存儲');
  }
} catch (error) {
  console.warn('Supabase 客戶端初始化失敗，將使用內存存儲:', error);
}

export const supabase = supabaseClient;

