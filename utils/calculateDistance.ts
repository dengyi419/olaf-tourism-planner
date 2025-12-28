// 計算兩個地點之間的距離（使用 Haversine 公式）
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // 地球半徑（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 使用 Google Maps API 計算行程總距離
export async function calculateTripDistance(
  activities: Array<{ googleMapQuery: string }>,
  retries: number = 3
): Promise<number> {
  if (activities.length < 2) return 0;

  // 等待 Google Maps API 載入
  const waitForGoogleMaps = (maxWait: number = 5000): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }

      if (window.google?.maps) {
        resolve(true);
        return;
      }

      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > maxWait) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  };

  const isLoaded = await waitForGoogleMaps();
  if (!isLoaded) {
    console.warn('Google Maps API 未載入，無法計算距離');
    return 0;
  }

  return new Promise((resolve) => {
    const { google } = window;
    const directionsService = new google.maps.DirectionsService();
    const waypoints = activities.slice(1, -1).map(activity => ({
      location: activity.googleMapQuery,
      stopover: true,
    }));

    const request: any = {
      origin: activities[0].googleMapQuery,
      destination: activities[activities.length - 1].googleMapQuery,
      waypoints: waypoints.length > 0 ? waypoints : undefined,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    // 設置超時
    const timeout = setTimeout(() => {
      console.warn('距離計算超時');
      resolve(0);
    }, 10000); // 10 秒超時

    directionsService.route(request, (result: any, status: string) => {
      clearTimeout(timeout);
      
      if (status === 'OK' && result && result.routes && result.routes[0]) {
        try {
          const totalDistance = result.routes[0].legs.reduce(
            (total: number, leg: any) => total + (leg.distance?.value || 0),
            0
          );
          resolve(totalDistance / 1000); // 轉換為公里
        } catch (error) {
          console.error('計算距離時發生錯誤:', error);
          resolve(0);
        }
      } else {
        // 如果失敗且有重試次數，嘗試重試
        if (retries > 0 && (status === 'OVER_QUERY_LIMIT' || status === 'UNKNOWN_ERROR')) {
          setTimeout(() => {
            calculateTripDistance(activities, retries - 1).then(resolve);
          }, 1000);
        } else {
          console.warn('距離計算失敗:', status);
          resolve(0);
        }
      }
    });
  });
}

