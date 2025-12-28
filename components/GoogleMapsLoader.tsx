'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function GoogleMapsLoader() {
  const [mapsKey, setMapsKey] = useState<string>('');

  useEffect(() => {
    // 檢查是否有使用者設定的 Google Maps API key
    const userMapsKey = localStorage.getItem('user_google_maps_api_key');
    const envMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    
    // 優先使用使用者設定的 key
    const key = userMapsKey || envMapsKey;
    setMapsKey(key);
  }, []);

  // 如果沒有 key 或已經載入，不載入腳本
  if (!mapsKey || (typeof window !== 'undefined' && window.google?.maps)) {
    return null;
  }

  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places,directions`}
      strategy="lazyOnload"
      onLoad={() => {
        // 監聽 localStorage 變化，如果使用者更新了 key，重新載入
        const handleStorageChange = () => {
          const newKey = localStorage.getItem('user_google_maps_api_key');
          if (newKey && newKey !== mapsKey) {
            window.location.reload();
          }
        };
        window.addEventListener('storage', handleStorageChange);
      }}
    />
  );
}

