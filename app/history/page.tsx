'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTravelStore } from '@/store/useTravelStore';
import { useStorageStore } from '@/store/useStorageStore';
import Clock from '@/components/Clock';
import DaySection from '@/components/DaySection';
import BudgetHeader from '@/components/BudgetHeader';
import { Home, Trash2, Eye } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { savedTrips, loadTrip, deleteTrip, clearCurrentTrip } = useStorageStore();
  const { setItinerary, setTripSettings } = useTravelStore();
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

  const handleLoadTrip = (tripId: string) => {
    loadTrip(tripId);
    const trip = savedTrips.find(t => t.id === tripId);
    if (trip) {
      setTripSettings(trip.settings);
      setItinerary(trip.itinerary);
      setSelectedTrip(tripId);
    }
  };

  const handleDeleteTrip = (tripId: string) => {
    if (confirm('確定要刪除此行程嗎？')) {
      deleteTrip(tripId);
      if (selectedTrip === tripId) {
        clearCurrentTrip();
        setSelectedTrip(null);
        setItinerary([]);
        setTripSettings(null);
      }
    }
  };

  const currentTrip = selectedTrip ? savedTrips.find(t => t.id === selectedTrip) : null;

  return (
    <div className="min-h-screen bg-[#f5f5dc]">
      <BudgetHeader />
      
      {/* 右上角時鐘和按鈕 - 調整位置避免被狀態列擋住 */}
      <div className="fixed top-20 right-4 flex gap-3 z-50">
        <Clock />
        <button
          onClick={() => router.push('/')}
          className="pixel-button px-4 py-2 text-sm"
        >
          <Home className="w-4 h-4 inline mr-2" />
          主選單
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：行程列表 */}
          <div className="lg:col-span-1">
            <div className="pixel-card p-4 mb-4">
              <h2 className="text-lg mb-4">行程記錄</h2>
              {savedTrips.length === 0 ? (
                <p className="text-xs text-gray-600">還沒有儲存的行程</p>
              ) : (
                <div className="space-y-2">
                  {savedTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className={`pixel-card p-3 cursor-pointer ${
                        selectedTrip === trip.id ? 'bg-black' : 'bg-white'
                      }`}
                      onClick={() => handleLoadTrip(trip.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xs font-bold mb-1">{trip.name}</h3>
                          <p className="text-[8px] opacity-70">
                            {trip.settings.destination}
                          </p>
                          <p className="text-[8px] opacity-70 mt-1">
                            {new Date(trip.updatedAt).toLocaleDateString('zh-TW')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTrip(trip.id);
                          }}
                          className="pixel-button px-3 py-1.5 text-sm bg-red-500 ml-2"
                        >
                          <Trash2 className="w-3 h-3 inline mr-1" />
                          刪除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右側：行程詳情 */}
          <div className="lg:col-span-2">
            {currentTrip ? (
              <div className="space-y-6">
                <div className="pixel-card p-4">
                  <h1 className="text-xl mb-2">{currentTrip.name}</h1>
                  <p className="text-xs">
                    目的地: {currentTrip.settings.destination} | 
                    預算: {currentTrip.settings.currency} {currentTrip.settings.totalBudget.toLocaleString()} | 
                    {currentTrip.itinerary.length} 天
                  </p>
                </div>

                {currentTrip.itinerary.map((day) => (
                  <DaySection key={day.dayId} day={day} />
                ))}
              </div>
            ) : (
              <div className="pixel-card p-8 text-center">
                <p className="text-xs">選擇左側的行程以查看詳情</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

