'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

// 检测是否在 Safari 浏览器中（而不是在 app 的 WebView 中）
function isInSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = window.navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  
  // 如果在 iOS 中，检查是否在 standalone 模式（PWA）或 Capacitor WebView 中
  // 如果不在这些模式中，很可能是在 Safari 中
  if (isIOS) {
    const isStandalone = (window.navigator as any).standalone === true;
    const isCapacitor = !!(window as any).Capacitor || 
                        !!(window as any).webkit?.messageHandlers;
    
    // 如果不在 standalone 或 Capacitor 中，就是在 Safari 中
    return !isStandalone && !isCapacitor;
  }
  
  return false;
}

// 检测是否在 Capacitor iOS app 的 WebView 中
function isInCapacitorWebView(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = window.navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isCapacitor = !!(window as any).Capacitor || 
                      !!(window as any).webkit?.messageHandlers;
  
  return isIOS && isCapacitor;
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const redirect = searchParams.get('redirect') || '/';
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);

  useEffect(() => {
    if (status === 'loading') return; // 还在加载中
    if (hasAttemptedRedirect) return; // 已经尝试过重定向

    if (status === 'authenticated' && session) {
      // 登录成功
      setHasAttemptedRedirect(true);
      
      const inSafari = isInSafari();
      const inWebView = isInCapacitorWebView();
      
      if (inSafari) {
        // 在 Safari 中完成登录，需要跳回 app
        // 使用 URL Scheme 跳回 app，并传递重定向路径
        const redirectPath = redirect.startsWith('/') ? redirect : `/${redirect}`;
        const appUrl = `olafplanner://auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
        
        // 尝试打开 app
        window.location.href = appUrl;
        
        // 如果 app 没有打开（用户可能没有安装 app），3 秒后重定向到网站
        setTimeout(() => {
          // 如果还在当前页面，说明 app 没有打开，重定向到网站
          if (window.location.href.includes('/auth/callback')) {
            window.location.href = `https://www.ihaveatree.shop${redirectPath}`;
          }
        }, 3000);
      } else if (inWebView) {
        // 在 app 的 WebView 中，直接重定向
        setTimeout(() => {
          router.push(redirect);
        }, 100);
      } else {
        // 在普通浏览器中，直接重定向
        router.push(redirect);
      }
    } else if (status === 'unauthenticated') {
      // 未登录，重定向到登录页
      setHasAttemptedRedirect(true);
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(redirect)}`);
    }
  }, [status, session, redirect, router, hasAttemptedRedirect]);

  return (
    <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center p-4">
      <div className="pixel-card p-8 max-w-md w-full text-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin inline-block mb-4" />
        <p className="text-sm">正在處理登入...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center p-4">
        <div className="pixel-card p-8 max-w-md w-full text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin inline-block mb-4" />
          <p className="text-sm">載入中...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}

