'use client';

import { useRouter } from 'next/navigation';
import Clock from '@/components/Clock';
import ApiKeySettings from '@/components/ApiKeySettings';
import { Home } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f5f5dc]">
      {/* 右上角時鐘和按鈕 */}
      <div className="fixed top-20 right-4 flex gap-3 z-50 flex-wrap justify-end max-w-[calc(100vw-2rem)]">
        <Clock />
        <button
          onClick={() => router.push('/')}
          className="pixel-button px-4 py-2 text-sm"
        >
          <Home className="w-4 h-4 inline mr-2" />
          主選單
        </button>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        <ApiKeySettings />
      </main>
    </div>
  );
}

