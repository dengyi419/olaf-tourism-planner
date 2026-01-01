'use client';

import { DayItinerary, Activity } from '@/types';
import ActivityCard from './ActivityCard';
import RouteMap from './RouteMap';
import LocationAutocomplete from './LocationAutocomplete';
import { Plus, Trash2 } from 'lucide-react';
import { useTravelStore } from '@/store/useTravelStore';
import { useState, useEffect } from 'react';

interface DaySectionProps {
  day: DayItinerary;
  readOnly?: boolean;
}

export default function DaySection({ day, readOnly = false }: DaySectionProps) {
  const { addActivity, deleteDay, getTodaySpent, tripSettings, updateActivity } = useTravelStore();
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 計算初始時間：如果這天已有活動，使用最後一個活動的時間+1小時，否則使用 09:00
  const getInitialTime = () => {
    if (day.activities.length > 0) {
      const lastActivity = day.activities[day.activities.length - 1];
      const [hours, minutes] = lastActivity.time.split(':').map(Number);
      const nextDate = new Date();
      nextDate.setHours(hours, minutes, 0, 0);
      nextDate.setHours(nextDate.getHours() + 1);
      const nextHours = nextDate.getHours().toString().padStart(2, '0');
      const nextMinutes = nextDate.getMinutes().toString().padStart(2, '0');
      return `${nextHours}:${nextMinutes}`;
    }
    return '09:00';
  };
  
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    time: getInitialTime(),
    locationName: '',
    description: '',
    googleMapQuery: '',
    estimatedCost: 0,
    actualCost: 0,
    category: 'sightseeing',
  });
  
  // 當打開表單時，更新時間為最後一個活動的時間+1小時
  useEffect(() => {
    if (showAddForm) {
      setNewActivity(prev => ({
        ...prev,
        time: getInitialTime(),
      }));
    }
  }, [showAddForm, day.activities.length]);

  const todaySpent = getTodaySpent(day.dayId);

  const handleAddActivity = () => {
    if (!newActivity.locationName) {
      alert('請輸入地點名稱');
      return;
    }

    const activity: Activity = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time: newActivity.time || '09:00',
      locationName: newActivity.locationName,
      description: newActivity.description || '',
      googleMapQuery: newActivity.googleMapQuery || newActivity.locationName,
      estimatedCost: newActivity.estimatedCost || 0,
      actualCost: newActivity.actualCost || 0,
      category: newActivity.category || 'sightseeing',
    };

    addActivity(day.dayId, activity);
    
    // 計算下一個活動的時間：當前時間 + 1小時
    const nextTime = (() => {
      const currentTime = newActivity.time || '09:00';
      const [hours, minutes] = currentTime.split(':').map(Number);
      const nextDate = new Date();
      nextDate.setHours(hours, minutes, 0, 0);
      nextDate.setHours(nextDate.getHours() + 1);
      const nextHours = nextDate.getHours().toString().padStart(2, '0');
      const nextMinutes = nextDate.getMinutes().toString().padStart(2, '0');
      return `${nextHours}:${nextMinutes}`;
    })();
    
    setNewActivity({
      time: nextTime,
      locationName: '',
      description: '',
      googleMapQuery: '',
      estimatedCost: 0,
      actualCost: 0,
      category: 'sightseeing',
    });
    setShowAddForm(false);
  };

  const handleDeleteDay = () => {
    if (confirm(`確定要刪除第 ${day.dayId} 天的所有行程嗎？`)) {
      deleteDay(day.dayId);
    }
  };

  // 檢查是否為今天
  const today = new Date().toISOString().split('T')[0];
  const isToday = day.date === today;

  return (
    <div className="mb-8">
      <div className="pixel-card p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-2xl">第 {day.dayId} 天</h2>
            {day.date && (
              <span className="text-sm">
                {new Date(day.date).toLocaleDateString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            )}
            <span className="text-sm font-bold">
              今日花費: {tripSettings?.currency || 'TWD'} {todaySpent.toLocaleString()}
            </span>
          </div>
          {!readOnly && (
            <button
              onClick={handleDeleteDay}
              className="pixel-button px-4 py-2 text-sm bg-red-500"
              title="刪除這天"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              <span>刪除</span>
            </button>
          )}
        </div>

        {/* 顯示路線地圖 - 每天都有 */}
        {day.activities.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm mb-2">第 {day.dayId} 天路線</h3>
            <RouteMap activities={day.activities} dayId={day.dayId} />
          </div>
        )}
      </div>

      <div className="space-y-3">
        {day.activities.map((activity, index) => (
          <div key={activity.id}>
            {/* 活動卡片 */}
            <ActivityCard activity={activity} dayId={day.dayId} readOnly={readOnly} />
            
            {/* 活動之間的連接線和交通費用輸入（不是最後一個活動時顯示） */}
            {index < day.activities.length - 1 && (
              <div className="flex items-center gap-2 my-2 px-4">
                <div className="flex-1 border-t-2 border-black"></div>
                {readOnly ? (
                  (() => {
                    const nextActivity = day.activities[index + 1];
                    return nextActivity && (nextActivity.transportCostFromPrevious || 0) > 0 ? (
                      <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1">
                        <label className="text-xs whitespace-nowrap">交通費用:</label>
                        <span className="text-xs">
                          {tripSettings?.currency || 'TWD'} {(nextActivity.transportCostFromPrevious || 0).toLocaleString()}
                        </span>
                      </div>
                    ) : null;
                  })()
                ) : (
                  <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1">
                    <label className="text-xs whitespace-nowrap">交通費用:</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={day.activities[index + 1].transportCostFromPrevious || 0}
                      onChange={(e) => {
                        const transportCost = parseFloat(e.target.value) || 0;
                        const nextActivity = day.activities[index + 1];
                        const { updateActivity } = useTravelStore.getState();
                        updateActivity(day.dayId, nextActivity.id, {
                          transportCostFromPrevious: transportCost,
                        });
                      }}
                      className="pixel-input w-24 px-2 py-1 text-xs text-center"
                      placeholder="0"
                    />
                    <span className="text-xs">{tripSettings?.currency || 'TWD'}</span>
                  </div>
                )}
                <div className="flex-1 border-t-2 border-black"></div>
              </div>
            )}
          </div>
        ))}

        {!readOnly && showAddForm ? (
          <div className="pixel-card p-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="time"
                  value={newActivity.time}
                  onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                  className="pixel-input px-2 py-1.5 text-sm"
                />
                <LocationAutocomplete
                  value={newActivity.locationName || ''}
                  onChange={(locationName, googleMapQuery) => {
                    setNewActivity({
                      ...newActivity,
                      locationName,
                      googleMapQuery,
                    });
                  }}
                  placeholder="地點名稱 *"
                />
              </div>
              <textarea
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                placeholder="描述"
                className="pixel-input w-full px-2 py-1.5 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newActivity.googleMapQuery}
                  onChange={(e) => setNewActivity({ ...newActivity, googleMapQuery: e.target.value })}
                  placeholder="Google Maps 搜尋關鍵字（自動填入）"
                  className="pixel-input flex-1 px-2 py-1.5 text-sm"
                  readOnly
                />
                <input
                  type="number"
                  value={newActivity.actualCost}
                  onChange={(e) => setNewActivity({ ...newActivity, actualCost: parseFloat(e.target.value) || 0 })}
                  placeholder="實際花費"
                  className="pixel-input w-32 px-2 py-1.5 text-sm"
                />
                <select
                  value={newActivity.category}
                  onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value as Activity['category'] })}
                  className="pixel-input px-2 py-1.5 text-sm"
                >
                  <option value="food">美食</option>
                  <option value="transport">交通</option>
                  <option value="sightseeing">景點</option>
                  <option value="shopping">購物</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddActivity}
                  className="pixel-button px-4 py-2 text-sm bg-green-500"
                  title="新增行程"
                >
                  <span>新增</span>
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="pixel-button px-4 py-2 text-sm bg-gray-500"
                  title="取消"
                >
                  <span>取消</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          !readOnly && (
            <button
              onClick={() => setShowAddForm(true)}
              className="pixel-button w-full py-3 text-sm"
              title="新增行程"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span>新增行程</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}

