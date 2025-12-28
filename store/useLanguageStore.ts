import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'zh-TW' | 'en' | 'ja' | 'ko';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const translations: Record<Language, Record<string, string>> = {
  'zh-TW': {
    'mainMenu.title': 'OLAF TOURISM PLANNER',
    'mainMenu.subtitle': '旅遊規劃助手',
    'mainMenu.plan': '自行規劃行程',
    'mainMenu.aiPlan': 'AI 推薦行程',
    'mainMenu.history': '查看行程記錄',
    'mainMenu.settings': 'API 金鑰設定',
    'tripList.title': '所有行程',
    'tripList.current': '當前',
    'tripList.noTrips': '尚無行程記錄',
    'tripList.spent': '花費',
    'tripList.distance': '距離',
    'tripList.total': '總計',
    'tripList.totalSpent': '總花費',
    'tripList.totalDistance': '總距離',
    'tripList.days': '天',
  },
  'en': {
    'mainMenu.title': 'OLAF TOURISM PLANNER',
    'mainMenu.subtitle': 'Travel Planning Assistant',
    'mainMenu.plan': 'Self-Plan Itinerary',
    'mainMenu.aiPlan': 'AI Recommended Itinerary',
    'mainMenu.history': 'View Trip History',
    'mainMenu.settings': 'API Key Settings',
    'tripList.title': 'All Trips',
    'tripList.current': 'Current',
    'tripList.noTrips': 'No trip records yet',
    'tripList.spent': 'Spent',
    'tripList.distance': 'Distance',
    'tripList.total': 'Total',
    'tripList.totalSpent': 'Total Spent',
    'tripList.totalDistance': 'Total Distance',
    'tripList.days': 'days',
  },
  'ja': {
    'mainMenu.title': 'OLAF TOURISM PLANNER',
    'mainMenu.subtitle': '旅行計画アシスタント',
    'mainMenu.plan': '自分で計画する',
    'mainMenu.aiPlan': 'AI推奨プラン',
    'mainMenu.history': '旅行履歴を見る',
    'mainMenu.settings': 'APIキー設定',
    'tripList.title': 'すべての旅行',
    'tripList.current': '現在',
    'tripList.noTrips': 'まだ旅行記録がありません',
    'tripList.spent': '費用',
    'tripList.distance': '距離',
    'tripList.total': '合計',
    'tripList.totalSpent': '総費用',
    'tripList.totalDistance': '総距離',
    'tripList.days': '日',
  },
  'ko': {
    'mainMenu.title': 'OLAF TOURISM PLANNER',
    'mainMenu.subtitle': '여행 계획 어시스턴트',
    'mainMenu.plan': '자체 계획 일정',
    'mainMenu.aiPlan': 'AI 추천 일정',
    'mainMenu.history': '여행 기록 보기',
    'mainMenu.settings': 'API 키 설정',
    'tripList.title': '모든 여행',
    'tripList.current': '현재',
    'tripList.noTrips': '아직 여행 기록이 없습니다',
    'tripList.spent': '비용',
    'tripList.distance': '거리',
    'tripList.total': '합계',
    'tripList.totalSpent': '총 비용',
    'tripList.totalDistance': '총 거리',
    'tripList.days': '일',
  },
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'zh-TW',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'travelgenie-language',
    }
  )
);

export function t(key: string): string {
  const state = useLanguageStore.getState();
  return translations[state.language][key] || key;
}

