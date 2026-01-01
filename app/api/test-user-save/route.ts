import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { initializeSupabase } from '@/lib/supabase';

// GET: 測試用戶保存功能
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '未登入', session: null },
        { status: 401 }
      );
    }

    const email = session.user.email;
    const name = session.user.name || null;
    const picture = session.user.image || null;

    // 檢查 Supabase 配置
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    const configCheck = {
      supabaseUrl: supabaseUrl ? '已設置' : '未設置',
      supabaseServiceKey: supabaseServiceKey ? '已設置' : '未設置',
    };

    // 嘗試初始化 Supabase
    const supabase = await initializeSupabase();
    
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase 未配置',
        config: configCheck,
        user: { email, name, picture },
      });
    }

    // 嘗試保存用戶
    const now = new Date().toISOString();
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
      return NextResponse.json({
        success: false,
        error: '保存失敗',
        errorDetails: error,
        config: configCheck,
        user: { email, name, picture },
      });
    }

    // 嘗試查詢用戶
    const { data: queryData, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    return NextResponse.json({
      success: true,
      message: '用戶保存成功',
      config: configCheck,
      user: { email, name, picture },
      savedData: data,
      queryResult: queryData,
      queryError: queryError,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: '發生錯誤',
      errorDetails: error?.message || error,
      stack: error?.stack,
    }, { status: 500 });
  }
}

