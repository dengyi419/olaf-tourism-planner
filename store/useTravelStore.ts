import { create } from 'zustand';
import { Activity, DayItinerary, TripSettings } from '@/types';

interface TravelState {
  tripSettings: TripSettings | null;
  itinerary: DayItinerary[];
  
  // Actions
  setTripSettings: (settings: TripSettings | null) => void;
  setItinerary: (itinerary: DayItinerary[]) => void;
  addDay: (day: DayItinerary) => void;
  updateDay: (dayId: number, updates: Partial<DayItinerary>) => void;
  addActivity: (dayId: number, activity: Activity) => void;
  updateActivity: (dayId: number, activityId: string, updates: Partial<Activity>) => void;
  deleteActivity: (dayId: number, activityId: string) => void;
  deleteDay: (dayId: number) => void;
  
  // Computed values
  getTotalSpent: () => number;
  getRemainingBudget: () => number;
  getTodaySpent: (dayId: number) => number;
  
  // 額外消費管理
  setExtraExpenses: (dayId: number, amount: number) => void;
}

export const useTravelStore = create<TravelState>((set, get) => ({
  tripSettings: null,
  itinerary: [],

  setTripSettings: (settings) => set({ tripSettings: settings }),

  setItinerary: (itinerary) => set({ itinerary }),

  addDay: (day) => set((state) => ({
    itinerary: [...state.itinerary, day]
  })),

  updateDay: (dayId, updates) => set((state) => ({
    itinerary: state.itinerary.map((day) =>
      day.dayId === dayId ? { ...day, ...updates } : day
    )
  })),

  addActivity: (dayId, activity) => set((state) => ({
    itinerary: state.itinerary.map((day) =>
      day.dayId === dayId
        ? { ...day, activities: [...day.activities, activity] }
        : day
    )
  })),

  updateActivity: (dayId, activityId, updates) => set((state) => ({
    itinerary: state.itinerary.map((day) =>
      day.dayId === dayId
        ? {
            ...day,
            activities: day.activities.map((activity) =>
              activity.id === activityId ? { ...activity, ...updates } : activity
            )
          }
        : day
    )
  })),

  deleteActivity: (dayId, activityId) => set((state) => ({
    itinerary: state.itinerary.map((day) =>
      day.dayId === dayId
        ? {
            ...day,
            activities: day.activities.filter((activity) => activity.id !== activityId)
          }
        : day
    )
  })),

  deleteDay: (dayId) => set((state) => ({
    itinerary: state.itinerary.filter((day) => day.dayId !== dayId)
  })),

  getTotalSpent: () => {
    const state = get();
    return state.itinerary.reduce((total, day) => {
      const activitiesCost = day.activities.reduce((dayTotal, activity) => dayTotal + activity.actualCost, 0);
      const extraCost = day.extraExpenses || 0;
      return total + activitiesCost + extraCost;
    }, 0);
  },

  getRemainingBudget: () => {
    const state = get();
    if (!state.tripSettings) return 0;
    return state.tripSettings.totalBudget - state.getTotalSpent();
  },

  getTodaySpent: (dayId) => {
    const state = get();
    const day = state.itinerary.find((d) => d.dayId === dayId);
    if (!day) return 0;
    const activitiesCost = day.activities.reduce((total, activity) => total + activity.actualCost, 0);
    const extraCost = day.extraExpenses || 0;
    return activitiesCost + extraCost;
  },

  setExtraExpenses: (dayId, amount) => {
    set((state) => ({
      ...state,
      itinerary: state.itinerary.map((day) =>
        day.dayId === dayId ? { ...day, extraExpenses: amount } : day
      ),
    }));
  },
}));

