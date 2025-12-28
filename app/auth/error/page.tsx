'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AlertCircle, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    Configuration: '服務器配置錯誤。請檢查環境變數設置。',
    AccessDenied: '訪問被拒絕。',
    Verification: '驗證失敗。',
    Default: '發生未知錯誤。',
  };

  const errorMessage = errorMessages[error || ''] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center p-4">
      <div className="pixel-card p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl mb-2">登入錯誤</h1>
          <p className="text-xs opacity-70 mb-4">{errorMessage}</p>
          
          {error === 'Configuration' && (
            <div className="text-left text-xs bg-yellow-100 border-2 border-yellow-500 p-3 mb-4">
              <p className="font-bold mb-2">可能的解決方案：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>確認 Vercel 環境變數已正確設置</li>
                <li>檢查 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET</li>
                <li>確認 NEXTAUTH_SECRET 已設置</li>
                <li>確認 NEXTAUTH_URL 設置為 https://www.ihaveatree.shop</li>
                <li>確認 Google OAuth 回調 URI 包含 https://www.ihaveatree.shop/api/auth/callback/google</li>
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => router.push('/auth/signin')}
              className="pixel-button w-full py-3 text-sm"
            >
              重新嘗試登入
            </button>
            <Link
              href="/"
              className="pixel-button w-full py-3 text-sm flex items-center justify-center"
            >
              <Home className="w-4 h-4 inline mr-2" />
              返回首頁
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center p-4">
        <div className="pixel-card p-8 max-w-md w-full text-center">
          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin inline-block mr-2" />
          <p className="text-xs">載入中...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}

