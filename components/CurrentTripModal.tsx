'use client';

import { useTravelStore } from '@/store/useTravelStore';
import { useStorageStore } from '@/store/useStorageStore';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface CurrentTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CurrentTripModal({ isOpen, onClose }: CurrentTripModalProps) {
  const router = useRouter();
  const { tripSettings, itinerary, getTotalSpent } = useTravelStore();
  const { currentTrip } = useStorageStore();

  if (!isOpen) return null;

  const trip = currentTrip || (tripSettings && itinerary.length > 0 ? {
    id: 'current',
    name: '當前行程',
    settings: tripSettings,
    itinerary,
  } : null);

  if (!trip) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="pixel-card p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">當前行程</h2>
            <button onClick={onClose} className="pixel-button px-3 py-2 text-xs">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs mb-4">目前沒有進行中的行程</p>
          <button
            onClick={() => {
              onClose();
              router.push('/plan');
            }}
            className="pixel-button w-full py-3 text-sm"
          >
            開始規劃行程
          </button>
        </div>
      </div>
    );
  }

  const totalSpent = getTotalSpent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="pixel-card p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">當前行程</h2>
          <button onClick={onClose} className="pixel-button px-3 py-2 text-xs">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold mb-2">{trip.name}</h3>
            <p className="text-xs opacity-70">
              目的地: {trip.settings.destination}
            </p>
            <p className="text-xs opacity-70">
              預算: {trip.settings.currency} {trip.settings.totalBudget.toLocaleString()}
            </p>
            <p className="text-xs opacity-70">
              已花費: {trip.settings.currency} {totalSpent.toLocaleString()}
            </p>
            <p className="text-xs opacity-70">
              天數: {trip.itinerary.length} 天
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                router.push('/plan');
              }}
              className="pixel-button flex-1 py-3 text-sm"
            >
              查看詳情
            </button>
            <button
              onClick={onClose}
              className="pixel-button px-4 py-3 text-sm"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

