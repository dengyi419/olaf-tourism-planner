'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTravelStore } from '@/store/useTravelStore';
import { useStorageStore } from '@/store/useStorageStore';
import DaySection from '@/components/DaySection';
import BudgetHeader from '@/components/BudgetHeader';
import { Home, Trash2, Save, Share2 } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { savedTrips, loadTrip, deleteTrip, clearCurrentTrip, updateCurrentTrip } = useStorageStore();
  const { tripSettings, itinerary, setItinerary, setTripSettings } = useTravelStore();
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLoadTrip = (tripId: string) => {
    loadTrip(tripId);
    const trip = savedTrips.find(t => t.id === tripId);
    if (trip) {
      setTripSettings(trip.settings);
      setItinerary(trip.itinerary);
      setSelectedTrip(tripId);
    }
  };

  // 監聽行程變化，自動保存
  useEffect(() => {
    if (selectedTrip && tripSettings && itinerary.length > 0) {
      // 清除之前的定時器
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // 設置新的定時器，延遲 1 秒後保存（防抖）
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await updateCurrentTrip(tripSettings, itinerary);
          // 同時更新本地 savedTrips
          const trip = savedTrips.find(t => t.id === selectedTrip);
          if (trip) {
            // 更新本地狀態
            const updatedTrips = savedTrips.map(t =>
              t.id === selectedTrip
                ? { ...trip, settings: tripSettings, itinerary, updatedAt: new Date().toISOString() }
                : t
            );
            useStorageStore.setState({ savedTrips: updatedTrips });
          }
        } catch (error) {
          console.error('保存失敗:', error);
        } finally {
          setIsSaving(false);
        }
      }, 1000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [tripSettings, itinerary, selectedTrip, savedTrips, updateCurrentTrip]);

  const handleManualSave = async () => {
    if (!selectedTrip || !tripSettings || itinerary.length === 0) return;

    setIsSaving(true);
    try {
      await updateCurrentTrip(tripSettings, itinerary);
      // 更新本地 savedTrips
      const trip = savedTrips.find(t => t.id === selectedTrip);
      if (trip) {
        const updatedTrips = savedTrips.map(t =>
          t.id === selectedTrip
            ? { ...trip, settings: tripSettings, itinerary, updatedAt: new Date().toISOString() }
            : t
        );
        useStorageStore.setState({ savedTrips: updatedTrips });
      }
      alert('已儲存');
    } catch (error) {
      console.error('保存失敗:', error);
      alert('儲存失敗，請重試');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (confirm('確定要刪除此行程嗎？')) {
      await deleteTrip(tripId);
      if (selectedTrip === tripId) {
        clearCurrentTrip();
        setSelectedTrip(null);
        setItinerary([]);
        setTripSettings(null);
      }
      // 刪除後重新同步（deleteTrip 內部已經會同步，這裡確保 UI 更新）
      const { syncFromServer } = useStorageStore.getState();
      await syncFromServer();
    }
  };

  const handleShareTrip = async () => {
    if (!currentTrip || !tripSettings || itinerary.length === 0) {
      alert('沒有行程可以分享');
      return;
    }

    setIsGeneratingShare(true);
    try {
      const response = await fetch('/api/share-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: currentTrip.id,
          name: currentTrip.name,
          settings: tripSettings,
          itinerary,
        }),
      });

      if (!response.ok) {
        throw new Error('生成分享連結失敗');
      }

      const data = await response.json();
      
      // 複製到剪貼板
      await navigator.clipboard.writeText(data.shareUrl);
      alert('分享連結已複製到剪貼板！');
    } catch (error) {
      console.error('Error sharing trip:', error);
      alert('生成分享連結失敗，請重試');
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const currentTrip = selectedTrip ? savedTrips.find(t => t.id === selectedTrip) : null;

  return (
    <div className="min-h-screen bg-[#f5f5dc]">
      <BudgetHeader 
        rightButtons={
          <>
            {selectedTrip && tripSettings && (
              <button
                onClick={handleManualSave}
                disabled={isSaving}
                className="pixel-button px-3 py-1.5 text-xs disabled:opacity-50"
                title="手動儲存"
              >
                <Save className="w-3 h-3 inline mr-1" />
                {isSaving ? '儲存中...' : '儲存'}
              </button>
            )}
          </>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ paddingTop: '120px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：行程列表 */}
          <div className="lg:col-span-1">
            <div className="pixel-card p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg">行程記錄</h2>
                <button
                  onClick={() => router.push('/')}
                  className="pixel-button px-3 py-1.5 text-xs lg:hidden"
                >
                  <Home className="w-3 h-3 inline mr-1" />
                  主選單
                </button>
              </div>
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
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h1 className="text-xl mb-2">{currentTrip.name}</h1>
                      <p className="text-xs">
                        目的地: {currentTrip.settings.destination} | 
                        預算: {currentTrip.settings.currency} {currentTrip.settings.totalBudget.toLocaleString()} | 
                        {currentTrip.itinerary.length} 天
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={handleShareTrip}
                        disabled={isGeneratingShare}
                        className="pixel-button px-4 py-2 text-sm disabled:opacity-50"
                        title="生成分享連結"
                      >
                        <Share2 className="w-4 h-4 inline mr-2" />
                        {isGeneratingShare ? '生成中...' : '分享連結'}
                      </button>
                      <button
                        onClick={() => handleDeleteTrip(currentTrip.id)}
                        className="pixel-button px-4 py-2 text-sm bg-red-500 hover:bg-red-600"
                        title="刪除此行程"
                      >
                        <Trash2 className="w-4 h-4 inline mr-2" />
                        刪除行程
                      </button>
                    </div>
                  </div>
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

