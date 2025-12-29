'use client';

import { useState } from 'react';
import { X, Search, Plane, MapPin, DoorOpen, Luggage, AlertCircle, Ticket, Download, Loader2 } from 'lucide-react';
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
  aircraft?: {
    code?: string;
    name?: string;
  };
  extensions?: string; // SerpAPI 提供的擴展資訊（行李、Wi-Fi等）
  airline?: string; // 航空公司名稱
  duration?: number; // 飛行時長（分鐘）
}

export default function FlightInfoModal({ isOpen, onClose }: FlightInfoModalProps) {
  const language = useLanguageStore((state) => state.language);
  const [flightNumber, setFlightNumber] = useState('');
  // 計算最小日期（今天）
  const getMinDate = () => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  };
  const [flightDate, setFlightDate] = useState(new Date().toISOString().split('T')[0]); // 預設為今天
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [flightInfo, setFlightInfo] = useState<FlightInfo | null>(null);
  const [isGeneratingBoardingPass, setIsGeneratingBoardingPass] = useState(false);
  const [boardingPassSvg, setBoardingPassSvg] = useState<string | null>(null);
  const [boardingPassError, setBoardingPassError] = useState('');

  const handleSearch = async () => {
    if (!flightNumber.trim()) {
      setError(t('flight.errorNoFlightNumber'));
      return;
    }

    setIsLoading(true);
    setError('');
    setFlightInfo(null);

    try {
      // 統一使用 SerpAPI，優先查詢 SerpAPI，如果沒有結果再回退到 AirLabs
      const serpApiKey = typeof window !== 'undefined' 
        ? localStorage.getItem('user_serpapi_api_key') || ''
        : '';
      
      // 需要 AirLabs API Key 來獲取機場代碼（SerpAPI 需要）
      const airLabsApiKey = typeof window !== 'undefined'
        ? localStorage.getItem('user_airlabs_api_key') || ''
        : undefined;

      const response = await fetch('/api/flight-info-serpapi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          flightNumber: flightNumber.trim().toUpperCase(),
          flightDate: flightDate || undefined, // 傳遞日期參數
          userApiKey: serpApiKey || undefined,
          airLabsApiKey: airLabsApiKey || undefined, // SerpAPI 需要 AirLabs 來獲取機場代碼
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const currentLanguage = useLanguageStore.getState().language;
        const defaultError = currentLanguage === 'zh-TW' ? '查詢航班資訊失敗' : currentLanguage === 'en' ? 'Failed to query flight information' : currentLanguage === 'ja' ? 'フライト情報の照会に失敗しました' : '항공편 정보 조회 실패';
        throw new Error(errorData.error || defaultError);
      }

      const data = await response.json();
      setFlightInfo(data);
    } catch (err: any) {
      const currentLanguage = useLanguageStore.getState().language;
      const defaultError = currentLanguage === 'zh-TW' ? '查詢航班資訊時發生錯誤' : currentLanguage === 'en' ? 'An error occurred while querying flight information' : currentLanguage === 'ja' ? 'フライト情報の照会中にエラーが発生しました' : '항공편 정보 조회 중 오류가 발생했습니다';
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

  const handleGenerateBoardingPass = async () => {
    if (!flightInfo) return;

    setIsGeneratingBoardingPass(true);
    setBoardingPassError('');
    setBoardingPassSvg(null);

    try {
      const userApiKey = typeof window !== 'undefined' 
        ? localStorage.getItem('user_gemini_api_key') || ''
        : '';

      if (!userApiKey) {
        throw new Error('請先在設定頁面設定 Gemini API Key');
      }

      const response = await fetch('/api/generate-boarding-pass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightInfo,
          userApiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || '生成登機證失敗');
      }

      const data = await response.json();
      setBoardingPassSvg(data.svgCode);
    } catch (err: any) {
      setBoardingPassError(err.message || '生成登機證時發生錯誤');
    } finally {
      setIsGeneratingBoardingPass(false);
    }
  };

  const handleDownloadBoardingPass = () => {
    if (!boardingPassSvg) return;

    // 將 SVG 轉換為圖片並下載
    const svgBlob = new Blob([boardingPassSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `boarding-pass-${flightInfo?.flightNumber || 'flight'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
          }
        }, 'image/png');
      }
      
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
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
              placeholder={t('flight.placeholder')}
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
              min={getMinDate()} // 只能選擇今天及以後
            />
            <p className="text-[10px] opacity-70 mt-1">
              {t('flight.dateNoteSerpAPI')}
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
                  <div className="flex items-center gap-2">
                    {flightInfo.status && (
                      <span className={`text-xs px-2 py-1 border border-black ${
                        flightInfo.isDelayed 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {flightInfo.status}
                      </span>
                    )}
                    <button
                      onClick={handleGenerateBoardingPass}
                      disabled={isGeneratingBoardingPass}
                      className="pixel-button px-3 py-1 text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="生成虛擬電子登機證"
                    >
                      {isGeneratingBoardingPass ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>生成中...</span>
                        </>
                      ) : (
                        <>
                          <Ticket className="w-3 h-3" />
                          <span>生成登機證</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>


                {/* 延誤警告 */}
                {flightInfo.isDelayed && flightInfo.delayMinutes && (
                  <div className="mb-3 p-2 bg-red-100 border-2 border-red-500 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-bold text-red-800">
                      {t('flight.delayed').replace('{minutes}', flightInfo.delayMinutes?.toString() || '0')}
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
                    <div className="font-bold text-base">{flightInfo.departure.airport}</div>
                    <div className="opacity-70">{flightInfo.departure.city}</div>
                    {flightInfo.scheduledTime?.departure ? (
                      <div className="font-semibold text-sm text-blue-600">
                        {flightInfo.scheduledTime.departure}
                      </div>
                    ) : (
                      <div className="text-[10px] opacity-50 italic">時間資訊未提供</div>
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
                        {t('flight.checkInNote')}
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
                    <div className="font-bold text-base">{flightInfo.arrival.airport}</div>
                    <div className="opacity-70">{flightInfo.arrival.city}</div>
                    {flightInfo.scheduledTime?.arrival ? (
                      <div className="font-semibold text-sm text-blue-600">
                        {flightInfo.scheduledTime.arrival}
                      </div>
                    ) : (
                      <div className="text-[10px] opacity-50 italic">時間資訊未提供</div>
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

                {/* 飛機型號資訊 */}
                {flightInfo.aircraft && (
                  <div className="mt-4 pt-4 border-t-2 border-black">
                    <div className="flex items-center gap-2 mb-2">
                      <Plane className="w-4 h-4" />
                      <span className="text-xs font-bold">{t('flight.aircraft')}</span>
                    </div>
                    <div className="pl-6 text-xs">
                      <span className="font-bold">{flightInfo.aircraft.name || flightInfo.aircraft.code || ''}</span>
                      {flightInfo.aircraft.code && flightInfo.aircraft.name && (
                        <span className="opacity-70 ml-2">({flightInfo.aircraft.code})</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Extensions 資訊（行李、Wi-Fi等） */}
                {flightInfo.extensions && (
                  <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-300 rounded">
                    <div className="text-xs font-bold mb-1">{t('flight.extensions') || '航班資訊'}</div>
                    <div className="text-xs opacity-80">{flightInfo.extensions}</div>
                  </div>
                )}

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

              {/* Google Maps 路線圖 */}
              {flightInfo.departure.airport && flightInfo.arrival.airport && (
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

              {/* 虛擬電子登機證 */}
              {boardingPassError && (
                <div className="pixel-card p-3 bg-red-100 border-red-500 text-red-700 text-xs">
                  {boardingPassError}
                </div>
              )}

              {boardingPassSvg && (
                <div className="pixel-card p-4 border-2 border-black">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold">虛擬電子登機證</h4>
                    <button
                      onClick={handleDownloadBoardingPass}
                      className="pixel-button px-3 py-1 text-xs flex items-center gap-1"
                      title="下載登機證"
                    >
                      <Download className="w-3 h-3" />
                      <span>下載</span>
                    </button>
                  </div>
                  <div className="w-full overflow-x-auto bg-white rounded border-2 border-black p-2">
                    <div 
                      className="mx-auto"
                      style={{ 
                        width: '800px', 
                        height: '400px',
                        maxWidth: '100%',
                      }}
                      dangerouslySetInnerHTML={{ __html: boardingPassSvg }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-xs opacity-70">
            <p>
              {t('flight.infoDisclaimer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

