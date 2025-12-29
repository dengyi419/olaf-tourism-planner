'use client';

import { useEffect, useRef, useState } from 'react';

interface FlightRouteMapProps {
  departureAirport: string;
  arrivalAirport: string;
  departureCity?: string;
  arrivalCity?: string;
}

export default function FlightRouteMap({ 
  departureAirport, 
  arrivalAirport, 
  departureCity,
  arrivalCity 
}: FlightRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
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

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

    const { google } = window;
    
    try {
      // 初始化地圖
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          zoom: 4,
          center: { lat: 39.8283, lng: -98.5795 }, // 美國中心點作為默認
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });
      }

      // 初始化 Directions Service 和 Renderer
      if (!directionsServiceRef.current) {
        directionsServiceRef.current = new google.maps.DirectionsService();
      }
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new google.maps.DirectionsRenderer();
        directionsRendererRef.current.setMap(mapInstanceRef.current);
      }

      // 構建出發和目的地地址
      const origin = departureCity 
        ? `${departureAirport} Airport, ${departureCity}`
        : `${departureAirport} Airport`;
      const destination = arrivalCity
        ? `${arrivalAirport} Airport, ${arrivalCity}`
        : `${arrivalAirport} Airport`;

      // 請求路線
      const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING, // 使用 DRIVING 模式顯示地面路線
      };

      directionsServiceRef.current.route(request, (result: any, status: any) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result);
          setMapError('');
          
          // 調整地圖視圖以顯示整個路線
          const bounds = new google.maps.LatLngBounds();
          result.routes[0].legs.forEach((leg: any) => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          mapInstanceRef.current.fitBounds(bounds);
        } else {
          console.error('Directions request failed:', status);
          setMapError(`無法顯示路線: ${status}`);
          
          // 如果路線失敗，至少顯示兩個機場的標記
          const geocoder = new google.maps.Geocoder();
          const markers: any[] = [];
          
          [origin, destination].forEach((address, index) => {
            geocoder.geocode({ address }, (results: any, geocodeStatus: any) => {
              if (geocodeStatus === 'OK' && results[0]) {
                const marker = new google.maps.Marker({
                  position: results[0].geometry.location,
                  map: mapInstanceRef.current,
                  title: address,
                  label: index === 0 ? '出發' : '抵達',
                });
                markers.push(marker);
                
                // 調整地圖視圖
                if (markers.length === 2) {
                  const bounds = new google.maps.LatLngBounds();
                  markers.forEach(m => bounds.extend(m.getPosition()));
                  mapInstanceRef.current.fitBounds(bounds);
                }
              }
            });
          });
        }
      });
    } catch (error: any) {
      console.error('地圖初始化錯誤:', error);
      setMapError('地圖載入失敗: ' + error.message);
    }
  }, [isMapLoaded, departureAirport, arrivalAirport, departureCity, arrivalCity]);

  if (!isMapLoaded) {
    return (
      <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-xs">
        載入地圖中...
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={mapRef} className="w-full h-64 border-2 border-black" />
      {mapError && (
        <p className="text-xs text-red-600 mt-2">{mapError}</p>
      )}
    </div>
  );
}

