'use client';

import { useState, useRef } from 'react';
import { X, Camera, Upload, Loader2 } from 'lucide-react';
import { useLanguageStore } from '@/store/useLanguageStore';

interface CameraTranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CameraTranslateModal({ isOpen, onClose }: CameraTranslateModalProps) {
  const [image, setImage] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { language } = useLanguageStore();
  
  // 最小請求間隔（毫秒）- 防止快速連續請求
  const MIN_REQUEST_INTERVAL = 2000; // 2秒

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('無法訪問相機:', error);
      setError('無法訪問相機，請檢查權限設置');
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setImage(imageData);
        // 停止相機
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    }
  };

  const handleTranslate = async (isRetry = false) => {
    if (!image) return;

    // 檢查請求間隔
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (!isRetry && timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
      setError(`請等待 ${waitTime} 秒後再試`);
      return;
    }

    setIsLoading(true);
    setError('');
    setTranslatedText('');
    setLastRequestTime(now);

    try {
      // 獲取用戶的 API key（與 AI 行程使用同一個）
      const userApiKey = typeof window !== 'undefined' 
        ? localStorage.getItem('user_gemini_api_key') || ''
        : '';

      if (!userApiKey) {
        setError('請先前往「API 金鑰設定」頁面設定您的 Gemini API Key');
        setIsLoading(false);
        return;
      }

      // 將 base64 圖片轉換為 blob
      const base64Data = image.split(',')[1];

      // 調用翻譯 API（帶重試機制）
      const response = await fetch('/api/translate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          targetLanguage: language === 'zh-TW' ? '繁體中文' : language === 'en' ? 'English' : language === 'ja' ? '日本語' : language === 'ko' ? '한국어' : '繁體中文',
          userApiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || '翻譯失敗';
        const isQuotaError = errorData.isQuotaError || false;
        const errorStr = errorMessage.toLowerCase();
        
        // 檢查是否是 "too many requests" 錯誤
        const isTooManyRequests = errorStr.includes('too many requests') || 
                                  errorStr.includes('too_many_requests') ||
                                  errorStr.includes('請求次數過多') ||
                                  errorStr.includes('速率限制') ||
                                  response.status === 429;
        
        // 如果是配額錯誤（403），不重試，直接顯示錯誤
        if (isQuotaError || response.status === 403 || errorMessage.includes('配額已用完') || errorMessage.includes('RPD')) {
          setError(errorMessage);
          setRetryCount(0);
          setIsLoading(false);
          return;
        }
        
        // 如果是速率限制錯誤（429 或 "too many requests"），提供重試選項
        if (isTooManyRequests) {
          if (retryCount < 3) {
            const waitTime = 5 + (retryCount * 2); // 遞增等待時間：5秒、7秒、9秒
            setError(`${errorMessage}\n\n將在 ${waitTime} 秒後自動重試 (${retryCount + 1}/3)...`);
            setRetryCount(retryCount + 1);
            
            // 等待後自動重試
            setTimeout(() => {
              handleTranslate(true);
            }, waitTime * 1000);
            setIsLoading(false);
            return;
          } else {
            setError(`${errorMessage}\n\n已達到最大重試次數，請稍後再試（建議等待 30-60 秒）`);
            setRetryCount(0);
          }
        } else {
          throw new Error(errorMessage);
        }
      } else {
        // 成功時重置重試計數
        setRetryCount(0);
        const data = await response.json();
        setTranslatedText(data.translatedText || '');
      }
    } catch (error: any) {
      console.error('翻譯錯誤:', error);
      const errorMessage = error.message || '翻譯時發生錯誤';
      const errorStr = errorMessage.toLowerCase();
      
      // 檢查是否是 "too many requests" 錯誤
      const isTooManyRequests = errorStr.includes('too many requests') || 
                                errorStr.includes('too_many_requests') ||
                                errorStr.includes('請求次數過多') ||
                                errorStr.includes('速率限制');
      
      // 如果是配額錯誤，不重試
      if (errorMessage.includes('配額已用完') || errorMessage.includes('RPD') || errorMessage.includes('403')) {
        setError(errorMessage);
        setRetryCount(0);
      }
      // 如果是速率限制錯誤（包括 "too many requests"），提供重試選項
      else if (isTooManyRequests || errorMessage.includes('429')) {
        if (retryCount < 3) {
          const waitTime = 5 + (retryCount * 2); // 遞增等待時間：5秒、7秒、9秒
          setError(`${errorMessage}\n\n將在 ${waitTime} 秒後自動重試 (${retryCount + 1}/3)...`);
          setRetryCount(retryCount + 1);
          
          // 等待後自動重試
          setTimeout(() => {
            handleTranslate(true);
          }, waitTime * 1000);
        } else {
          setError(`${errorMessage}\n\n已達到最大重試次數，請稍後再試（建議等待 30-60 秒）`);
          setRetryCount(0);
        }
      } else {
        setError(errorMessage);
        setRetryCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // 停止相機
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setImage(null);
    setTranslatedText('');
    setError('');
    setRetryCount(0);
    setLastRequestTime(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="pixel-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">拍照翻譯</h2>
          <button onClick={handleClose} className="pixel-button px-3 py-2 text-xs">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 上傳或拍照選項 */}
          {!image && !videoRef.current?.srcObject && (
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="pixel-button w-full py-4 text-sm"
              >
                <Upload className="w-4 h-4 inline mr-2" />
                選擇圖片
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={handleCameraCapture}
                className="pixel-button w-full py-4 text-sm"
              >
                <Camera className="w-4 h-4 inline mr-2" />
                使用相機拍照
              </button>
            </div>
          )}

          {/* 相機預覽 */}
          {videoRef.current?.srcObject && !image && (
            <div className="space-y-3">
              <video
                ref={videoRef}
                className="w-full border-4 border-black"
                autoPlay
                playsInline
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCapture}
                  className="pixel-button flex-1 py-3 text-sm"
                >
                  拍照
                </button>
                <button
                  onClick={() => {
                    if (streamRef.current) {
                      streamRef.current.getTracks().forEach(track => track.stop());
                      streamRef.current = null;
                    }
                    if (videoRef.current) {
                      videoRef.current.srcObject = null;
                    }
                  }}
                  className="pixel-button px-4 py-3 text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 圖片預覽 */}
          {image && (
            <div className="space-y-3">
              <img src={image} alt="待翻譯圖片" className="w-full border-4 border-black" />
              <div className="flex gap-2">
                <button
                  onClick={() => handleTranslate(false)}
                  disabled={isLoading}
                  className="pixel-button flex-1 py-3 text-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                      {retryCount > 0 ? `重試中 (${retryCount}/3)...` : '翻譯中...'}
                    </>
                  ) : (
                    '翻譯'
                  )}
                </button>
                <button
                  onClick={() => {
                    setImage(null);
                    setTranslatedText('');
                    setError('');
                    setRetryCount(0);
                    setLastRequestTime(0);
                  }}
                  className="pixel-button px-4 py-3 text-sm"
                >
                  重新選擇
                </button>
              </div>
            </div>
          )}

          {/* 錯誤訊息 */}
          {error && (
            <div className="pixel-card p-3 bg-red-100 border-red-500 text-red-700 text-xs">
              {error}
            </div>
          )}

          {/* 翻譯結果 */}
          {translatedText && (
            <div className="pixel-card p-4 bg-gray-100">
              <h3 className="text-sm font-bold mb-2">翻譯結果：</h3>
              <p className="text-xs whitespace-pre-wrap">{translatedText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

