'use client';

import { useLanguageStore } from '@/store/useLanguageStore';
import { Languages } from 'lucide-react';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguageStore();

  const languages = [
    { code: 'zh-TW' as const, name: '中文' },
    { code: 'en' as const, name: 'English' },
    { code: 'ja' as const, name: '日本語' },
    { code: 'ko' as const, name: '한국어' },
  ];

  return (
    <div className="relative">
      <button
        className="pixel-button px-3 py-2 text-xs flex items-center gap-2"
        onClick={() => {
          const currentIndex = languages.findIndex(l => l.code === language);
          const nextIndex = (currentIndex + 1) % languages.length;
          setLanguage(languages[nextIndex].code);
        }}
      >
        <Languages className="w-4 h-4" />
        {languages.find(l => l.code === language)?.name || '中文'}
      </button>
    </div>
  );
}

