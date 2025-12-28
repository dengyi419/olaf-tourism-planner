export type Activity = {
  id: string; // UUID
  time: string; // e.g., "09:00"
  locationName: string;
  description: string; // 使用者可編輯的筆記
  googleMapQuery: string; // 用於生成地圖連結
  estimatedCost: number; // AI 預估花費（僅供參考，不從預算扣除）
  actualCost: number; // 使用者實際花費（會從預算扣除）
  category: 'food' | 'transport' | 'sightseeing' | 'shopping';
};

export type DayItinerary = {
  dayId: number; // 第幾天
  date?: string;
  activities: Activity[];
  extraExpenses?: number; // 額外消費（不在行程內的花費）
};

export type TripSettings = {
  totalBudget: number;
  destination: string;
  currency: string;
};

export type AIItineraryResponse = {
  itinerary: DayItinerary[];
};

