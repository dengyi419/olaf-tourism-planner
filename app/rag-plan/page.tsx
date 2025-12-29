'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTravelStore } from '@/store/useTravelStore';
import { useStorageStore } from '@/store/useStorageStore';
import Clock from '@/components/Clock';
import { Home, Upload, FileText, Sparkles } from 'lucide-react';

export default function RAGPlanPage() {
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [documentChunks, setDocumentChunks] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // 檢查是否有 API key
  const hasApiKey = typeof window !== 'undefined' 
    ? !!(localStorage.getItem('user_gemini_api_key') || '').trim()
    : false;

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      setError('請選擇檔案');
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

    setIsUploading(true);
    setError('');
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('userApiKey', userApiKey);

      const response = await fetch('/api/upload-travel-doc', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || '檔案上傳失敗');
      }

      const data = await response.json();
      
      // 儲存文檔塊
      setDocumentChunks(data.chunks || []);
      setUploadSuccess(true);
      
      // 顯示預覽
      if (uploadedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(uploadedFile);
      } else {
        setFilePreview(null);
      }

    } catch (err: any) {
      setError(err.message || '檔案上傳失敗');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!tripName.trim()) {
      setError('請輸入行程名稱');
      return;
    }
    if (!destination.trim()) {
      setError('請輸入目的地');
      return;
    }
    if (documentChunks.length === 0) {
      setError('請先上傳旅遊文件');
      return;
    }

    // 檢查是否有 Gemini API key（用於生成行程）
    const userApiKey = typeof window !== 'undefined' 
      ? localStorage.getItem('user_gemini_api_key') || ''
      : '';

    if (!userApiKey || userApiKey.trim() === '') {
      setError('請先前往「API 金鑰設定」頁面設定您的 Gemini API Key。\n\n點擊右上角「主選單」→「API 金鑰設定」');
      return;
    }

    // Hugging Face API key（用於 RAG 檢索，可選）
    const hfApiKey = typeof window !== 'undefined'
      ? localStorage.getItem('user_hf_api_key') || ''
      : '';

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/rag-itinerary', {
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
          documentChunks,
          userApiKey,
          hfApiKey: hfApiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || '生成行程失敗';
        const details = errorData.details || '';
        const isQuotaError = errorData.isQuotaError || false;
        
        if (isQuotaError || response.status === 403 || errorMessage.includes('配額已用完') || errorMessage.includes('RPD')) {
          throw new Error(`${errorMessage}\n\n${details}`);
        }
        
        if (response.status === 429 || errorMessage.includes('速率限制')) {
          throw new Error(`${errorMessage}\n\n${details}`);
        }
        
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

      // 驗證返回的行程天數是否與請求的天數一致
      const returnedDays = data.itinerary?.length || 0;
      if (returnedDays !== days) {
        console.warn(`行程天數不一致：請求 ${days} 天，返回 ${returnedDays} 天`);
        // 如果返回的天數不足，添加空天
        if (returnedDays < days) {
          for (let i = returnedDays; i < days; i++) {
            data.itinerary.push({
              dayId: i + 1,
              activities: [],
            });
          }
        } else if (returnedDays > days) {
          // 如果返回的天數過多，截斷
          data.itinerary = data.itinerary.slice(0, days);
        }
      }

      // 為每一天添加日期
      const today = new Date(startDate);
      const itineraryWithDates = data.itinerary.map((day: any, index: number) => {
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() + index);
        return {
          ...day,
          date: dayDate.toISOString().split('T')[0],
        };
      });

      setItinerary(itineraryWithDates);

      // 儲存行程
      await updateCurrentTrip({
        name: tripName,
        settings,
        itinerary: itineraryWithDates,
      }, true);

      // 跳轉到規劃頁面
      router.push('/plan');
    } catch (err: any) {
      setError(err.message || '生成行程失敗');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setFilePreview(null);
      setUploadSuccess(false);
      setDocumentChunks([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5dc] pt-28">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            <h1 className="text-2xl font-bold">利用 RAG 技術編排行程</h1>
          </div>
          <button
            onClick={() => router.push('/')}
            className="pixel-button px-4 py-2 flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            返回主選單
          </button>
        </div>

        <div className="pixel-card p-6 max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* 行程基本資訊 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">行程名稱 *</label>
                <input
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder="例如：日本關西之旅"
                  className="pixel-input w-full px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">目的地 *</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="例如：大阪、京都"
                  className="pixel-input w-full px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">天數 *</label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 3)}
                  min={1}
                  max={30}
                  className="pixel-input w-full px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">預算 *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                    min={0}
                    className="pixel-input flex-1 px-4 py-2"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="pixel-input px-4 py-2"
                  >
                    <option value="TWD">TWD</option>
                    <option value="USD">USD</option>
                    <option value="JPY">JPY</option>
                    <option value="EUR">EUR</option>
                    <option value="CNY">CNY</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">出發日期</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pixel-input w-full px-4 py-2"
                />
              </div>
            </div>

            {/* 檔案上傳 */}
            <div className="border-t-2 border-black pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5" />
                <h2 className="text-lg font-bold">上傳旅遊文件</h2>
              </div>
              <p className="text-sm opacity-70 mb-4">
                支援格式：PDF、圖片（JPEG/PNG/WEBP）、文字檔（TXT/MD/JSON）
              </p>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.md,.json"
                    onChange={handleFileChange}
                    className="pixel-input w-full px-4 py-2"
                  />
                </div>
                <button
                  onClick={handleFileUpload}
                  disabled={!uploadedFile || isUploading}
                  className="pixel-button px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      上傳中...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      上傳並解析
                    </>
                  )}
                </button>
              </div>
              {uploadSuccess && (
                <div className="mt-4 p-3 bg-green-100 border-2 border-green-500 rounded text-sm">
                  ✅ 檔案上傳成功！已解析 {documentChunks.length} 個文檔片段。
                </div>
              )}
              {filePreview && (
                <div className="mt-4">
                  <img src={filePreview} alt="預覽" className="max-w-full h-auto border-2 border-black rounded" />
                </div>
              )}
            </div>

            {/* 進階選項 */}
            <div className="border-t-2 border-black pt-6">
              <h2 className="text-lg font-bold mb-4">進階選項（選填）</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">旅遊偏好</label>
                  <textarea
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder="例如：喜歡美食、文化景點、購物..."
                    className="pixel-input w-full px-4 py-2 h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">排除地點</label>
                  <textarea
                    value={excludedPlaces}
                    onChange={(e) => setExcludedPlaces(e.target.value)}
                    placeholder="例如：不要推薦購物中心、遊樂園..."
                    className="pixel-input w-full px-4 py-2 h-20"
                  />
                </div>
              </div>
            </div>

            {/* 錯誤訊息 */}
            {error && (
              <div className="pixel-card p-4 bg-red-100 border-red-500 text-red-700 text-sm whitespace-pre-line">
                {error}
              </div>
            )}

            {/* 生成按鈕 */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !tripName.trim() || !destination.trim() || documentChunks.length === 0}
              className="pixel-button w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  正在使用 RAG 技術生成行程...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  生成行程
                </>
              )}
            </button>

            {/* 說明 */}
            <div className="text-xs opacity-70 space-y-2">
              <p><strong>RAG 技術說明：</strong></p>
              <p>• 上傳的旅遊文件會被 AI 解析並提取關鍵資訊</p>
              <p>• 系統會使用 RAG（檢索增強生成）技術，從文件中檢索最相關的內容</p>
              <p>• 生成的行程會優先參考文件中的地點、餐廳、景點等資訊</p>
              <p>• 支援的文件格式：PDF、圖片（含 OCR）、文字檔</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

