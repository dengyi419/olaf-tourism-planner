// Google Maps API 類型定義
declare namespace google {
  namespace maps {
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
      places?: {
        AutocompleteService: new () => google.maps.places.AutocompleteService;
        PlacesService: new (container: HTMLElement) => google.maps.places.PlacesService;
        PlacesServiceStatus: typeof google.maps.places.PlacesServiceStatus;
      };
    };
  };
}

