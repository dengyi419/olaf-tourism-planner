'use client';

import { useState, useEffect } from 'react';
import { useTravelStore } from '@/store/useTravelStore';
import { useStorageStore } from '@/store/useStorageStore';

export default function Clock() {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const { tripSettings, itinerary } = useTravelStore();
  const { savedTrips, currentTrip } = useStorageStore();

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

  // 計算距離最近行程的倒數時間
  const getCountdown = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // 優先使用當前行程的開始日期
    let nearestStartDate: string | null = null;
    
    if (tripSettings?.startDate && itinerary.length > 0) {
      // 使用當前行程的開始日期（必須是今天之後）
      if (tripSettings.startDate > today) {
        nearestStartDate = tripSettings.startDate;
      }
    }
    
    // 如果沒有當前行程或當前行程不是未來，從所有行程中找最近的開始日期
    if (!nearestStartDate) {
      const allTrips = currentTrip ? [currentTrip, ...savedTrips] : savedTrips;
      const futureTrips = allTrips
        .filter(trip => trip.settings?.startDate)
        .map(trip => ({
          id: trip.id,
          startDate: trip.settings!.startDate!,
        }))
        .filter(trip => trip.startDate > today) // 嚴格大於今天（不含今天）
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
      
      if (futureTrips.length > 0) {
        nearestStartDate = futureTrips[0].startDate;
      }
    }
    
    if (!nearestStartDate) {
      return null;
    }
    
    const now = new Date();
    const startDate = new Date(nearestStartDate);
    startDate.setHours(0, 0, 0, 0);
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 如果開始日期是今天或過去，不顯示倒數（雙重檢查）
    if (startDate <= todayDate) {
      return null;
    }
    
    const diffMs = startDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return { days: diffDays, hours: diffHours };
  };

  const countdown = getCountdown();

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
        <div className="mb-1" suppressHydrationWarning>
          {formatTime(time)}
          {countdown && (
            <span className="ml-2 text-[8px] text-blue-600">
              ({countdown.days}天{countdown.hours}小時)
            </span>
          )}
        </div>
        <div className="text-[8px]" suppressHydrationWarning>{formatDate(time)}</div>
      </div>
    </div>
  );
}

