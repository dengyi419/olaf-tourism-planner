'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity } from '@/types';

interface RouteMapProps {
  activities: Activity[];
  dayId: number;
}
export default function RouteMap({ activities, dayId }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string>('');

  useEffect(() => {
    // 檢查 Google Maps API 是否已載入
    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          setIsMapLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
    setIsMapLoaded(true);
  }, []);

  // 清除所有標記
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      if (marker) marker.setMap(null);
    });
    markersRef.current = [];
  };

  // 使用地理編碼獲取地點座標並顯示標記
  const geocodeAndShowMarkers = (activities: Activity[]) => {
    if (!mapInstanceRef.current) return;
    
    const { google } = window;
    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();
    let completedCount = 0;

    clearMarkers();

    activities.forEach((activity, index) => {
      const query = activity.googleMapQuery || activity.locationName;
      geocoder.geocode({ address: query }, (results: any, status: string) => {
        completedCount++;
        
        if (status === 'OK' && results && results[0] && mapInstanceRef.current) {
          const location = results[0].geometry.location;
          bounds.extend(location);
          
          const marker = new google.maps.Marker({
            map: mapInstanceRef.current,
            position: location,
            title: activity.locationName,
            label: {
              text: `${index + 1}`,
              color: '#000000',
              fontWeight: 'bold',
            },
          });
          
          markersRef.current.push(marker);
        }
        
        // 當所有地點都處理完畢後，調整地圖視野
        if (completedCount === activities.length) {
          if (markersRef.current.length > 0) {
            mapInstanceRef.current.fitBounds(bounds);
            // 如果只有一個標記，設置合適的縮放級別
            if (markersRef.current.length === 1) {
              mapInstanceRef.current.setZoom(15);
            }
          }
        }
      });
    });
  };

  useEffect(() => {
    if (!mapRef.current || activities.length === 0 || !isMapLoaded) return;

    const { google } = window;

    // 初始化地圖
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: 25.0330, lng: 121.5654 }, // 預設台北
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        // 不設定 styles，保持地圖原始背景顏色
      });

      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#000000',
          strokeWeight: 4,
        },
      });
    }

    // 清除之前的標記和路線
    clearMarkers();
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
    setMapError('');

    // 計算路線
    if (activities.length > 1 && directionsServiceRef.current && directionsRendererRef.current) {
      const waypoints = activities.slice(1, -1).map(activity => ({
        location: activity.googleMapQuery || activity.locationName,
        stopover: true,
      }));

      const request: any = {
        origin: activities[0].googleMapQuery || activities[0].locationName,
        destination: activities[activities.length - 1].googleMapQuery || activities[activities.length - 1].locationName,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      };

      directionsServiceRef.current.route(request, (result: any, status: string) => {
        if (status === 'OK' && directionsRendererRef.current && result) {
          // 路線查詢成功，顯示路線
          directionsRendererRef.current.setDirections(result);
          
          // 調整地圖視野以包含所有路線
          const bounds = new google.maps.LatLngBounds();
          result.routes[0]?.legs.forEach((leg: any) => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          mapInstanceRef.current?.fitBounds(bounds);
        } else {
          // 路線查詢失敗，使用地理編碼顯示標記作為回退方案
          console.warn('路線查詢失敗，使用標記模式:', status);
          geocodeAndShowMarkers(activities);
          
          // 顯示錯誤訊息（但不影響使用）
          if (status === 'ZERO_RESULTS') {
            setMapError('無法計算路線，已顯示地點標記');
          } else if (status === 'NOT_FOUND') {
            setMapError('部分地點無法找到，已顯示可用地點');
          }
        }
      });
    } else if (activities.length === 1 && mapInstanceRef.current) {
      // 只有一個地點，使用地理編碼
      const geocoder = new google.maps.Geocoder();
      const query = activities[0].googleMapQuery || activities[0].locationName;
      geocoder.geocode({ address: query }, (results: any, status: string) => {
        if (status === 'OK' && results && results[0] && mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(results[0].geometry.location);
          mapInstanceRef.current.setZoom(15);
          const marker = new google.maps.Marker({
            map: mapInstanceRef.current,
            position: results[0].geometry.location,
            title: activities[0].locationName,
          });
          markersRef.current.push(marker);
        } else {
          setMapError('無法找到該地點');
        }
      });
    }
  }, [activities, dayId, isMapLoaded]);

  if (activities.length === 0) {
    return (
      <div className="pixel-card p-4 h-64 flex items-center justify-center">
        <p className="text-xs">還沒有行程</p>
      </div>
    );
  }

  if (!isMapLoaded) {
    return (
      <div className="pixel-card p-4 h-64 flex items-center justify-center">
        <p className="text-xs">載入地圖中...</p>
      </div>
    );
  }

  return (
    <div className="pixel-card p-2">
      {mapError && (
        <div className="mb-2 p-2 bg-yellow-100 border-2 border-yellow-500 text-xs">
          {mapError}
        </div>
      )}
      <div ref={mapRef} className="w-full h-64" />
    </div>
  );
}

