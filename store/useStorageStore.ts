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
  
  // Actions
  saveCurrentTrip: (name?: string, settings?: TripSettings, itinerary?: DayItinerary[]) => void;
  loadTrip: (id: string) => void;
  deleteTrip: (id: string) => void;
  updateCurrentTrip: (settings: TripSettings, itinerary: DayItinerary[]) => void;
  clearCurrentTrip: () => void;
}

export const useStorageStore = create<StorageState>()(
  persist(
    (set, get) => ({
      currentTrip: null,
      savedTrips: [],

      saveCurrentTrip: (name, settings?, itinerary?) => {
        const state = get();
        const tripName = name || `行程 ${new Date().toLocaleDateString('zh-TW')}`;
        const now = new Date().toISOString();
        
        const tripSettings = settings || state.currentTrip?.settings || { totalBudget: 0, destination: '', currency: 'TWD' };
        const tripItinerary = itinerary || state.currentTrip?.itinerary || [];
        
        const newTrip: SavedTrip = {
          id: state.currentTrip?.id || `trip-${Date.now()}`,
          name: tripName,
          settings: tripSettings,
          itinerary: tripItinerary,
          createdAt: state.currentTrip?.createdAt || now,
          updatedAt: now,
        };

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
      },

      loadTrip: (id) => {
        const state = get();
        const trip = state.savedTrips.find(t => t.id === id);
        if (trip) {
          set({ currentTrip: trip });
        }
      },

      deleteTrip: (id) => {
        set((state) => ({
          savedTrips: state.savedTrips.filter(t => t.id !== id),
          currentTrip: state.currentTrip?.id === id ? null : state.currentTrip,
        }));
      },

      updateCurrentTrip: (settings, itinerary) => {
        set((state) => {
          if (state.currentTrip) {
            return {
              currentTrip: {
                ...state.currentTrip,
                settings,
                itinerary,
                updatedAt: new Date().toISOString(),
              },
            };
          }
          return state;
        });
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

