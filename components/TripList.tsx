'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStorageStore } from '@/store/useStorageStore';
import { useTravelStore } from '@/store/useTravelStore';
import { calculateTripDistance } from '@/utils/calculateDistance';
import { t } from '@/store/useLanguageStore';
import { MapPin, DollarSign, Calendar } from 'lucide-react';

interface TripSummary {
  id: string;
  name: string;
  destination: string;
  totalSpent: number;
  totalBudget: number;
  currency: string;
  distance: number;
  days: number;
  isCurrent: boolean;
}

export default function TripList() {
  const router = useRouter();
  const { data: session } = useSession();
  const { savedTrips, currentTrip, syncFromServer, loadTrip } = useStorageStore();
  const { tripSettings, itinerary, getTotalSpent, setTripSettings, setItinerary } = useTravelStore();
  const [tripSummaries, setTripSummaries] = useState<TripSummary[]>([]);
  const [totalAllSpent, setTotalAllSpent] = useState(0);
  const [totalAllDistance, setTotalAllDistance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // 獲取當前用戶 email
  const userEmail = session?.user?.email;

  const handleTripClick = (tripId: string) => {
    if (tripId === 'current') {
      // 如果點擊當前行程，直接跳轉到規劃頁面
      router.push('/plan');
      return;
    }
    
    // 載入選中的行程
    loadTrip(tripId);
    const trip = savedTrips.find(t => t.id === tripId);
    if (trip) {
      setTripSettings(trip.settings);
      setItinerary(trip.itinerary);
      router.push('/plan');
    }
  };

  // 首次載入時從服務器同步
  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  useEffect(() => {
    const loadTripData = async () => {
      setIsLoading(true);
      
      // 等待 Google Maps API 載入
      if (typeof window !== 'undefined' && !window.google?.maps) {
        const checkInterval = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkInterval);
            loadTripData();
          }
        }, 100);
        return () => clearInterval(checkInterval);
      }

      const summaries: TripSummary[] = [];

      // 處理當前行程
      if (currentTrip || (tripSettings && itinerary.length > 0)) {
        const trip = currentTrip || {
          id: 'current',
          name: '當前行程',
          settings: tripSettings!,
          itinerary,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        let distance = 0;
        if (trip.itinerary.length > 0) {
          const allActivities = trip.itinerary.flatMap(day => day.activities);
          if (allActivities.length >= 2 && window.google?.maps) {
            distance = await calculateTripDistance(allActivities);
          }
        }

        const totalSpent = trip.itinerary.reduce((total, day) => {
          const activitiesCost = day.activities.reduce(
            (sum, activity) => sum + activity.actualCost,
            0
          );
          return total + activitiesCost + (day.extraExpenses || 0);
        }, 0);

        summaries.push({
          id: trip.id,
          name: trip.name || '當前行程',
          destination: trip.settings.destination,
          totalSpent,
          totalBudget: trip.settings.totalBudget,
          currency: trip.settings.currency,
          distance,
          days: trip.itinerary.length,
          isCurrent: true,
        });
      }

      // 處理歷史行程（只處理屬於當前用戶的行程）
      const userTrips = userEmail 
        ? savedTrips.filter(trip => !trip.user_email || trip.user_email === userEmail)
        : savedTrips; // 如果沒有 session，保留所有（但這不應該發生）
      
      for (const trip of userTrips) {
        if (trip.id === currentTrip?.id) continue; // 跳過已在當前行程中的
        
        // 額外驗證：確保行程屬於當前用戶
        if (userEmail && trip.user_email && trip.user_email !== userEmail) {
          console.warn('跳過不屬於當前用戶的行程:', trip.id, trip.user_email, '當前用戶:', userEmail);
          continue;
        }

        let distance = 0;
        if (trip.itinerary.length > 0) {
          const allActivities = trip.itinerary.flatMap(day => day.activities);
          if (allActivities.length >= 2) {
            try {
              distance = await calculateTripDistance(allActivities);
            } catch (error) {
              console.error('計算距離失敗:', error);
              distance = 0;
            }
          }
        }

        const totalSpent = trip.itinerary.reduce((total, day) => {
          const activitiesCost = day.activities.reduce(
            (sum, activity) => sum + activity.actualCost,
            0
          );
          return total + activitiesCost + (day.extraExpenses || 0);
        }, 0);

        summaries.push({
          id: trip.id,
          name: trip.name,
          destination: trip.settings.destination,
          totalSpent,
          totalBudget: trip.settings.totalBudget,
          currency: trip.settings.currency,
          distance,
          days: trip.itinerary.length,
          isCurrent: false,
        });
      }

      // 計算總計
      const totalSpent = summaries.reduce((sum, trip) => sum + trip.totalSpent, 0);
      const totalDistance = summaries.reduce((sum, trip) => sum + trip.distance, 0);

      setTripSummaries(summaries);
      setTotalAllSpent(totalSpent);
      setTotalAllDistance(totalDistance);
      setIsLoading(false);
    };

    loadTripData();
  }, [savedTrips, currentTrip, tripSettings, itinerary]);

  if (isLoading) {
    return (
      <div className="pixel-card p-4">
        <p className="text-xs">載入中...</p>
      </div>
    );
  }

  return (
    <div className="pixel-card p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      <h2 className="text-lg mb-4">{t('tripList.title')}</h2>
      
      {tripSummaries.length === 0 ? (
        <p className="text-xs opacity-70">{t('tripList.noTrips')}</p>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {tripSummaries.map((trip) => (
              <div
                key={trip.id}
                onClick={() => handleTripClick(trip.id)}
                className={`pixel-card p-3 border-2 cursor-pointer hover:bg-gray-100 transition-colors ${
                  trip.isCurrent ? 'border-yellow-500 bg-yellow-50' : 'border-black'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold mb-1">
                      {trip.name}
                      {trip.isCurrent && (
                        <span className="ml-2 text-xs bg-yellow-500 px-2 py-0.5">{t('tripList.current')}</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-xs opacity-70 mb-1">
                      <MapPin className="w-3 h-3" />
                      <span>{trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs opacity-70">
                      <Calendar className="w-3 h-3" />
                      <span>{trip.days} {t('tripList.days')}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>
                    <div className="opacity-70">{t('tripList.spent')}</div>
                    <div className="font-bold">
                      {trip.currency} {trip.totalSpent.toLocaleString()} / {trip.totalBudget.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="opacity-70">{t('tripList.distance')}</div>
                    <div className="font-bold">
                      {trip.distance > 0 ? `${trip.distance.toFixed(1)} km` : '計算中...'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pixel-card p-3 bg-gray-100 border-2 border-black mt-4">
            <h3 className="text-sm font-bold mb-2">{t('tripList.total')}</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3" />
                  <span>{t('tripList.totalSpent')}</span>
                </span>
                <span className="font-bold">
                  {tripSummaries[0]?.currency || 'TWD'} {totalAllSpent.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  <span>{t('tripList.totalDistance')}</span>
                </span>
                <span className="font-bold">{totalAllDistance.toFixed(1)} km</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

