'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity } from '@/types';

interface RouteMapProps {
  activities: Activity[];
  dayId: number;
}
export default function RouteMap({ activities, dayId }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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

    // 計算路線
    if (activities.length > 1 && directionsServiceRef.current && directionsRendererRef.current) {
      const waypoints = activities.slice(1, -1).map(activity => ({
        location: activity.googleMapQuery,
        stopover: true,
      }));

      const request: google.maps.DirectionsRequest = {
        origin: activities[0].googleMapQuery,
        destination: activities[activities.length - 1].googleMapQuery,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      };

      directionsServiceRef.current.route(request, (result, status) => {
        if (status === 'OK' && directionsRendererRef.current && result) {
          directionsRendererRef.current.setDirections(result);
          
          // 調整地圖視野以包含所有路線
          const bounds = new google.maps.LatLngBounds();
          result.routes[0]?.legs.forEach(leg => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          mapInstanceRef.current?.fitBounds(bounds);
        }
      });
    } else if (activities.length === 1 && mapInstanceRef.current) {
      // 只有一個地點，使用地理編碼
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: activities[0].googleMapQuery }, (results, status) => {
        if (status === 'OK' && results && results[0] && mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(results[0].geometry.location);
          mapInstanceRef.current.setZoom(15);
          new google.maps.Marker({
            map: mapInstanceRef.current,
            position: results[0].geometry.location,
            title: activities[0].locationName,
          });
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
      <div ref={mapRef} className="w-full h-64" />
    </div>
  );
}

