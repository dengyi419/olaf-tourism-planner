'use client';

import { useTravelStore } from '@/store/useTravelStore';
import { Wallet } from 'lucide-react';

export default function BudgetHeader() {
  const { tripSettings, getTotalSpent, getRemainingBudget, getTodaySpent, itinerary } = useTravelStore();
  
  if (!tripSettings) {
    return null;
  }

  const totalSpent = getTotalSpent();
  const remaining = getRemainingBudget();
  
  // 使用行程的開始日期來判斷「今天」是哪一天
  // 如果行程有開始日期，使用開始日期；否則使用系統的今天
  const tripStartDate = tripSettings.startDate || new Date().toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  // 如果行程還沒開始（開始日期在未來），顯示開始日期那天的花費
  // 如果行程已經開始或今天就是開始日期，顯示今天的花費
  const targetDate = tripStartDate > today ? tripStartDate : today;
  const todayDay = itinerary.find((day) => day.date === targetDate);
  const todaySpent = todayDay ? getTodaySpent(todayDay.dayId) : 0;

  const budgetPercentage = (totalSpent / tripSettings.totalBudget) * 100;

  // 從環境變數或 public 資料夾載入 logo
  // 將 logo.png 放在 public 資料夾即可自動顯示
  const logoPath = process.env.NEXT_PUBLIC_LOGO_PATH || '/logo.png';

  return (
    <div className="sticky top-0 z-30 bg-white border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {/* Logo - 將 logo.png 放在 public 資料夾即可顯示 */}
            <img 
              src={logoPath} 
              alt="Logo" 
              className="w-12 h-12 object-contain border-2 border-black"
              onError={(e) => {
                // 如果圖片載入失敗，隱藏圖片
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <Wallet className="w-6 h-6" />
            <h1 className="text-xl">Olaf tourism planner</h1>
          </div>
          
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <div className="text-xs">今日總花費</div>
              <div className="text-base font-bold">
                {tripSettings.currency} {todaySpent.toLocaleString()}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs">已花費</div>
              <div className="text-base font-bold">
                {tripSettings.currency} {totalSpent.toLocaleString()}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs">剩餘預算</div>
              <div className="text-base font-bold">
                {tripSettings.currency} {remaining.toLocaleString()}
              </div>
            </div>
            
            <div className="w-40">
              <div className="flex justify-between text-xs mb-1">
                <span>預算使用率</span>
                <span>{budgetPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-300 border-2 border-black h-4">
                <div
                  className={`h-full border-r-2 border-black ${
                    budgetPercentage > 100 ? 'bg-red-600' : budgetPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

