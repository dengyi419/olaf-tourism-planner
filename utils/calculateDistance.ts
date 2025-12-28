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
  activities: Array<{ googleMapQuery: string }>
): Promise<number> {
  if (activities.length < 2) return 0;

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.google?.maps) {
      resolve(0);
      return;
    }

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

    directionsService.route(request, (result: any, status: string) => {
      if (status === 'OK' && result) {
        const totalDistance = result.routes[0].legs.reduce(
          (total: number, leg: any) => total + leg.distance.value,
          0
        );
        resolve(totalDistance / 1000); // 轉換為公里
      } else {
        resolve(0);
      }
    });
  });
}

