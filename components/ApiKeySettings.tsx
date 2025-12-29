'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Eye, EyeOff } from 'lucide-react';

export default function ApiKeySettings() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [airLabsApiKey, setAirLabsApiKey] = useState('');
  const [serpApiKey, setSerpApiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showMapsKey, setShowMapsKey] = useState(false);
  const [showAirLabsKey, setShowAirLabsKey] = useState(false);
  const [showSerpApiKey, setShowSerpApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // 載入已保存的 API keys
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGeminiKey = localStorage.getItem('user_gemini_api_key') || '';
      const savedMapsKey = localStorage.getItem('user_google_maps_api_key') || '';
      const savedAirLabsKey = localStorage.getItem('user_airlabs_api_key') || '';
      const savedSerpApiKey = localStorage.getItem('user_serpapi_api_key') || '';
      setGeminiApiKey(savedGeminiKey);
      setGoogleMapsApiKey(savedMapsKey);
      setAirLabsApiKey(savedAirLabsKey);
      setSerpApiKey(savedSerpApiKey);
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_gemini_api_key', geminiApiKey);
      localStorage.setItem('user_google_maps_api_key', googleMapsApiKey);
      localStorage.setItem('user_airlabs_api_key', airLabsApiKey);
      localStorage.setItem('user_serpapi_api_key', serpApiKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      
      // 如果設置了 Google Maps API key，重新載入頁面以載入 Maps API
      if (googleMapsApiKey) {
        window.location.reload();
      }
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <div className="pixel-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5" />
        <h2 className="text-lg">API 金鑰設定</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs mb-2">
            Google Gemini API Key
            <span className="text-[10px] opacity-70 ml-2">
              (用於 AI 行程生成)
            </span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="輸入您的 Gemini API Key"
                className="pixel-input w-full px-3 py-2 text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                title={showGeminiKey ? '隱藏' : '顯示'}
              >
                {showGeminiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          {geminiApiKey && !showGeminiKey && (
            <p className="text-[10px] opacity-70 mt-1">
              已輸入: {maskApiKey(geminiApiKey)}
            </p>
          )}
          <p className="text-[10px] opacity-70 mt-1">
            取得方式: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
          </p>
        </div>

        <div>
          <label className="block text-xs mb-2">
            Google Maps API Key
            <span className="text-[10px] opacity-70 ml-2">
              (用於地圖和地點自動完成)
            </span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showMapsKey ? 'text' : 'password'}
                value={googleMapsApiKey}
                onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                placeholder="輸入您的 Google Maps API Key"
                className="pixel-input w-full px-3 py-2 text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowMapsKey(!showMapsKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                title={showMapsKey ? '隱藏' : '顯示'}
              >
                {showMapsKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          {googleMapsApiKey && !showMapsKey && (
            <p className="text-[10px] opacity-70 mt-1">
              已輸入: {maskApiKey(googleMapsApiKey)}
            </p>
          )}
          <p className="text-[10px] opacity-70 mt-1">
            取得方式: <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a>
          </p>
        </div>

        <div>
          <label className="block text-xs mb-2">
            AirLabs API Key
            <span className="text-[10px] opacity-70 ml-2">
              (用於查詢實時航班信息)
            </span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showAirLabsKey ? 'text' : 'password'}
                value={airLabsApiKey}
                onChange={(e) => setAirLabsApiKey(e.target.value)}
                placeholder="輸入您的 AirLabs API Key"
                className="pixel-input w-full px-3 py-2 text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowAirLabsKey(!showAirLabsKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                title={showAirLabsKey ? '隱藏' : '顯示'}
              >
                {showAirLabsKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          {airLabsApiKey && !showAirLabsKey && (
            <p className="text-[10px] opacity-70 mt-1">
              已輸入: {maskApiKey(airLabsApiKey)}
            </p>
          )}
          <p className="text-[10px] opacity-70 mt-1">
            取得方式: <a href="https://airlabs.co/" target="_blank" rel="noopener noreferrer" className="underline">AirLabs</a>
          </p>
        </div>

        <div>
          <label className="block text-xs mb-2">
            SerpAPI API Key
            <span className="text-[10px] opacity-70 ml-2">
              (用於查詢航班延誤信息和 Google Flights 數據)
            </span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showSerpApiKey ? 'text' : 'password'}
                value={serpApiKey}
                onChange={(e) => setSerpApiKey(e.target.value)}
                placeholder="輸入您的 SerpAPI API Key"
                className="pixel-input w-full px-3 py-2 text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSerpApiKey(!showSerpApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                title={showSerpApiKey ? '隱藏' : '顯示'}
              >
                {showSerpApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          {serpApiKey && !showSerpApiKey && (
            <p className="text-[10px] opacity-70 mt-1">
              已輸入: {maskApiKey(serpApiKey)}
            </p>
          )}
          <p className="text-[10px] opacity-70 mt-1">
            取得方式: <a href="https://serpapi.com/" target="_blank" rel="noopener noreferrer" className="underline">SerpAPI</a>
          </p>
        </div>

        <button
          onClick={handleSave}
          className="pixel-button w-full py-3 text-sm"
        >
          <Save className="w-4 h-4 inline mr-2" />
          {saved ? '已儲存！' : '儲存設定'}
        </button>

        <div className="text-[10px] opacity-70 space-y-1">
          <p>• API 金鑰僅儲存在您的瀏覽器中，不會上傳到伺服器</p>
          <p>• 使用 AI 推薦功能前，必須先設定 Gemini API Key</p>
          <p>• 使用地圖和地點自動完成功能前，必須先設定 Google Maps API Key</p>
          <p>• 使用航班查詢功能前，建議設定 AirLabs 或 SerpAPI API Key 以獲取實時航班信息</p>
          <p>• SerpAPI 提供延誤狀態和地圖路線顯示功能</p>
        </div>
      </div>
    </div>
  );
}

