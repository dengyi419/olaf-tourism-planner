'use client';

import { useState } from 'react';
import { X, Search, Plane, MapPin, DoorOpen, Luggage, AlertCircle } from 'lucide-react';
import FlightRouteMap from './FlightRouteMap';
import { useLanguageStore, t } from '@/store/useLanguageStore';

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
  baggageInfo?: {
    baggageClaim?: string;
    baggageAllowance?: string;
    carryOn?: string;
    checkedBaggage?: string;
  };
}

export default function FlightInfoModal({ isOpen, onClose }: FlightInfoModalProps) {
  const language = useLanguageStore((state) => state.language);
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
      setError(t('flight.errorNoFlightNumber'));
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
      
      // 如果使用 SerpAPI，也需要 AirLabs API Key 來獲取機場代碼
      const airLabsApiKey = useSerpAPI && typeof window !== 'undefined'
        ? localStorage.getItem('user_airlabs_api_key') || ''
        : undefined;

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
          airLabsApiKey: airLabsApiKey || undefined, // SerpAPI 需要 AirLabs 來獲取機場代碼
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const currentLanguage = useLanguageStore.getState().language;
        const defaultError = currentLanguage === 'zh-TW' ? '查詢航班信息失敗' : currentLanguage === 'en' ? 'Failed to query flight information' : currentLanguage === 'ja' ? 'フライト情報の照会に失敗しました' : '항공편 정보 조회 실패';
        throw new Error(errorData.error || defaultError);
      }

      const data = await response.json();
      setFlightInfo(data);
    } catch (err: any) {
      const currentLanguage = useLanguageStore.getState().language;
      const defaultError = currentLanguage === 'zh-TW' ? '查詢航班信息時發生錯誤' : currentLanguage === 'en' ? 'An error occurred while querying flight information' : currentLanguage === 'ja' ? 'フライト情報の照会中にエラーが発生しました' : '항공편 정보 조회 중 오류가 발생했습니다';
      setError(err.message || defaultError);
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
            <h2 className="text-xl">{t('flight.title')}</h2>
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
            <label className="block text-xs mb-2">{t('flight.flightNumber')} *</label>
            <input
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder={language === 'zh-TW' ? '例如：CI100、BR101、JX123' : language === 'en' ? 'e.g., CI100, BR101, JX123' : language === 'ja' ? '例：CI100、BR101、JX123' : '예: CI100, BR101, JX123'}
              className="pixel-input w-full px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-xs mb-2">{t('flight.date')}</label>
            <input
              type="date"
              value={flightDate}
              onChange={(e) => setFlightDate(e.target.value)}
              className="pixel-input w-full px-4 py-2"
              min={getMinDate()} // 可以選擇前兩天
            />
            <p className="text-[10px] opacity-70 mt-1">
              {useSerpAPI 
                ? t('flight.dateNoteSerpAPI')
                : t('flight.dateNote')}
            </p>
          </div>

          <div>
            <label className="block text-xs mb-2">{t('flight.apiSelect')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setUseSerpAPI(false)}
                className={`pixel-button flex-1 py-2 text-xs ${!useSerpAPI ? 'bg-blue-200' : ''}`}
              >
                {t('flight.apiAirLabs')}
              </button>
              <button
                onClick={() => setUseSerpAPI(true)}
                className={`pixel-button flex-1 py-2 text-xs ${useSerpAPI ? 'bg-blue-200' : ''}`}
              >
                {t('flight.apiSerpAPI')}
              </button>
            </div>
            <p className="text-[10px] opacity-70 mt-1">
              {language === 'zh-TW' ? 'SerpAPI 提供延誤狀態和地圖路線顯示' : language === 'en' ? 'SerpAPI provides delay status and route map display' : language === 'ja' ? 'SerpAPIは遅延ステータスとルートマップ表示を提供' : 'SerpAPI는 지연 상태 및 경로 지도 표시 제공'}
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
                {t('flight.searching')}
              </>
            ) : (
              <>
                <Search className="w-4 h-4 inline mr-2" />
                {t('flight.search')}
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

                {/* 日期提示 */}
                {useSerpAPI && flightDate && (() => {
                  const selectedDate = new Date(flightDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  selectedDate.setHours(0, 0, 0, 0);
                  const isFutureDate = selectedDate.getTime() > today.getTime();
                  const isPastDate = selectedDate.getTime() < today.getTime();
                  
                  if (isFutureDate || isPastDate) {
                    return (
                      <div className="mb-3 p-2 bg-yellow-100 border-2 border-yellow-500 rounded flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs text-yellow-800">
                          {isFutureDate 
                            ? t('flight.dateWarning').replace('{date}', flightDate)
                            : t('flight.dateWarningPast').replace('{date}', flightDate)}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* 延誤警告 */}
                {flightInfo.isDelayed && flightInfo.delayMinutes && (
                  <div className="mb-3 p-2 bg-red-100 border-2 border-red-500 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-bold text-red-800">
                      {language === 'zh-TW' ? `航班延誤 ${flightInfo.delayMinutes} 分鐘` : language === 'en' ? `Flight delayed ${flightInfo.delayMinutes} minutes` : language === 'ja' ? `フライト遅延 ${flightInfo.delayMinutes} 分` : `항공편 지연 ${flightInfo.delayMinutes}분`}
                    </span>
                  </div>
                )}

                {/* 出發信息 */}
                <div className="mb-4 pb-4 border-b-2 border-black">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-bold">{t('flight.departure')}</span>
                  </div>
                  <div className="pl-6 space-y-1 text-xs">
                    <div className="font-bold">{flightInfo.departure.airport}</div>
                    <div className="opacity-70">{flightInfo.departure.city}</div>
                    {flightInfo.scheduledTime?.departure && (
                      <div className="opacity-70">
                        {t('flight.scheduledTime')}：{flightInfo.scheduledTime.departure}
                      </div>
                    )}
                    {flightInfo.actualTime?.departure && (
                      <div className={flightInfo.isDelayed ? 'text-red-600 font-bold' : 'opacity-70'}>
                        {t('flight.actualTime')}：{flightInfo.actualTime.departure}
                      </div>
                    )}
                    {flightInfo.departure.terminal && (
                      <div>{t('flight.terminal')}：{flightInfo.departure.terminal}</div>
                    )}
                    {flightInfo.departure.checkInCounter && (
                      <div className="flex items-center gap-1">
                        <DoorOpen className="w-3 h-3" />
                        {t('flight.checkIn')}：{flightInfo.departure.checkInCounter}
                      </div>
                    )}
                    {!flightInfo.departure.checkInCounter && (
                      <div className="text-[10px] opacity-50 italic">
                        {language === 'zh-TW' ? '提示：報到櫃檯信息請以機場公告為準' : language === 'en' ? 'Note: Check-in counter information is subject to airport announcements' : language === 'ja' ? '注意：チェックインカウンター情報は空港の案内に従ってください' : '참고: 체크인 카운터 정보는 공항 공지사항을 따릅니다'}
                      </div>
                    )}
                    {flightInfo.departure.gate && (
                      <div className="flex items-center gap-1">
                        <DoorOpen className="w-3 h-3" />
                        {t('flight.gate')}：{flightInfo.departure.gate}
                      </div>
                    )}
                  </div>
                </div>

                {/* 抵達信息 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-bold">{t('flight.arrival')}</span>
                  </div>
                  <div className="pl-6 space-y-1 text-xs">
                    <div className="font-bold">{flightInfo.arrival.airport}</div>
                    <div className="opacity-70">{flightInfo.arrival.city}</div>
                    {flightInfo.scheduledTime?.arrival && (
                      <div className="opacity-70">
                        {t('flight.scheduledTime')}：{flightInfo.scheduledTime.arrival}
                      </div>
                    )}
                    {flightInfo.actualTime?.arrival && (
                      <div className={flightInfo.isDelayed ? 'text-red-600 font-bold' : 'opacity-70'}>
                        {t('flight.actualTime')}：{flightInfo.actualTime.arrival}
                      </div>
                    )}
                    {flightInfo.arrival.terminal && (
                      <div>{t('flight.terminal')}：{flightInfo.arrival.terminal}</div>
                    )}
                    {flightInfo.arrival.gate && (
                      <div className="flex items-center gap-1">
                        <DoorOpen className="w-3 h-3" />
                        {t('flight.gate')}：{flightInfo.arrival.gate}
                      </div>
                    )}
                    {flightInfo.arrival.baggageClaim && (
                      <div className="flex items-center gap-1">
                        <Luggage className="w-3 h-3" />
                        {t('flight.baggageClaim')}：{flightInfo.arrival.baggageClaim}
                      </div>
                    )}
                  </div>
                </div>

                {/* 行李資訊 */}
                {(flightInfo.baggageInfo || flightInfo.arrival.baggageClaim) && (
                  <div className="mt-4 pt-4 border-t-2 border-black">
                    <div className="flex items-center gap-2 mb-2">
                      <Luggage className="w-4 h-4" />
                      <span className="text-xs font-bold">{t('flight.baggageInfo')}</span>
                    </div>
                    <div className="pl-6 space-y-1 text-xs">
                      {flightInfo.arrival.baggageClaim && (
                        <div className="flex items-center gap-1">
                          <span>{t('flight.baggageClaim')}：</span>
                          <span className="font-bold">{flightInfo.arrival.baggageClaim}</span>
                        </div>
                      )}
                      {flightInfo.baggageInfo?.baggageAllowance && (
                        <div>
                          <span>{t('flight.baggageAllowance')}：</span>
                          <span className="font-bold">{flightInfo.baggageInfo.baggageAllowance}</span>
                        </div>
                      )}
                      {flightInfo.baggageInfo?.carryOn && (
                        <div>
                          <span>{t('flight.carryOn')}：</span>
                          <span className="font-bold">{flightInfo.baggageInfo.carryOn}</span>
                        </div>
                      )}
                      {flightInfo.baggageInfo?.checkedBaggage && (
                        <div>
                          <span>{t('flight.checkedBaggage')}：</span>
                          <span className="font-bold">{flightInfo.baggageInfo.checkedBaggage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Google Maps 路線圖（僅在使用 SerpAPI 時顯示） */}
              {useSerpAPI && flightInfo.departure.airport && flightInfo.arrival.airport && (
                <div className="pixel-card p-4 border-2 border-black">
                  <h4 className="text-xs font-bold mb-2">{t('flight.routeMap')}</h4>
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
            <p>
              {language === 'zh-TW' ? '提示：航班信息可能因實際情況而變動，請以機場公告為準。' : language === 'en' ? 'Note: Flight information may change due to actual circumstances, please refer to airport announcements.' : language === 'ja' ? '注意：フライト情報は実際の状況により変更される場合があります。空港の案内に従ってください。' : '참고: 항공편 정보는 실제 상황에 따라 변경될 수 있습니다. 공항 공지사항을 참고하세요.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

