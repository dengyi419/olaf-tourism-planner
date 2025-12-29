'use client';

import { useState, useEffect } from 'react';
import { useTravelStore } from '@/store/useTravelStore';
import { useStorageStore } from '@/store/useStorageStore';
import { Calendar } from 'lucide-react';

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

  // 獲取要顯示的日期（永遠顯示最近的未來行程開始日期；否則顯示當前日期）
  const getDisplayDate = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // 從所有行程中找最近的未來開始日期（包括當前行程）
    const allTrips = currentTrip ? [currentTrip, ...savedTrips] : savedTrips;
    const futureTrips = allTrips
      .filter(trip => trip.settings?.startDate)
      .map(trip => ({
        id: trip.id,
        startDate: trip.settings!.startDate!,
      }))
      .filter(trip => trip.startDate > today) // 嚴格大於今天（不含今天）
      .sort((a, b) => a.startDate.localeCompare(b.startDate)); // 按日期排序，最近的在前
    
    if (futureTrips.length > 0) {
      const nearestStartDate = new Date(futureTrips[0].startDate);
      if (!isNaN(nearestStartDate.getTime())) {
        return nearestStartDate;
      }
    }
    
    // 如果沒有未來行程，返回當前日期
    return time || new Date();
  };

  // 計算距離最近行程的倒數時間（永遠顯示離目前時間最近的未來行程）
  const getCountdown = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // 從所有行程中找最近的未來開始日期（包括當前行程）
    const allTrips = currentTrip ? [currentTrip, ...savedTrips] : savedTrips;
    const futureTrips = allTrips
      .filter(trip => trip.settings?.startDate)
      .map(trip => ({
        id: trip.id,
        name: trip.name,
        startDate: trip.settings!.startDate!,
      }))
      .filter(trip => trip.startDate > today) // 嚴格大於今天（不含今天）
      .sort((a, b) => a.startDate.localeCompare(b.startDate)); // 按日期排序，最近的在前
    
    if (futureTrips.length === 0) {
      return null;
    }
    
    // 選擇最近的未來行程
    const nearestTrip = futureTrips[0];
    const nearestStartDate = nearestTrip.startDate;
    const tripName = nearestTrip.name;
    
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
    
    return { 
      days: diffDays, 
      hours: diffHours, 
      tripName: tripName || '行程',
      startDate: startDate, // 返回完整的日期對象
      startDateStr: nearestStartDate, // 返回日期字符串
    };
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

  const displayDate = getDisplayDate();

  const today = time || new Date();
  const todayDateStr = today.toISOString().split('T')[0];
  const displayDateStr = displayDate.toISOString().split('T')[0];

  return (
    <>
      {/* 時間卡片 */}
      <div className="pixel-card p-3 bg-white">
        <div className="text-xs text-center" style={{ fontFamily: "'Press Start 2P', monospace", lineHeight: '1.6' }}>
          <div className="mb-1" suppressHydrationWarning>
            {time && formatTime(time)}
          </div>
          {/* 今天日期 - 較大字體 */}
          <div className="text-[10px] mb-1" suppressHydrationWarning>
            {formatDate(today)}
          </div>
        </div>
      </div>
      
      {/* 倒數日卡片 */}
      {countdown && (
        <div className="pixel-card p-3 bg-white">
          <div className="text-xs text-center" style={{ fontFamily: "'Press Start 2P', monospace", lineHeight: '1.6' }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-blue-600" />
              <span className="text-[8px] text-blue-600 font-bold">距離行程開始</span>
            </div>
            {countdown.tripName && countdown.tripName !== '行程' && countdown.tripName.length > 0 && !/^\d{4}$/.test(countdown.tripName) && (
              <div className="text-[7px] text-gray-600 mb-1">
                {countdown.tripName}
              </div>
            )}
            <div className="text-[10px] text-blue-600 font-bold mb-1">
              {countdown.days}天 {countdown.hours}小時
            </div>
            {countdown.startDate && (
              <div className="text-[7px] text-gray-600">
                {formatDate(countdown.startDate)}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

