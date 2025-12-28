'use client';

import { useRouter } from 'next/navigation';
import Clock from './Clock';
import TripList from './TripList';
import LanguageSelector from './LanguageSelector';
import { Settings } from 'lucide-react';
import { useLanguageStore, t } from '@/store/useLanguageStore';

export default function MainMenu() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f5f5dc]">
      {/* 右上角時鐘和語言選擇器 */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <LanguageSelector />
        <Clock />
      </div>

      <div className="flex gap-4 p-4 pt-20">
        {/* 左側：行程列表 */}
        <div className="w-80 flex-shrink-0">
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
    </div>
  );
}

