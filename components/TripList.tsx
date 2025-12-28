'use client';

import { useEffect, useState } from 'react';
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
  const { savedTrips, currentTrip } = useStorageStore();
  const { tripSettings, itinerary, getTotalSpent } = useTravelStore();
  const [tripSummaries, setTripSummaries] = useState<TripSummary[]>([]);
  const [totalAllSpent, setTotalAllSpent] = useState(0);
  const [totalAllDistance, setTotalAllDistance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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

      // 處理歷史行程
      for (const trip of savedTrips) {
        if (trip.id === currentTrip?.id) continue; // 跳過已在當前行程中的

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
                className={`pixel-card p-3 border-2 ${
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

