'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Clock from './Clock';
import TripList from './TripList';
import LanguageSelector from './LanguageSelector';
import UserMenu from './UserMenu';
import { Settings, Menu, X, Camera, FileText } from 'lucide-react';
import { useLanguageStore, t } from '@/store/useLanguageStore';
import { useStorageStore } from '@/store/useStorageStore';
import { useTravelStore } from '@/store/useTravelStore';
import CurrentTripModal from './CurrentTripModal';
import CameraTranslateModal from './CameraTranslateModal';

export default function MainMenu() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { syncFromServer, currentTrip } = useStorageStore();
  const { tripSettings, itinerary } = useTravelStore();
  const [showTripList, setShowTripList] = useState(false);
  const [showCurrentTripModal, setShowCurrentTripModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  useEffect(() => {
    // 如果已登入，從服務器同步行程
    if (status === 'authenticated') {
      syncFromServer();
    }
  }, [status, syncFromServer]);

  // 檢查是否有當前行程，並且根據日期判斷是否為當前進行中的行程
  const checkIsCurrentTrip = () => {
    const trip = currentTrip || (tripSettings && itinerary.length > 0 ? {
      id: 'current',
      name: '當前行程',
      settings: tripSettings,
      itinerary,
    } : null);
    
    if (!trip) return false;
    
    // 如果行程有開始日期，檢查當前日期是否在行程日期範圍內
    if (trip.settings?.startDate && trip.itinerary?.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const startDate = trip.settings.startDate;
      const lastDay = trip.itinerary[trip.itinerary.length - 1];
      const endDate = lastDay?.date || startDate;
      
      // 檢查今天是否在行程日期範圍內
      return today >= startDate && today <= endDate;
    }
    
    // 如果沒有開始日期，只要有行程就顯示
    return trip.itinerary?.length > 0;
  };
  
  const hasCurrentTrip = checkIsCurrentTrip();

  // 如果未登入，重定向到登入頁面
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center">
        <div className="pixel-card p-4">
          <p className="text-xs">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5dc]">
      {/* 手機版頂部狀態列 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b-4 border-black">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTripList(!showTripList)}
              className="pixel-button px-3 py-2 text-xs"
            >
              <Menu className="w-4 h-4 inline mr-1" />
              <span>行程</span>
            </button>
            {hasCurrentTrip && (
              <button
                onClick={() => setShowCurrentTripModal(true)}
                className="pixel-button px-3 py-2 text-xs"
              >
                <FileText className="w-4 h-4 inline mr-1" />
                <span>當前行程</span>
              </button>
            )}
            <button
              onClick={() => setShowCameraModal(true)}
              className="pixel-button px-3 py-2 text-xs"
            >
              <Camera className="w-4 h-4 inline mr-1" />
              <span>翻譯</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <UserMenu />
            <Clock />
          </div>
        </div>
      </div>

      {/* 手機版行程列表抽屜 */}
      {showTripList && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowTripList(false)}
          />
          <div className="lg:hidden fixed top-14 left-0 bottom-0 w-80 bg-[#f5f5dc] z-40 overflow-y-auto border-r-4 border-black">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">行程列表</h2>
                <button
                  onClick={() => setShowTripList(false)}
                  className="pixel-button px-3 py-2 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <TripList />
            </div>
          </div>
        </>
      )}

      {/* 桌面版右上角時鐘、語言選擇器和用戶菜單 */}
      <div className="hidden lg:flex absolute top-4 right-4 z-10 gap-2">
        <LanguageSelector />
        <UserMenu />
        <Clock />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 p-4 pt-24 lg:pt-20">
        {/* 左側：行程列表（桌面版顯示，手機版隱藏） */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <TripList />
        </div>

        {/* 右側：主選單 */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Logo 和主標題 */}
          <div className="mb-12 text-center">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <img 
                src="/logo.png" 
                alt="Olaf tourism planner Logo" 
                className="w-24 h-24 object-contain border-4 border-black"
                onError={(e) => {
                  // 如果圖片載入失敗，隱藏圖片
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-4xl mb-4" style={{ fontFamily: "'Press Start 2P', monospace", textShadow: '4px 4px 0px #000' }}>
              {t('mainMenu.title')}
            </h1>
            <p className="text-sm" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              {t('mainMenu.subtitle')}
            </p>
          </div>

          {/* 選單選項 */}
          <div className="space-y-6 w-full max-w-md">
            <button
              onClick={() => router.push('/plan')}
              className="pixel-button w-full py-6 text-sm"
            >
              1. {t('mainMenu.plan')}
            </button>

            <button
              onClick={() => router.push('/ai-plan')}
              className="pixel-button w-full py-6 text-sm"
            >
              2. {t('mainMenu.aiPlan')}
            </button>

            <button
              onClick={() => router.push('/history')}
              className="pixel-button w-full py-6 text-sm"
            >
              3. {t('mainMenu.history')}
            </button>

            <button
              onClick={() => router.push('/settings')}
              className="pixel-button w-full py-6 text-sm"
            >
              <Settings className="w-4 h-4 inline mr-2" />
              4. {t('mainMenu.settings')}
            </button>
          </div>
        </div>
      </div>

      {/* 當前行程模態框 */}
      <CurrentTripModal 
        isOpen={showCurrentTripModal} 
        onClose={() => setShowCurrentTripModal(false)} 
      />

      {/* 拍照翻譯模態框 */}
      <CameraTranslateModal 
        isOpen={showCameraModal} 
        onClose={() => setShowCameraModal(false)} 
      />
    </div>
  );
}

