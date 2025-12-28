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
  
  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(50000);
  const [currency, setCurrency] = useState('TWD');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [preferences, setPreferences] = useState('');
  const [excludedPlaces, setExcludedPlaces] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
      // 處理圖片上傳
      let imageBase64 = '';
      if (imageFile) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      } else if (imageUrl) {
        // 如果是 URL，嘗試獲取圖片
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.warn('無法載入圖片 URL:', err);
        }
      }

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
          excludedPlaces,
          imageBase64,
          userApiKey, // 發送使用者設定的 API key
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || '生成行程失敗';
        const details = errorData.details || '';
        const isQuotaError = errorData.isQuotaError || false;
        
        // 如果是配額錯誤，顯示詳細的解決方案
        if (isQuotaError || response.status === 403 || errorMessage.includes('配額已用完') || errorMessage.includes('RPD')) {
          throw new Error(`${errorMessage}\n\n${details}`);
        }
        
        // 如果是速率限制，提供重試建議
        if (response.status === 429 || errorMessage.includes('速率限制')) {
          throw new Error(`${errorMessage}\n\n${details}`);
        }
        
        // 其他錯誤
        if (errorData.errorCode === 'INVALID_API_KEY' && errorData.details) {
          throw new Error(`${errorMessage}\n\n${errorData.details}`);
        }
        if (errorData.errorCode === 'API_KEY_NOT_SET' && errorData.details) {
          throw new Error(`${errorMessage}\n\n${errorData.details}\n\n請前往「API 金鑰設定」頁面設定您的 API 金鑰。`);
        }
        throw new Error(errorMessage + (details ? `\n\n${details}` : ''));
      }

      const data = await response.json();
      
      // 設定行程設定
      const settings = {
        totalBudget: budget,
        destination,
        currency,
        startDate,
      };
      setTripSettings(settings);

      // 設定行程（為每一天添加日期，使用設定的開始日期或今天）
      const baseDate = startDate || new Date().toISOString().split('T')[0];
      const baseDateObj = new Date(baseDate);
      const itineraryWithDates = data.itinerary.map((day: any, index: number) => ({
        ...day,
        date: new Date(baseDateObj.getTime() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }));

      setItinerary(itineraryWithDates);
      
      // 清除當前行程，確保生成新 ID（避免覆蓋舊行程）
      const { clearCurrentTrip } = useStorageStore.getState();
      clearCurrentTrip();
      
      // 更新當前行程（會生成新 ID）
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

            <div>
              <label className="block text-xs mb-2">旅遊開始日期 *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pixel-input w-full px-4 py-2"
                min={new Date().toISOString().split('T')[0]}
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

            <div>
              <label className="block text-xs mb-2">不要推薦的地點（選填）</label>
              <textarea
                value={excludedPlaces}
                onChange={(e) => setExcludedPlaces(e.target.value)}
                placeholder="例如：不要推薦夜市、不要推薦購物中心..."
                rows={2}
                className="pixel-input w-full px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-xs mb-2">上傳圖片或輸入圖片連結（選填）</label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImageUrl('');
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setImagePreview(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="pixel-input w-full px-4 py-2 text-xs"
                />
                <div className="text-xs opacity-70 mb-2">或</div>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageFile(null);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="輸入圖片 URL"
                  className="pixel-input w-full px-4 py-2"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="預覽"
                      className="max-w-full h-32 object-contain border-2 border-black"
                      onError={() => setImagePreview(null)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImageUrl('');
                        setImagePreview(null);
                      }}
                      className="pixel-button px-2 py-1 text-xs mt-2"
                    >
                      清除圖片
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[10px] opacity-70 mt-1">
                AI 會分析圖片中的地點並加入行程中
              </p>
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

