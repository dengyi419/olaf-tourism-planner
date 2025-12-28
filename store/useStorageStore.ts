import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DayItinerary, TripSettings } from '@/types';

interface SavedTrip {
  id: string;
  name: string;
  settings: TripSettings;
  itinerary: DayItinerary[];
  createdAt: string;
  updatedAt: string;
}

interface StorageState {
  currentTrip: SavedTrip | null;
  savedTrips: SavedTrip[];
  isSyncing: boolean;
  
  // Actions
  saveCurrentTrip: (name?: string, settings?: TripSettings, itinerary?: DayItinerary[], forceNewId?: boolean) => Promise<void>;
  loadTrip: (id: string) => void;
  deleteTrip: (id: string) => Promise<void>;
  updateCurrentTrip: (settings: TripSettings, itinerary: DayItinerary[]) => Promise<void>;
  clearCurrentTrip: () => void;
  syncFromServer: () => Promise<void>;
}

export const useStorageStore = create<StorageState>()(
  persist(
    (set, get) => ({
      currentTrip: null,
      savedTrips: [],
      isSyncing: false,

      saveCurrentTrip: async (name, settings?, itinerary?, forceNewId = false) => {
        const state = get();
        const tripName = name || `行程 ${new Date().toLocaleDateString('zh-TW')}`;
        const now = new Date().toISOString();
        
        const tripSettings = settings || state.currentTrip?.settings || { totalBudget: 0, destination: '', currency: 'TWD' };
        const tripItinerary = itinerary || state.currentTrip?.itinerary || [];
        
        // 生成唯一 ID：使用時間戳 + 隨機字符串，確保唯一性
        const generateUniqueId = () => {
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 9);
          return `trip-${timestamp}-${randomStr}`;
        };
        
        // 決定使用哪個 ID
        let tripId: string;
        if (forceNewId) {
          // 強制生成新 ID（用於保存舊行程時避免覆蓋）
          tripId = generateUniqueId();
        } else if (state.currentTrip?.id) {
          // 檢查當前行程是否已經在 savedTrips 中
          const isAlreadySaved = state.savedTrips.some(t => t.id === state.currentTrip!.id);
          if (isAlreadySaved) {
            // 如果已經保存過，使用原 ID（更新）
            tripId = state.currentTrip.id;
          } else {
            // 如果還沒保存過，但 currentTrip 有 ID，這可能是從其他地方加載的
            // 為了安全起見，生成新 ID（創建新記錄），避免覆蓋資料庫中的舊行程
            tripId = generateUniqueId();
          }
        } else {
          // 沒有當前行程，生成新 ID
          tripId = generateUniqueId();
        }
        
        const newTrip: SavedTrip = {
          id: tripId,
          name: tripName,
          settings: tripSettings,
          itinerary: tripItinerary,
          // 如果是強制創建新 ID，不設置 createdAt，讓後端知道這是新行程
          createdAt: forceNewId ? now : (state.currentTrip?.createdAt || now),
          updatedAt: now,
        };

        // 先更新本地狀態
        set((state) => {
          const existingIndex = state.savedTrips.findIndex(t => t.id === newTrip.id);
          let updatedTrips = [...state.savedTrips];
          
          if (existingIndex >= 0) {
            // 更新現有行程
            updatedTrips[existingIndex] = newTrip;
          } else {
            // 添加新行程
            updatedTrips.push(newTrip);
          }

          return {
            currentTrip: newTrip,
            savedTrips: updatedTrips,
          };
        });

        // 同步到後端
        try {
          // 如果 forceNewId 為 true，或者 currentTrip 沒有 createdAt，表示是新行程，強制創建
          const forceCreate = forceNewId || !state.currentTrip?.createdAt;
          const response = await fetch('/api/trips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...newTrip,
              forceCreate, // 告訴後端強制創建新記錄
            }),
          });
          if (!response.ok) {
            console.error('Failed to sync trip to server');
          }
        } catch (error) {
          console.error('Error syncing trip:', error);
        }
      },

      loadTrip: (id) => {
        const state = get();
        // 先從 savedTrips 中查找
        let trip = state.savedTrips.find(t => t.id === id);
        // 如果找不到，可能是當前行程
        if (!trip && state.currentTrip?.id === id) {
          trip = state.currentTrip;
        }
        if (trip) {
          set({ currentTrip: trip });
        }
      },

      deleteTrip: async (id) => {
        // 先更新本地狀態
        set((state) => ({
          savedTrips: state.savedTrips.filter(t => t.id !== id),
          currentTrip: state.currentTrip?.id === id ? null : state.currentTrip,
        }));

        // 同步到後端
        try {
          const response = await fetch(`/api/trips?id=${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            console.error('Failed to delete trip from server');
          }
        } catch (error) {
          console.error('Error deleting trip:', error);
        }
      },

      updateCurrentTrip: async (settings, itinerary) => {
        const state = get();
        const now = new Date().toISOString();
        
        // 生成唯一 ID：使用時間戳 + 隨機字符串，確保唯一性
        const generateUniqueId = () => {
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 9);
          return `trip-${timestamp}-${randomStr}`;
        };
        
        // 如果沒有 currentTrip 或 currentTrip 沒有 ID，生成新 ID（創建新行程）
        // 如果 currentTrip 有 ID 且已在 savedTrips 中，使用原 ID（更新現有行程）
        let tripId: string;
        if (state.currentTrip?.id) {
          const isAlreadySaved = state.savedTrips.some(t => t.id === state.currentTrip!.id);
          if (isAlreadySaved) {
            // 已保存的行程，使用原 ID（更新）
            tripId = state.currentTrip.id;
          } else {
            // 有 ID 但未保存，生成新 ID（避免覆蓋資料庫中的舊行程）
            tripId = generateUniqueId();
          }
        } else {
          // 沒有 currentTrip 或沒有 ID，生成新 ID（創建新行程）
          tripId = generateUniqueId();
        }
        
        const updatedTrip = {
          id: tripId,
          name: state.currentTrip?.name || `行程 ${new Date().toLocaleDateString('zh-TW')}`,
          settings,
          itinerary,
          createdAt: state.currentTrip?.createdAt || now,
          updatedAt: now,
        };

        // 更新本地狀態（但不自動保存到後端，需要用戶手動點擊「儲存」）
        set({ currentTrip: updatedTrip });
      },

      syncFromServer: async () => {
        set({ isSyncing: true });
        try {
          const response = await fetch('/api/trips');
          if (response.ok) {
            const data = await response.json();
            const serverTrips = data.trips || [];
            const state = get();
            
            // 合併服務器行程和本地行程，避免丟失本地未同步的行程
            const mergedTrips = [...serverTrips];
            state.savedTrips.forEach(localTrip => {
              const exists = mergedTrips.find(t => t.id === localTrip.id);
              if (!exists) {
                // 如果本地有但服務器沒有，保留本地版本
                mergedTrips.push(localTrip);
              }
            });
            
            set({ savedTrips: mergedTrips });
          }
        } catch (error) {
          console.error('Error syncing from server:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      clearCurrentTrip: () => {
        set({ currentTrip: null });
      },
    }),
    {
      name: 'travelgenie-storage',
    }
  )
);

