'use client';

import { useRouter } from 'next/navigation';
import Clock from './Clock';

export default function MainMenu() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f5f5dc] flex flex-col items-center justify-center p-4">
      {/* 右上角時鐘 */}
      <div className="absolute top-4 right-4">
        <Clock />
      </div>

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
          OLAF TOURISM PLANNER
        </h1>
        <p className="text-sm" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          旅遊規劃助手
        </p>
      </div>

      {/* 選單選項 */}
      <div className="space-y-6 w-full max-w-md">
        <button
          onClick={() => router.push('/plan')}
          className="pixel-button w-full py-6 text-sm"
        >
          1. 自行規劃行程
        </button>

        <button
          onClick={() => router.push('/ai-plan')}
          className="pixel-button w-full py-6 text-sm"
        >
          2. AI 推薦行程
        </button>

        <button
          onClick={() => router.push('/history')}
          className="pixel-button w-full py-6 text-sm"
        >
          3. 查看行程記錄
        </button>
      </div>
    </div>
  );
}

