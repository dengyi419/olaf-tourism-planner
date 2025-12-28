// Google Maps API 類型定義
declare namespace google {
  namespace maps {
    // 實體地圖與路線相關型別以 any 避免 build 期依賴完整 Google Maps 型別
    const Map: any;
    const MapTypeId: any;
    const DirectionsService: any;
    const DirectionsRenderer: any;
    const TravelMode: any;
    const Geocoder: any;

    class LatLngBounds {
      extend(...args: any[]): void;
    }

    namespace places {
      class AutocompleteService {
        getPlacePredictions(
          request: {
            input: string;
            types?: string[];
            language?: string;
          },
          callback: (
            predictions: Array<{
              description: string;
              place_id: string;
            }> | null,
            status: PlacesServiceStatus
          ) => void
        ): void;
      }

      class PlacesService {
        constructor(container: HTMLElement);
        getDetails(
          request: {
            placeId: string;
            fields?: string[];
          },
          callback: (
            place: {
              name?: string;
              formatted_address?: string;
              geometry?: {
                location: {
                  lat(): number;
                  lng(): number;
                };
              };
            } | null,
            status: PlacesServiceStatus
          ) => void
        ): void;
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        INVALID_REQUEST = 'INVALID_REQUEST',
        NOT_FOUND = 'NOT_FOUND',
      }
    }
  }
}

// 擴展 Window 接口以包含 google 對象
interface Window {
  google?: {
    maps?: {
      Map?: any;
      MapTypeId?: any;
      DirectionsService?: any;
      DirectionsRenderer?: any;
      TravelMode?: any;
      Geocoder?: any;
      LatLngBounds?: any;
      places?: {
        AutocompleteService: new () => google.maps.places.AutocompleteService;
        PlacesService: new (container: HTMLElement) => google.maps.places.PlacesService;
        PlacesServiceStatus: {
          OK: 'OK';
          ZERO_RESULTS: 'ZERO_RESULTS';
          OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT';
          REQUEST_DENIED: 'REQUEST_DENIED';
          INVALID_REQUEST: 'INVALID_REQUEST';
          NOT_FOUND: 'NOT_FOUND';
        };
      };
    };
  };
}

