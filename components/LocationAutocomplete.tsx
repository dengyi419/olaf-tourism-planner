'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

interface LocationAutocompleteProps {
  value: string;
  onChange: (locationName: string, googleMapQuery: string) => void;
  placeholder?: string;
  className?: string;
  onGoogleMapQueryChange?: (query: string) => void;
}

interface PlacePrediction {
  description: string;
  place_id: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = '地點名稱',
  className = '',
  onGoogleMapQueryChange,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  // 使用 any 類型避免構建時類型錯誤（Google Maps API 在運行時動態載入）
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);

  // 初始化 Google Places 服務
  useEffect(() => {
    const initServices = () => {
      if (typeof window !== 'undefined' && window.google?.maps?.places) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        
        // 創建一個隱藏的 div 用於 PlacesService
        const serviceDiv = document.createElement('div');
        document.body.appendChild(serviceDiv);
        placesServiceRef.current = new window.google.maps.places.PlacesService(serviceDiv);
      }
    };

    // 如果已經載入，直接初始化
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      initServices();
    } else {
      // 否則等待載入完成
      const checkInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.google?.maps?.places) {
          initServices();
          clearInterval(checkInterval);
        }
      }, 100);

      // 10秒後停止檢查
      setTimeout(() => clearInterval(checkInterval), 10000);
    }
  }, []);

  // 處理輸入變化
  const handleInputChange = async (inputValue: string) => {
    if (!autocompleteServiceRef.current) {
      onChange(inputValue, inputValue);
      if (onGoogleMapQueryChange) {
        onGoogleMapQueryChange(inputValue);
      }
      return;
    }

    if (inputValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      onChange(inputValue, inputValue);
      if (onGoogleMapQueryChange) {
        onGoogleMapQueryChange(inputValue);
      }
      return;
    }

    setIsLoading(true);
    setShowSuggestions(true);

    try {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: inputValue,
          types: ['establishment', 'geocode'],
          language: 'zh-TW',
        },
        (predictions: any, status: string) => {
          setIsLoading(false);
          if (status === 'OK' && predictions) {
            // 只取前5筆
            setSuggestions(predictions.slice(0, 5).map((p: any) => ({
              description: p.description,
              place_id: p.place_id,
            })));
          } else {
            setSuggestions([]);
          }
        }
      );
    } catch (error) {
      console.error('Autocomplete error:', error);
      setIsLoading(false);
      setSuggestions([]);
    }

    onChange(inputValue, inputValue);
    if (onGoogleMapQueryChange) {
      onGoogleMapQueryChange(inputValue);
    }
  };

  // 選擇建議
  const handleSelectSuggestion = (suggestion: PlacePrediction) => {
    if (!placesServiceRef.current) {
      onChange(suggestion.description, suggestion.description);
      if (onGoogleMapQueryChange) {
        onGoogleMapQueryChange(suggestion.description);
      }
      setShowSuggestions(false);
      return;
    }

    // 獲取地點詳細資訊
    placesServiceRef.current.getDetails(
      {
        placeId: suggestion.place_id,
        fields: ['name', 'formatted_address', 'geometry'],
      },
      (place: any, status: string) => {
        if (status === 'OK' && place) {
          const locationName = place.name || suggestion.description;
          const address = place.formatted_address || suggestion.description;
          const query = `${locationName} ${address}`;
          
          onChange(locationName, query);
          if (onGoogleMapQueryChange) {
            onGoogleMapQueryChange(query);
          }
        } else {
          onChange(suggestion.description, suggestion.description);
          if (onGoogleMapQueryChange) {
            onGoogleMapQueryChange(suggestion.description);
          }
        }
        setShowSuggestions(false);
      }
    );
  };

  // 點擊外部關閉建議列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex-1">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={`pixel-input flex-1 px-2 py-1.5 text-sm ${className}`}
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
            載入中...
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border-4 border-black shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id || index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 border-b-2 border-black last:border-b-0 flex items-start gap-2"
            >
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="flex-1">{suggestion.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

