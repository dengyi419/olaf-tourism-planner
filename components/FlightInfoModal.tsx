'use client';

import { useState } from 'react';
import { X, Search, Plane, MapPin, DoorOpen, Luggage, AlertCircle } from 'lucide-react';
import FlightRouteMap from './FlightRouteMap';

interface FlightInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FlightInfo {
  flightNumber: string;
  departure: {
    airport: string;
    city: string;
    terminal?: string;
    gate?: string;
    checkInCounter?: string;
  };
  arrival: {
    airport: string;
    city: string;
    terminal?: string;
    gate?: string;
    baggageClaim?: string;
  };
  status?: string;
  isDelayed?: boolean;
  delayMinutes?: number;
  scheduledTime?: {
    departure?: string;
    arrival?: string;
  };
  actualTime?: {
    departure?: string;
    arrival?: string;
  };
}

export default function FlightInfoModal({ isOpen, onClose }: FlightInfoModalProps) {
  const [flightNumber, setFlightNumber] = useState('');
  // 計算最小日期（前兩天）
  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 2);
    return date.toISOString().split('T')[0];
  };
  const [flightDate, setFlightDate] = useState(new Date().toISOString().split('T')[0]); // 預設為今天
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [flightInfo, setFlightInfo] = useState<FlightInfo | null>(null);
  const [useSerpAPI, setUseSerpAPI] = useState(false); // 選擇使用 SerpAPI 還是 AirLabs

  const handleSearch = async () => {
    if (!flightNumber.trim()) {
      setError('請輸入航班編號');
      return;
    }

    setIsLoading(true);
    setError('');
    setFlightInfo(null);

    try {
      // 根據選擇的 API 獲取對應的 API key
      const apiKeyName = useSerpAPI ? 'user_serpapi_api_key' : 'user_airlabs_api_key';
      const userApiKey = typeof window !== 'undefined' 
        ? localStorage.getItem(apiKeyName) || ''
        : '';

      const apiEndpoint = useSerpAPI ? '/api/flight-info-serpapi' : '/api/flight-info';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          flightNumber: flightNumber.trim().toUpperCase(),
          flightDate: flightDate || undefined, // 傳遞日期參數
          userApiKey: userApiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '查詢航班信息失敗');
      }

      const data = await response.json();
      setFlightInfo(data);
    } catch (err: any) {
      setError(err.message || '查詢航班信息時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="pixel-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-[#f5f5dc]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Plane className="w-6 h-6" />
            <h2 className="text-xl">查詢航班信息</h2>
          </div>
          <button
            onClick={onClose}
            className="pixel-button px-3 py-2 text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs mb-2">航班編號 *</label>
            <input
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="例如：CI100、BR101、JX123"
              className="pixel-input w-full px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-xs mb-2">查詢日期</label>
            <input
              type="date"
              value={flightDate}
              onChange={(e) => setFlightDate(e.target.value)}
              className="pixel-input w-full px-4 py-2"
              min={getMinDate()} // 可以選擇前兩天
            />
            <p className="text-[10px] opacity-70 mt-1">
              {useSerpAPI 
                ? 'SerpAPI 支持日期查詢，將查詢指定日期的航班信息'
                : '注意：AirLabs API 目前不支持日期參數，將查詢實時航班信息'}
            </p>
          </div>

          <div>
            <label className="block text-xs mb-2">查詢方式</label>
            <div className="flex gap-2">
              <button
                onClick={() => setUseSerpAPI(false)}
                className={`pixel-button flex-1 py-2 text-xs ${!useSerpAPI ? 'bg-blue-200' : ''}`}
              >
                AirLabs
              </button>
              <button
                onClick={() => setUseSerpAPI(true)}
                className={`pixel-button flex-1 py-2 text-xs ${useSerpAPI ? 'bg-blue-200' : ''}`}
              >
                SerpAPI (含延誤資訊)
              </button>
            </div>
            <p className="text-[10px] opacity-70 mt-1">
              SerpAPI 提供延誤狀態和地圖路線顯示
            </p>
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading || !flightNumber.trim()}
            className="pixel-button w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin inline-block mr-2" />
                查詢中...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 inline mr-2" />
                查詢航班信息
              </>
            )}
          </button>

          {error && (
            <div className="pixel-card p-3 bg-red-100 border-red-500 text-red-700 text-xs">
              {error}
            </div>
          )}

          {flightInfo && (
            <div className="space-y-4">
              <div className="pixel-card p-4 border-2 border-black">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold">{flightInfo.flightNumber}</h3>
                  {flightInfo.status && (
                    <span className={`text-xs px-2 py-1 border border-black ${
                      flightInfo.isDelayed 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {flightInfo.status}
                    </span>
                  )}
                </div>

                {/* 延誤警告 */}
                {flightInfo.isDelayed && flightInfo.delayMinutes && (
                  <div className="mb-3 p-2 bg-red-100 border-2 border-red-500 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-bold text-red-800">
                      航班延誤 {flightInfo.delayMinutes} 分鐘
                    </span>
                  </div>
                )}

                {/* 出發信息 */}
                <div className="mb-4 pb-4 border-b-2 border-black">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-bold">出發</span>
                  </div>
                  <div className="pl-6 space-y-1 text-xs">
                    <div className="font-bold">{flightInfo.departure.airport}</div>
                    <div className="opacity-70">{flightInfo.departure.city}</div>
                    {flightInfo.scheduledTime?.departure && (
                      <div className="opacity-70">
                        計劃時間：{flightInfo.scheduledTime.departure}
                      </div>
                    )}
                    {flightInfo.actualTime?.departure && (
                      <div className={flightInfo.isDelayed ? 'text-red-600 font-bold' : 'opacity-70'}>
                        實際時間：{flightInfo.actualTime.departure}
                      </div>
                    )}
                    {flightInfo.departure.terminal && (
                      <div>航廈：{flightInfo.departure.terminal}</div>
                    )}
                    {flightInfo.departure.checkInCounter && (
                      <div className="flex items-center gap-1">
                        <DoorOpen className="w-3 h-3" />
                        報到櫃檯：{flightInfo.departure.checkInCounter}
                      </div>
                    )}
                    {flightInfo.departure.gate && (
                      <div className="flex items-center gap-1">
                        <DoorOpen className="w-3 h-3" />
                        登機門：{flightInfo.departure.gate}
                      </div>
                    )}
                  </div>
                </div>

                {/* 抵達信息 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-bold">抵達</span>
                  </div>
                  <div className="pl-6 space-y-1 text-xs">
                    <div className="font-bold">{flightInfo.arrival.airport}</div>
                    <div className="opacity-70">{flightInfo.arrival.city}</div>
                    {flightInfo.scheduledTime?.arrival && (
                      <div className="opacity-70">
                        計劃時間：{flightInfo.scheduledTime.arrival}
                      </div>
                    )}
                    {flightInfo.actualTime?.arrival && (
                      <div className={flightInfo.isDelayed ? 'text-red-600 font-bold' : 'opacity-70'}>
                        實際時間：{flightInfo.actualTime.arrival}
                      </div>
                    )}
                    {flightInfo.arrival.terminal && (
                      <div>航廈：{flightInfo.arrival.terminal}</div>
                    )}
                    {flightInfo.arrival.gate && (
                      <div className="flex items-center gap-1">
                        <DoorOpen className="w-3 h-3" />
                        登機門：{flightInfo.arrival.gate}
                      </div>
                    )}
                    {flightInfo.arrival.baggageClaim && (
                      <div className="flex items-center gap-1">
                        <Luggage className="w-3 h-3" />
                        行李轉盤：{flightInfo.arrival.baggageClaim}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Google Maps 路線圖（僅在使用 SerpAPI 時顯示） */}
              {useSerpAPI && flightInfo.departure.airport && flightInfo.arrival.airport && (
                <div className="pixel-card p-4 border-2 border-black">
                  <h4 className="text-xs font-bold mb-2">機場路線圖</h4>
                  <FlightRouteMap
                    departureAirport={flightInfo.departure.airport}
                    arrivalAirport={flightInfo.arrival.airport}
                    departureCity={flightInfo.departure.city}
                    arrivalCity={flightInfo.arrival.city}
                  />
                </div>
              )}
            </div>
          )}

          <div className="text-xs opacity-70">
            <p>提示：航班信息可能因實際情況而變動，請以機場公告為準。</p>
          </div>
        </div>
      </div>
    </div>
  );
}

