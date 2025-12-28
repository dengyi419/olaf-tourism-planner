import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'
import GoogleMapsLoader from '@/components/GoogleMapsLoader'

export const metadata: Metadata = {
  title: 'Olaf tourism planner - AI 智能旅遊規劃',
  description: '結合 AI 智能排程、地圖整合與記帳管理的旅遊規劃工具',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 服務端：使用環境變數（如果有的話）
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  return (
    <html lang="zh-TW">
      <head>
        {/* 如果有環境變數，先載入（用於首次載入） */}
        {googleMapsApiKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,directions`}
            strategy="lazyOnload"
          />
        )}
      </head>
      <body>
        {/* 客戶端：檢查並載入使用者設定的 API key */}
        <GoogleMapsLoader />
        {children}
      </body>
    </html>
  )
}

