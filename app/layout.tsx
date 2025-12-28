import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Olaf tourism planner - AI 智能旅遊規劃',
  description: '結合 AI 智能排程、地圖整合與記帳管理的旅遊規劃工具',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  return (
    <html lang="zh-TW">
      <head>
        {googleMapsApiKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,directions`}
            strategy="lazyOnload"
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  )
}

