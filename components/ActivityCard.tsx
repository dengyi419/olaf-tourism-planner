'use client';

import { useState } from 'react';
import { Activity } from '@/types';
import { MapPin, Trash2, Edit2, Check, X } from 'lucide-react';
import { useTravelStore } from '@/store/useTravelStore';
import LocationAutocomplete from './LocationAutocomplete';

interface ActivityCardProps {
  activity: Activity;
  dayId: number;
  readOnly?: boolean;
}

const categoryLabels = {
  food: '🍽️ 美食',
  transport: '🚗 交通',
  sightseeing: '🏛️ 景點',
  shopping: '🛍️ 購物',
};

const categoryColors = {
  food: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  transport: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  sightseeing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  shopping: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

export default function ActivityCard({ activity, dayId, readOnly = false }: ActivityCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    time: activity.time,
    locationName: activity.locationName,
    description: activity.description,
    actualCost: activity.actualCost.toString(),
    googleMapQuery: activity.googleMapQuery,
  });

  const { updateActivity, deleteActivity, tripSettings } = useTravelStore();

  const handleSave = () => {
    updateActivity(dayId, activity.id, {
      time: editValues.time,
      locationName: editValues.locationName,
      description: editValues.description,
      actualCost: parseFloat(editValues.actualCost) || 0,
      googleMapQuery: editValues.googleMapQuery,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues({
      time: activity.time,
      locationName: activity.locationName,
      description: activity.description,
      actualCost: activity.actualCost.toString(),
      googleMapQuery: activity.googleMapQuery,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('確定要刪除此行程嗎？')) {
      deleteActivity(dayId, activity.id);
    }
  };

  const handleMapClick = () => {
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.googleMapQuery)}`;
    window.open(mapUrl, '_blank');
  };

  return (
    <div className="pixel-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="time"
                  value={editValues.time}
                  onChange={(e) => setEditValues({ ...editValues, time: e.target.value })}
                  className="pixel-input px-2 py-1.5 text-sm"
                />
                <LocationAutocomplete
                  value={editValues.locationName}
                  onChange={(locationName, googleMapQuery) => {
                    setEditValues({
                      ...editValues,
                      locationName,
                      googleMapQuery,
                    });
                  }}
                  placeholder="地點名稱"
                />
              </div>
              <textarea
                value={editValues.description}
                onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                placeholder="描述"
                className="pixel-input w-full px-2 py-1.5 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editValues.googleMapQuery}
                  onChange={(e) => setEditValues({ ...editValues, googleMapQuery: e.target.value })}
                  placeholder="Google Maps 搜尋關鍵字（自動填入）"
                  className="pixel-input flex-1 px-2 py-1.5 text-sm"
                  readOnly
                />
                <input
                  type="number"
                  value={editValues.actualCost}
                  onChange={(e) => setEditValues({ ...editValues, actualCost: e.target.value })}
                  placeholder="實際花費"
                  className="pixel-input w-32 px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="pixel-button px-4 py-2 text-sm bg-green-500"
                  title="儲存"
                >
                  <Check className="w-4 h-4 mr-2" />
                  <span>儲存</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="pixel-button px-4 py-2 text-sm bg-gray-500"
                  title="取消"
                >
                  <X className="w-4 h-4 mr-2" />
                  <span>取消</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-bold">{activity.time}</span>
                <span className="text-base font-bold">{activity.locationName}</span>
                <span className="px-2 py-0.5 text-xs border-2 border-black bg-white">
                  {categoryLabels[activity.category]}
                </span>
              </div>
              <p className="text-sm mb-2">{activity.description}</p>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {tripSettings?.currency || 'TWD'} {activity.actualCost.toLocaleString()}
                  </span>
                  {activity.estimatedCost > 0 && (
                    <span className="text-xs opacity-70">
                      (預估: {tripSettings?.currency || 'TWD'} {activity.estimatedCost.toLocaleString()})
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleMapClick}
                    className="pixel-button px-4 py-2 text-sm bg-blue-500"
                    title="導航"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>導航</span>
                  </button>
                  {!readOnly && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="pixel-button px-4 py-2 text-sm bg-gray-500"
                        title="編輯"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        <span>編輯</span>
                      </button>
                      <button
                        onClick={handleDelete}
                        className="pixel-button px-4 py-2 text-sm bg-red-500"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        <span>刪除</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

