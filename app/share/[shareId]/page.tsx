'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DaySection from '@/components/DaySection';
import { DayItinerary, TripSettings } from '@/types';
import { useTravelStore } from '@/store/useTravelStore';

interface SharedTrip {
  shareId: string;
  tripId: string;
  name: string;
  settings: TripSettings;
  itinerary: DayItinerary[];
  createdAt: string;
  expiresAt: string;
}

export default function SharePage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [trip, setTrip] = useState<SharedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setTripSettings, setItinerary } = useTravelStore();

  useEffect(() => {
    if (!shareId) return;

    const fetchSharedTrip = async () => {
      try {
        const response = await fetch(`/api/share-trip?shareId=${shareId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('分享連結不存在或已過期');
          } else if (response.status === 410) {
            setError('分享連結已過期');
          } else {
            setError('載入行程失敗');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        const sharedTrip = data.trip;
        setTrip(sharedTrip);
        
        // 初始化 store，讓 DaySection 能正常顯示
        if (sharedTrip) {
          setTripSettings(sharedTrip.settings);
          setItinerary(sharedTrip.itinerary);
        }
      } catch (err) {
        console.error('Error fetching shared trip:', err);
        setError('載入行程失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedTrip();
  }, [shareId, setTripSettings, setItinerary]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center">
        <div className="pixel-card p-8 text-center">
          <p className="text-sm">載入中...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center">
        <div className="pixel-card p-8 text-center">
          <p className="text-sm text-red-600">{error || '找不到分享的行程'}</p>
        </div>
      </div>
    );
  }

  const totalSpent = trip.itinerary.reduce((total, day) => {
    const daySpent = day.activities.reduce((sum, activity) => sum + (activity.actualCost || 0), 0);
    const extraExpenses = day.extraExpenses || 0;
    return total + daySpent + extraExpenses;
  }, 0);

  return (
    <div className="min-h-screen bg-[#f5f5dc]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 行程標題 */}
          <div className="pixel-card p-4">
            <h1 className="text-2xl mb-2">{trip.name}</h1>
            <div className="text-xs space-y-1">
              <p>目的地: {trip.settings.destination}</p>
              <p>總預算: {trip.settings.currency} {trip.settings.totalBudget.toLocaleString()}</p>
              <p>已花費: {trip.settings.currency} {totalSpent.toLocaleString()}</p>
              <p>剩餘預算: {trip.settings.currency} {(trip.settings.totalBudget - totalSpent).toLocaleString()}</p>
              <p>行程天數: {trip.itinerary.length} 天</p>
            </div>
          </div>

          {/* 行程內容 */}
          {trip.itinerary.map((day) => (
            <DaySection key={day.dayId} day={day} readOnly={true} />
          ))}
        </div>
      </main>
    </div>
  );
}

