'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTravelStore } from '@/store/useTravelStore';
import { useStorageStore } from '@/store/useStorageStore';
import Clock from '@/components/Clock';
import { Home, Sparkles } from 'lucide-react';

export default function AIPlanPage() {
  const router = useRouter();
  const { setItinerary, setTripSettings } = useTravelStore();
  const { updateCurrentTrip } = useStorageStore();
  
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(50000);
  const [currency, setCurrency] = useState('TWD');
  const [preferences, setPreferences] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 檢查是否有 API key
  const hasApiKey = typeof window !== 'undefined' 
    ? !!(localStorage.getItem('user_gemini_api_key') || '').trim()
    : false;

  const handleGenerate = async () => {
    if (!destination.trim()) {
      setError('請輸入目的地');
      return;
    }

    // 檢查是否有 API key
    const userApiKey = typeof window !== 'undefined' 
      ? localStorage.getItem('user_gemini_api_key') || ''
      : '';

    if (!userApiKey || userApiKey.trim() === '') {
      setError('請先前往「API 金鑰設定」頁面設定您的 Gemini API Key。\n\n點擊右上角「主選單」→「API 金鑰設定」');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/gen-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination,
          days,
          budget,
          currency,
          preferences,
          userApiKey, // 發送使用者設定的 API key
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errorCode === 'INVALID_API_KEY' && errorData.details) {
          throw new Error(`${errorData.error}\n\n${errorData.details}`);
        }
        if (errorData.errorCode === 'API_KEY_NOT_SET' && errorData.details) {
          throw new Error(`${errorData.error}\n\n${errorData.details}\n\n請前往「API 金鑰設定」頁面設定您的 API 金鑰。`);
        }
        throw new Error(errorData.error || errorData.details || '生成行程失敗');
      }

      const data = await response.json();
      
      // 設定行程設定
      const settings = {
        totalBudget: budget,
        destination,
        currency,
      };
      setTripSettings(settings);

      // 設定行程（為每一天添加日期）
      const today = new Date();
      const itineraryWithDates = data.itinerary.map((day: any, index: number) => ({
        ...day,
        date: new Date(today.getTime() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }));

      setItinerary(itineraryWithDates);
      updateCurrentTrip(settings, itineraryWithDates);
      
      // 跳轉到規劃頁面
      router.push('/plan');
    } catch (err: any) {
      setError(err.message || '生成行程時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5dc]">
      {/* 右上角時鐘和按鈕 - 調整位置避免被狀態列擋住 */}
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
        <div className="pixel-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6" />
            <h1 className="text-xl">AI 推薦行程</h1>
          </div>

          {!hasApiKey && (
            <div className="pixel-card p-4 mb-4 bg-yellow-100 border-yellow-500 text-xs">
              <p className="font-bold mb-2">⚠️ 尚未設定 API 金鑰</p>
              <p className="mb-2">使用 AI 推薦功能前，請先前往「API 金鑰設定」頁面設定您的 Gemini API Key。</p>
              <button
                onClick={() => router.push('/settings')}
                className="pixel-button px-3 py-2 text-xs mt-2"
              >
                前往設定 API 金鑰
              </button>
            </div>
          )}

          {error && (
            <div className="pixel-card p-3 mb-4 bg-red-100 border-red-500 text-red-700 text-xs whitespace-pre-line">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs mb-2">目的地 *</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="例如：東京、台北、首爾"
                className="pixel-input w-full px-4 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-2">天數 *</label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                  min="1"
                  max="30"
                  className="pixel-input w-full px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-xs mb-2">總預算 *</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                  min="0"
                  className="pixel-input w-full px-4 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-2">貨幣</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="pixel-input w-full px-4 py-2"
              >
                <option value="TWD">TWD</option>
                <option value="USD">USD</option>
                <option value="JPY">JPY</option>
                <option value="KRW">KRW</option>
                <option value="CNY">CNY</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs mb-2">旅遊偏好（選填）</label>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="例如：喜歡美食、偏好文化景點、想要購物..."
                rows={3}
                className="pixel-input w-full px-4 py-2"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !hasApiKey}
              className="pixel-button w-full py-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin inline-block mr-2" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  AI 生成行程
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

