'use client';

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useTravelStore } from '@/store/useTravelStore';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIGeneratorModal({ isOpen, onClose }: AIGeneratorModalProps) {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(50000);
  const [currency, setCurrency] = useState('TWD');
  const [preferences, setPreferences] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { setItinerary, setTripSettings } = useTravelStore();

  const handleGenerate = async () => {
    if (!destination.trim()) {
      setError('請輸入目的地');
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // 如果是 API 金鑰錯誤，顯示詳細說明
        if (errorData.errorCode === 'INVALID_API_KEY' && errorData.details) {
          throw new Error(`${errorData.error}\n\n${errorData.details}`);
        }
        throw new Error(errorData.error || errorData.details || '生成行程失敗');
      }

      const data = await response.json();
      
      // 設定行程設定
      setTripSettings({
        totalBudget: budget,
        destination,
        currency,
      });

      // 設定行程（為每一天添加日期）
      const today = new Date();
      const itineraryWithDates = data.itinerary.map((day: any, index: number) => ({
        ...day,
        date: new Date(today.getTime() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }));

      setItinerary(itineraryWithDates);
      onClose();
    } catch (err: any) {
      setError(err.message || '生成行程時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI 智能行程規劃</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded whitespace-pre-line">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              目的地 *
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="例如：東京、台北、首爾"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                天數 *
              </label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                min="1"
                max="30"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                總預算 *
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              貨幣
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="TWD">TWD (新台幣)</option>
              <option value="USD">USD (美元)</option>
              <option value="JPY">JPY (日圓)</option>
              <option value="KRW">KRW (韓元)</option>
              <option value="CNY">CNY (人民幣)</option>
              <option value="EUR">EUR (歐元)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              旅遊偏好（選填）
            </label>
            <textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="例如：喜歡美食、偏好文化景點、想要購物..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  生成行程
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

