'use client';

import { useState, useEffect } from 'react';

export default function Clock() {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  // 在客戶端載入前，顯示占位符以避免 hydration 錯誤
  if (!mounted || !time) {
    return (
      <div className="pixel-card p-3 bg-white">
        <div className="text-xs text-center" style={{ fontFamily: "'Press Start 2P', monospace", lineHeight: '1.6' }}>
          <div className="mb-1">--:--:--</div>
          <div className="text-[8px]">載入中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pixel-card p-3 bg-white">
      <div className="text-xs text-center" style={{ fontFamily: "'Press Start 2P', monospace", lineHeight: '1.6' }}>
        <div className="mb-1" suppressHydrationWarning>{formatTime(time)}</div>
        <div className="text-[8px]" suppressHydrationWarning>{formatDate(time)}</div>
      </div>
    </div>
  );
}

