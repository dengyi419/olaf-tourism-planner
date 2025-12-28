import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DayItinerary, TripSettings } from '@/types';
import { supabase } from '@/lib/supabase';

// 後備內存數據庫（如果 Supabase 未配置）
const tripsDatabase = new Map<string, Array<{
  id: string;
  name: string;
  settings: TripSettings;
  itinerary: DayItinerary[];
  createdAt: string;
  updatedAt: string;
}>>();

// GET: 獲取用戶的所有行程
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 如果 Supabase 已配置，使用 Supabase
    if (supabase) {
      console.log('使用 Supabase 查詢行程，用戶:', session.user.email);
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_email', session.user.email) // 確保只查詢當前用戶的行程
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase 查詢錯誤:', error);
        // 如果 Supabase 失敗，回退到內存存儲
        const userTrips = tripsDatabase.get(session.user.email) || [];
        return NextResponse.json({ trips: userTrips });
      }

      console.log('Supabase 查詢成功，找到', data?.length || 0, '個行程');

      // 轉換資料格式（Supabase 使用 created_at/updated_at，我們需要 createdAt/updatedAt）
      const trips = (data || []).map(trip => ({
        id: trip.id,
        name: trip.name,
        settings: trip.settings,
        itinerary: trip.itinerary,
        createdAt: trip.created_at,
        updatedAt: trip.updated_at,
      }));

      return NextResponse.json({ trips });
    } else {
      console.warn('Supabase 未配置，使用內存存儲');
    }

    // 如果 Supabase 未配置，使用內存存儲
    const userTrips = tripsDatabase.get(session.user.email) || [];
    return NextResponse.json({ trips: userTrips });
  } catch (error: any) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips', details: error.message },
      { status: 500 }
    );
  }
}

// POST: 保存或更新行程
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
    const { id, name, settings, itinerary } = body;

    if (!settings || !itinerary) {
      return NextResponse.json(
        { error: 'Missing required fields: settings, itinerary' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const tripId = id || `trip-${Date.now()}`;
    const tripName = name || `行程 ${new Date().toLocaleDateString('zh-TW')}`;

    // 如果 Supabase 已配置，使用 Supabase
    if (supabase) {
      console.log('使用 Supabase 保存行程，用戶:', session.user.email, '行程ID:', tripId);
      
      // 檢查是否已存在（只檢查當前用戶的行程）
      const { data: existing, error: checkError } = await supabase
        .from('trips')
        .select('id, created_at')
        .eq('id', tripId)
        .eq('user_email', session.user.email) // 確保只檢查當前用戶的行程
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 是 "not found" 錯誤，可以忽略
        console.error('Supabase 檢查錯誤:', checkError);
        throw checkError;
      }

      const tripData = {
        id: tripId,
        user_email: session.user.email, // 確保設置用戶 email
        name: tripName,
        settings,
        itinerary,
        updated_at: now,
      };

      if (existing) {
        console.log('更新現有行程:', tripId);
        // 更新現有行程（確保只更新當前用戶的行程）
        const { data, error } = await supabase
          .from('trips')
          .update(tripData)
          .eq('id', tripId)
          .eq('user_email', session.user.email) // 雙重驗證：確保只更新當前用戶的行程
          .select()
          .single();

        if (error) {
          console.error('Supabase 更新錯誤:', error);
          throw error;
        }

        console.log('行程更新成功:', data.id);

        // 轉換格式
        const trip = {
          id: data.id,
          name: data.name,
          settings: data.settings,
          itinerary: data.itinerary,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        return NextResponse.json({ trip, success: true });
      } else {
        console.log('創建新行程:', tripId);
        // 創建新行程
        tripData.created_at = now;
        const { data, error } = await supabase
          .from('trips')
          .insert(tripData)
          .select()
          .single();

        if (error) {
          console.error('Supabase 插入錯誤:', error);
          console.error('插入的數據:', JSON.stringify(tripData, null, 2));
          throw error;
        }

        console.log('行程創建成功:', data.id);

        // 轉換格式
        const trip = {
          id: data.id,
          name: data.name,
          settings: data.settings,
          itinerary: data.itinerary,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        return NextResponse.json({ trip, success: true });
      }
    } else {
      console.warn('Supabase 未配置，使用內存存儲');
    }

    // 如果 Supabase 未配置，使用內存存儲
    const userTrips = tripsDatabase.get(session.user.email) || [];
    const trip = {
      id: tripId,
      name: tripName,
      settings,
      itinerary,
      createdAt: id ? userTrips.find(t => t.id === id)?.createdAt || now : now,
      updatedAt: now,
    };

    const existingIndex = userTrips.findIndex(t => t.id === trip.id);
    if (existingIndex >= 0) {
      userTrips[existingIndex] = trip;
    } else {
      userTrips.push(trip);
    }

    tripsDatabase.set(session.user.email, userTrips);

    return NextResponse.json({ trip, success: true });
  } catch (error: any) {
    console.error('Error saving trip:', error);
    return NextResponse.json(
      { error: 'Failed to save trip', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: 刪除行程
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('id');

    if (!tripId) {
      return NextResponse.json(
        { error: 'Missing trip id' },
        { status: 400 }
      );
    }

    // 如果 Supabase 已配置，使用 Supabase
    if (supabase) {
      console.log('使用 Supabase 刪除行程，用戶:', session.user.email, '行程ID:', tripId);
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)
        .eq('user_email', session.user.email); // 確保只刪除當前用戶的行程

      if (error) {
        console.error('Supabase 刪除錯誤:', error);
        throw error;
      }

      console.log('行程刪除成功');
      return NextResponse.json({ success: true });
    } else {
      console.warn('Supabase 未配置，使用內存存儲');
    }

    // 如果 Supabase 未配置，使用內存存儲
    const userTrips = tripsDatabase.get(session.user.email) || [];
    const filteredTrips = userTrips.filter(t => t.id !== tripId);
    tripsDatabase.set(session.user.email, filteredTrips);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { error: 'Failed to delete trip', details: error.message },
      { status: 500 }
    );
  }
}

