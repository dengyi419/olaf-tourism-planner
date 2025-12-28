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
  saveCurrentTrip: (name?: string, settings?: TripSettings, itinerary?: DayItinerary[]) => Promise<void>;
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

      saveCurrentTrip: async (name, settings?, itinerary?) => {
        const state = get();
        const tripName = name || `行程 ${new Date().toLocaleDateString('zh-TW')}`;
        const now = new Date().toISOString();
        
        const tripSettings = settings || state.currentTrip?.settings || { totalBudget: 0, destination: '', currency: 'TWD' };
        const tripItinerary = itinerary || state.currentTrip?.itinerary || [];
        
        // 生成唯一 ID：使用時間戳 + 隨機字符串 + 用戶標識（如果可用）
        const generateUniqueId = () => {
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 9);
          // 嘗試從 session 獲取用戶 email 的前綴（如果可用）
          const userPrefix = typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.props?.pageProps?.session?.user?.email
            ? (window as any).__NEXT_DATA__.props.pageProps.session.user.email.split('@')[0].substring(0, 4)
            : '';
          return `trip-${timestamp}-${randomStr}${userPrefix ? `-${userPrefix}` : ''}`;
        };
        
        const newTrip: SavedTrip = {
          id: state.currentTrip?.id || generateUniqueId(),
          name: tripName,
          settings: tripSettings,
          itinerary: tripItinerary,
          createdAt: state.currentTrip?.createdAt || now,
          updatedAt: now,
        };

        // 先更新本地狀態
        set((state) => {
          const existingIndex = state.savedTrips.findIndex(t => t.id === newTrip.id);
          let updatedTrips = [...state.savedTrips];
          
          if (existingIndex >= 0) {
            updatedTrips[existingIndex] = newTrip;
          } else {
            updatedTrips.push(newTrip);
          }

          return {
            currentTrip: newTrip,
            savedTrips: updatedTrips,
          };
        });

        // 同步到後端
        try {
          const response = await fetch('/api/trips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTrip),
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
        const trip = state.savedTrips.find(t => t.id === id);
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
        if (state.currentTrip) {
          const updatedTrip = {
            ...state.currentTrip,
            settings,
            itinerary,
            updatedAt: new Date().toISOString(),
          };

          // 更新本地狀態
          set({ currentTrip: updatedTrip });

          // 同步到後端
          try {
            const response = await fetch('/api/trips', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedTrip),
            });
            if (!response.ok) {
              console.error('Failed to sync trip update to server');
            }
          } catch (error) {
            console.error('Error syncing trip update:', error);
          }
        }
      },

      syncFromServer: async () => {
        set({ isSyncing: true });
        try {
          const response = await fetch('/api/trips');
          if (response.ok) {
            const data = await response.json();
            set({ savedTrips: data.trips || [] });
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

