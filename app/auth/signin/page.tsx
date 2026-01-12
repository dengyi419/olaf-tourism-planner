'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense, useEffect } from 'react';
import { LogIn } from 'lucide-react';

// 检测是否在 Capacitor iOS 环境中
function isCapacitorIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  // 检查 user agent
  const ua = window.navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  
  // 检查是否在 Capacitor 环境中（通过检查 Capacitor 对象或特定的 window 属性）
  // standalone 是 iOS Safari 的非标准属性，用于检测 PWA 模式
  const navigator = window.navigator as Navigator & { standalone?: boolean };
  const isCapacitor = !!(window as any).Capacitor || 
                      !!(window as any).webkit?.messageHandlers ||
                      (isIOS && !navigator.standalone && document.referrer === '');
  
  return isIOS && isCapacitor;
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isIOSApp, setIsIOSApp] = useState(false);
  
  useEffect(() => {
    setIsIOSApp(isCapacitorIOS());
  }, []);
  
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  // 如果在 iOS app 中，使用特殊的 callback URL
  const finalCallbackUrl = isIOSApp 
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ihaveatree.shop'}/auth/callback?redirect=${encodeURIComponent(callbackUrl)}`
    : callbackUrl;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: finalCallbackUrl });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center p-4">
      <div className="pixel-card p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-20 h-20 object-contain border-4 border-black mx-auto mb-4"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <h1 className="text-2xl mb-2">Olaf Tourism Planner</h1>
          <p className="text-xs opacity-70">請登入以使用完整功能</p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="pixel-button w-full py-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin inline-block mr-2" />
              登入中...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 inline mr-2" />
              使用 Google 帳號登入
            </>
          )}
        </button>

        <div className="mt-6 text-xs opacity-70 space-y-2">
          <p>• 登入後，您的行程將永久保存在雲端</p>
          <p>• 我們使用 Google OAuth 進行安全認證</p>
          <p>• 您的數據僅供您個人使用</p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center p-4">
        <div className="pixel-card p-8 max-w-md w-full text-center">
          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin inline-block mr-2" />
          <p className="text-xs">載入中...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}

