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
  user_email?: string; // 可選字段，用於驗證數據歸屬
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
  clearAllData: () => void;
}

// 獲取用戶特定的 localStorage key
// 注意：這個函數在模組載入時執行，此時可能還沒有用戶 email
// 我們使用默認 key，然後在用戶登入時通過 onRehydrateStorage 過濾數據
const getStorageKey = (): string => {
  // 使用默認 key，數據隔離通過過濾實現
  return 'travelgenie-storage';
};

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
        
        // 獲取當前用戶 email（如果可用）
        let userEmail: string | undefined;
        if (typeof window !== 'undefined') {
          try {
            const sessionResponse = await fetch('/api/auth/session');
            const session = await sessionResponse.json();
            userEmail = session?.user?.email;
          } catch (error) {
            console.warn('無法獲取用戶 email:', error);
          }
        }
        
        const newTrip: SavedTrip = {
          id: tripId,
          name: tripName,
          settings: tripSettings,
          itinerary: tripItinerary,
          // 如果是強制創建新 ID，不設置 createdAt，讓後端知道這是新行程
          createdAt: forceNewId ? now : (state.currentTrip?.createdAt || now),
          updatedAt: now,
          user_email: userEmail, // 包含 user_email 以便驗證
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
            // 如果刪除失敗，恢復本地狀態
            const state = get();
            // 重新同步以獲取正確的數據
            await get().syncFromServer();
            return;
          }
          
          // 刪除成功後，重新同步以確保所有設備一致
          console.log('行程刪除成功，重新同步數據');
          await get().syncFromServer();
        } catch (error) {
          console.error('Error deleting trip:', error);
          // 發生錯誤時，重新同步以確保數據一致
          await get().syncFromServer();
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
          user_email: state.currentTrip?.user_email, // 保留 user_email
        };

        // 更新本地狀態（但不自動保存到後端，需要用戶手動點擊「儲存」）
        set({ currentTrip: updatedTrip });
      },

      syncFromServer: async () => {
        set({ isSyncing: true });
        try {
          // 獲取當前用戶的 session
          const sessionResponse = await fetch('/api/auth/session');
          const session = await sessionResponse.json();
          
          if (!session?.user?.email) {
            console.warn('無法獲取用戶 session，跳過同步');
            set({ isSyncing: false });
            return;
          }
          
          const userEmail = session.user.email;
          console.log('同步行程，用戶:', userEmail);
          
          // 更新 localStorage 中的用戶 email（用於確定存儲 key）
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('current_user_email', userEmail);
            } catch (error) {
              console.warn('無法保存用戶 email 到 localStorage:', error);
            }
          }
          
          // 立即清除不屬於當前用戶的本地數據
          const state = get();
          const filteredLocalTrips = state.savedTrips.filter((trip: any) => {
            if (trip.user_email && trip.user_email !== userEmail) {
              console.warn('清除不屬於當前用戶的本地行程:', trip.id, trip.user_email, '當前用戶:', userEmail);
              return false;
            }
            return true;
          });
          
          // 如果過濾後的數據不同，立即更新
          if (filteredLocalTrips.length !== state.savedTrips.length) {
            console.log('清除', state.savedTrips.length - filteredLocalTrips.length, '個不屬於當前用戶的行程');
            set({ savedTrips: filteredLocalTrips });
          }
          
          const response = await fetch('/api/trips');
          if (response.ok) {
            const data = await response.json();
            const serverTrips = data.trips || [];
            
            // 前端額外驗證：確保所有行程都屬於當前用戶
            const filteredTrips = serverTrips.filter((trip: any) => {
              // 如果行程有 user_email 字段，驗證它
              if (trip.user_email && trip.user_email !== userEmail) {
                console.error('安全警告：前端發現不屬於當前用戶的行程！', {
                  tripId: trip.id,
                  tripUserEmail: trip.user_email,
                  currentUserEmail: userEmail,
                });
                return false;
              }
              return true;
            });
            
            const state = get();
            
            // 合併服務器行程和本地行程，但只保留屬於當前用戶的本地行程
            const mergedTrips = [...filteredTrips];
            state.savedTrips.forEach(localTrip => {
              // 只保留屬於當前用戶的本地行程
              if (!localTrip.user_email || localTrip.user_email === userEmail) {
                const exists = mergedTrips.find(t => t.id === localTrip.id);
                if (!exists) {
                  // 如果本地有但服務器沒有，且屬於當前用戶，保留本地版本
                  mergedTrips.push(localTrip);
                }
              } else {
                // 如果本地行程屬於其他用戶，移除它
                console.warn('移除不屬於當前用戶的本地行程:', localTrip.id);
              }
            });
            
            // 再次過濾，確保沒有其他用戶的數據
            const finalTrips = mergedTrips.filter((trip: any) => {
              if (trip.user_email && trip.user_email !== userEmail) {
                return false;
              }
              return true;
            });
            
            console.log('同步完成，用戶:', userEmail, '行程數:', finalTrips.length);
            set({ savedTrips: finalTrips });
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
      
      // 清除所有數據（用於登出時）
      clearAllData: () => {
        if (typeof window !== 'undefined') {
          // 清除 localStorage 中的用戶 email
          try {
            localStorage.removeItem('current_user_email');
            // 清除整個存儲
            localStorage.removeItem('travelgenie-storage');
          } catch (error) {
            console.warn('清除 localStorage 失敗:', error);
          }
        }
        // 清除狀態
        set({ 
          currentTrip: null, 
          savedTrips: [],
          isSyncing: false 
        });
      },
    }),
    {
      name: getStorageKey(),
      // 在恢復數據時進行過濾
      partialize: (state) => ({
        currentTrip: state.currentTrip,
        savedTrips: state.savedTrips,
      }),
      // 在恢復數據後立即過濾
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        
        // 嘗試獲取當前用戶 email
        if (typeof window !== 'undefined') {
          const storedUserEmail = localStorage.getItem('current_user_email');
          if (storedUserEmail) {
            // 過濾不屬於當前用戶的數據
            const filteredTrips = state.savedTrips.filter((trip: any) => {
              if (trip.user_email && trip.user_email !== storedUserEmail) {
                console.warn('恢復時清除不屬於當前用戶的行程:', trip.id);
                return false;
              }
              return true;
            });
            
            if (filteredTrips.length !== state.savedTrips.length) {
              state.savedTrips = filteredTrips;
            }
          }
        }
      },
    }
  )
);

