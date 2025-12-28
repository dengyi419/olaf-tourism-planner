import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DayItinerary, TripSettings } from '@/types';

// 簡化的內存數據庫（實際應該使用真實數據庫如 PostgreSQL, MongoDB 等）
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

    const userTrips = tripsDatabase.get(session.user.email) || [];
    const now = new Date().toISOString();

    const trip = {
      id: id || `trip-${Date.now()}`,
      name: name || `行程 ${new Date().toLocaleDateString('zh-TW')}`,
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

