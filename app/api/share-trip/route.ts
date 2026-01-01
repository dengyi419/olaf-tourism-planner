import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DayItinerary, TripSettings } from '@/types';
import { createClient } from '@supabase/supabase-js';

async function initializeSupabase(): Promise<any> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase 環境變數未設置');
      return null;
    }

    const client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    console.log('Supabase 客戶端初始化成功');
    return client;
  } catch (error: any) {
    console.error('Supabase 初始化失敗:', error?.message || error);
    return null;
  }
}

// 後備內存數據庫（如果 Supabase 未配置）
const sharedTripsDatabase = new Map<string, {
  shareId: string;
  tripId: string;
  name: string;
  settings: TripSettings;
  itinerary: DayItinerary[];
  createdAt: string;
  expiresAt: string; // 30 天後過期
}>();

// POST: 創建分享連結
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tripId, name, settings, itinerary } = body;

    if (!settings || !itinerary) {
      return NextResponse.json(
        { error: 'Missing required fields: settings, itinerary' },
        { status: 400 }
      );
    }

    // 生成唯一的分享 ID
    const shareId = `share-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 天後過期
    
    // 從請求中獲取 origin（動態獲取當前域名）
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const sharedTrip = {
      shareId,
      tripId: tripId || shareId,
      name: name || `行程 ${new Date().toLocaleDateString('zh-TW')}`,
      settings,
      itinerary,
      createdAt: now,
      expiresAt,
    };

    // 初始化 Supabase（如果尚未初始化）
    const supabase = await initializeSupabase();

    // 如果 Supabase 已配置，使用 Supabase
    if (supabase) {
      try {
        // 檢查 shared_trips 表是否存在，如果不存在則創建（使用 upsert）
        const { data, error } = await supabase
          .from('shared_trips')
          .insert({
            share_id: shareId,
            trip_id: tripId || shareId,
            name: sharedTrip.name,
            settings: sharedTrip.settings,
            itinerary: sharedTrip.itinerary,
            created_at: now,
            expires_at: expiresAt,
          })
          .select()
          .single();

        if (error) {
          // 如果表不存在，先創建表（這需要手動在 Supabase 中執行 SQL）
          // 這裡我們先嘗試使用內存存儲作為後備
          console.warn('Supabase 插入失敗，使用內存存儲:', error.message);
          sharedTripsDatabase.set(shareId, sharedTrip);
        } else {
          return NextResponse.json({ 
            shareId, 
            shareUrl: `${baseUrl}/share/${shareId}`,
            expiresAt 
          });
        }
      } catch (error: any) {
        console.warn('Supabase 操作失敗，使用內存存儲:', error?.message || error);
        sharedTripsDatabase.set(shareId, sharedTrip);
      }
    } else {
      // 使用內存存儲
      sharedTripsDatabase.set(shareId, sharedTrip);
    }

    return NextResponse.json({ 
      shareId, 
      shareUrl: `${baseUrl}/share/${shareId}`,
      expiresAt 
    });
  } catch (error: any) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link', details: error.message },
      { status: 500 }
    );
  }
}

// GET: 獲取分享的行程（不需要登入）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json(
        { error: 'Missing shareId parameter' },
        { status: 400 }
      );
    }

    // 初始化 Supabase（如果尚未初始化）
    const supabase = await initializeSupabase();

    // 如果 Supabase 已配置，使用 Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('shared_trips')
          .select('*')
          .eq('share_id', shareId)
          .single();

        if (error) {
          // 如果 Supabase 查詢失敗，嘗試從內存存儲獲取
          console.warn('Supabase 查詢失敗，嘗試內存存儲:', error.message);
          const sharedTrip = sharedTripsDatabase.get(shareId);
          
          if (!sharedTrip) {
            return NextResponse.json(
              { error: 'Share link not found or expired' },
              { status: 404 }
            );
          }

          // 檢查是否過期
          if (new Date(sharedTrip.expiresAt) < new Date()) {
            sharedTripsDatabase.delete(shareId);
            return NextResponse.json(
              { error: 'Share link expired' },
              { status: 410 }
            );
          }

          return NextResponse.json({ trip: sharedTrip });
        }

        if (!data) {
          // 嘗試從內存存儲獲取
          const sharedTrip = sharedTripsDatabase.get(shareId);
          
          if (!sharedTrip) {
            return NextResponse.json(
              { error: 'Share link not found or expired' },
              { status: 404 }
            );
          }

          // 檢查是否過期
          if (new Date(sharedTrip.expiresAt) < new Date()) {
            sharedTripsDatabase.delete(shareId);
            return NextResponse.json(
              { error: 'Share link expired' },
              { status: 410 }
            );
          }

          return NextResponse.json({ trip: sharedTrip });
        }

        // 檢查是否過期
        if (new Date(data.expires_at) < new Date()) {
          // 刪除過期的分享
          await supabase
            .from('shared_trips')
            .delete()
            .eq('share_id', shareId);
          
          return NextResponse.json(
            { error: 'Share link expired' },
            { status: 410 }
          );
        }

        return NextResponse.json({ 
          trip: {
            shareId: data.share_id,
            tripId: data.trip_id,
            name: data.name,
            settings: data.settings,
            itinerary: data.itinerary,
            createdAt: data.created_at,
            expiresAt: data.expires_at,
          }
        });
      } catch (error: any) {
        console.warn('Supabase 操作失敗，嘗試內存存儲:', error?.message || error);
        const sharedTrip = sharedTripsDatabase.get(shareId);
        
        if (!sharedTrip) {
          return NextResponse.json(
            { error: 'Share link not found or expired' },
            { status: 404 }
          );
        }

        // 檢查是否過期
        if (new Date(sharedTrip.expiresAt) < new Date()) {
          sharedTripsDatabase.delete(shareId);
          return NextResponse.json(
            { error: 'Share link expired' },
            { status: 410 }
          );
        }

        return NextResponse.json({ trip: sharedTrip });
      }
    } else {
      // 使用內存存儲
      const sharedTrip = sharedTripsDatabase.get(shareId);
      
      if (!sharedTrip) {
        return NextResponse.json(
          { error: 'Share link not found or expired' },
          { status: 404 }
        );
      }

      // 檢查是否過期
      if (new Date(sharedTrip.expiresAt) < new Date()) {
        sharedTripsDatabase.delete(shareId);
        return NextResponse.json(
          { error: 'Share link expired' },
          { status: 410 }
        );
      }

      return NextResponse.json({ trip: sharedTrip });
    }
  } catch (error: any) {
    console.error('Error fetching shared trip:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared trip', details: error.message },
      { status: 500 }
    );
  }
}

