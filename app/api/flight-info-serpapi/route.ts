import { NextRequest, NextResponse } from 'next/server';

// 先從 AirLabs 獲取機場信息，然後用 SerpAPI 查詢詳細信息
async function getAirportInfoFromAirLabs(flightNumber: string, airLabsApiKey: string): Promise<{departure?: string, arrival?: string} | null> {
  if (!airLabsApiKey) return null;
  
  try {
    // 直接調用 AirLabs API，而不是通過我們的 API 路由
    const cleanedApiKey = airLabsApiKey.trim().replace(/\s+/g, '');
    const baseUrl = 'https://airlabs.co/api/v9/flight';
    const params = new URLSearchParams({
      api_key: cleanedApiKey,
      flight_iata: flightNumber,
    });
    
    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.response && data.response.flight_iata) {
        const flight = data.response;
        return {
          departure: flight.dep_iata || flight.dep_icao,
          arrival: flight.arr_iata || flight.arr_icao,
        };
      }
    }
  } catch (error) {
    console.warn('無法從 AirLabs 獲取機場信息:', error);
  }
  return null;
}

// SerpAPI Google Flights API 查詢函數
async function querySerpAPIFlights(flightNumber: string, apiKey: string, flightDate?: string, departureAirport?: string, arrivalAirport?: string) {
  try {
    // 清理 API Key（去除前後空格和換行符）
    const cleanedApiKey = apiKey.trim().replace(/\s+/g, '');
    
    if (!cleanedApiKey) {
      throw new Error('API Key 為空');
    }
    
    // SerpAPI Google Flights API 端點
    // API 文檔：https://serpapi.com/google-flights-api
    // 注意：SerpAPI Google Flights 需要 departure_id 和 arrival_id（機場代碼）
    const baseUrl = 'https://serpapi.com/search.json';
    const params = new URLSearchParams({
      engine: 'google_flights',
      api_key: cleanedApiKey,
    });
    
    // 如果提供了出發地和目的地機場代碼，使用它們
    if (departureAirport && arrivalAirport) {
      params.append('departure_id', departureAirport);
      params.append('arrival_id', arrivalAirport);
    } else {
      // 如果沒有機場代碼，嘗試使用航班編號查詢（但這可能不會工作）
      // 或者返回錯誤提示用戶需要機場信息
      throw new Error('SerpAPI Google Flights API 需要出發地和目的地機場代碼。請先使用 AirLabs API 獲取機場信息，或手動輸入機場代碼。');
    }
    
    // 如果提供了日期，添加到查詢參數中
    if (flightDate) {
      params.append('outbound_date', flightDate);
    }
    
    console.log('SerpAPI Google Flights API 請求:', {
      baseUrl,
      flightNumber,
      flightDate,
      hasApiKey: !!cleanedApiKey,
      apiKeyLength: cleanedApiKey.length,
      apiKeyPrefix: cleanedApiKey.substring(0, 4) + '...',
    });
    
    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (e) {
        // 如果無法解析 JSON，使用空對象
      }
      
      console.error('SerpAPI Google Flights API 錯誤:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
      });
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('SerpAPI API Key 無效或權限不足。請確認 API Key 是否正確。');
      }
      
      if (errorData.error) {
        throw new Error(`SerpAPI 錯誤: ${errorData.error}`);
      }
      
      throw new Error(`SerpAPI Google Flights API 錯誤 (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    
    // 記錄完整的 API 響應以便調試（限制長度避免日誌過大）
    const responseStr = JSON.stringify(data);
    console.log('SerpAPI Google Flights API 響應:', responseStr.length > 2000 ? responseStr.substring(0, 2000) + '...' : responseStr);
    
    // 檢查 API 返回的錯誤
    if (data.error) {
      console.error('SerpAPI Google Flights API 返回錯誤:', data.error);
      throw new Error(data.error || 'SerpAPI Google Flights API 錯誤');
    }
    
    // 處理 SerpAPI 返回的數據
    // SerpAPI Google Flights 返回的結構可能包含 best_flights, other_flights, flights 等
    // 也可能直接包含航班信息
    let flights: any[] = [];
    
    if (data.best_flights && Array.isArray(data.best_flights)) {
      flights = data.best_flights;
    } else if (data.other_flights && Array.isArray(data.other_flights)) {
      flights = data.other_flights;
    } else if (data.flights && Array.isArray(data.flights)) {
      flights = data.flights;
    } else if (data.flight_info) {
      // 如果返回的是單個航班信息
      flights = [data.flight_info];
    }
    
    console.log('解析後的 SerpAPI 航班數據:', {
      hasBestFlights: !!data.best_flights,
      hasOtherFlights: !!data.other_flights,
      hasFlights: !!data.flights,
      hasFlightInfo: !!data.flight_info,
      flightsLength: flights.length,
      dataKeys: Object.keys(data),
    });
    
    if (flights.length > 0) {
      // 從 flights 數組中找到匹配的航班（根據航班編號）
      // 如果找不到，使用第一個結果
      let flight = flights.find((f: any) => {
        const fn = f.flight_number || f.flight_iata || '';
        return fn.toUpperCase().includes(flightNumber.substring(0, 2)) || 
               fn.toUpperCase().includes(flightNumber);
      }) || flights[0];
      
      console.log('找到航班:', {
        flightNumber: flight.flight_number || flight.flight_iata,
        departure: flight.departure_airport?.id || flight.departure_airport?.name,
        arrival: flight.arrival_airport?.id || flight.arrival_airport?.name,
      });
      
      // 提取機場信息（根據 SerpAPI 文檔格式）
      const departure = flight.departure_airport || {};
      const arrival = flight.arrival_airport || {};
      
      // 提取延誤信息（SerpAPI 可能不直接提供延誤信息，需要從其他字段推斷）
      // 注意：SerpAPI Google Flights 主要提供價格和路線信息，延誤信息可能需要其他 API
      const isDelayed = flight.delay || flight.delayed || flight.is_delayed || false;
      const delayMinutes = flight.delay_minutes || flight.delay_min || 0;
      
      // 提取航班信息
      const airline = flight.airline || '';
      const airlineCode = flight.airline_code || '';
      const flightNum = flight.flight_number || flightNumber;
      
      return {
        flightNumber: `${airlineCode}${flightNum}` || flightNumber,
        departure: {
          airport: departure.id || departure.name || '',
          city: departure.name || departure.city || '',
          terminal: undefined, // SerpAPI 通常不提供
          gate: undefined, // SerpAPI 通常不提供
          checkInCounter: undefined,
        },
        arrival: {
          airport: arrival.id || arrival.name || '',
          city: arrival.name || arrival.city || '',
          terminal: undefined, // SerpAPI 通常不提供
          gate: undefined, // SerpAPI 通常不提供
          baggageClaim: undefined,
        },
        status: isDelayed ? `延誤 ${delayMinutes} 分鐘` : (flight.status || '準時'),
        isDelayed: isDelayed,
        delayMinutes: delayMinutes,
        scheduledTime: {
          departure: undefined, // SerpAPI 主要提供價格信息，不提供詳細時間
          arrival: undefined,
        },
        actualTime: {
          departure: undefined,
          arrival: undefined,
        },
        // 額外信息
        airline: airline,
        duration: flight.duration, // 飛行時長（分鐘）
        price: flight.price, // 價格
        numberOfStops: flight.number_of_stops || 0, // 經停次數
        // 機場座標（用於地圖顯示，如果 API 提供）
        departureCoordinates: departure.coordinates || departure.lat_lng || undefined,
        arrivalCoordinates: arrival.coordinates || arrival.lat_lng || undefined,
      };
    }
    
    // 如果沒有找到航班，記錄詳細信息以便調試
    console.warn('未找到航班信息，API 響應結構:', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      hasBestFlights: !!data.best_flights,
      hasOtherFlights: !!data.other_flights,
      hasFlights: !!data.flights,
    });
    
    throw new Error('未找到航班信息。請確認航班編號是否正確，或該航班可能不在 SerpAPI 數據庫中。');
  } catch (error: any) {
    console.error('SerpAPI Google Flights API 錯誤:', {
      message: error.message,
      stack: error.stack,
    });
    // 如果是我們自己拋出的錯誤，直接拋出
    if (error.message && (error.message.includes('SerpAPI') || error.message.includes('API'))) {
      throw error;
    }
    // 其他錯誤包裝一下
    throw new Error(`查詢航班信息失敗: ${error.message || '未知錯誤'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flightNumber, flightDate, userApiKey } = body;

    if (!flightNumber) {
      return NextResponse.json(
        { error: '請提供航班編號' },
        { status: 400 }
      );
    }

    // 清理航班編號（移除空格，轉為大寫）
    const cleanedFlightNumber = flightNumber.trim().toUpperCase();

    // 使用 SerpAPI Google Flights API（如果提供了 API Key）
    const serpApiKey = userApiKey || process.env.SERPAPI_API_KEY;
    
    if (serpApiKey) {
      try {
        const flightInfo = await querySerpAPIFlights(cleanedFlightNumber, serpApiKey, flightDate);
        return NextResponse.json(flightInfo);
      } catch (error: any) {
        console.error('SerpAPI Google Flights 查詢失敗:', error);
        return NextResponse.json(
          {
            error: error.message || `找不到航班 ${cleanedFlightNumber} 的信息`,
            suggestion: '請確認航班編號是否正確，或聯繫機場查詢最新信息。',
          },
          { status: 404 }
        );
      }
    }

    // 如果沒有 SerpAPI Key，返回提示
    return NextResponse.json(
      {
        error: `找不到航班 ${cleanedFlightNumber} 的信息。`,
        suggestion: '請在設定頁面設定 SerpAPI API Key 以獲取實時航班信息和延誤狀態，或確認航班編號是否正確。',
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('查詢航班信息錯誤:', error);
    return NextResponse.json(
      { error: '查詢航班信息時發生錯誤', details: error.message },
      { status: 500 }
    );
  }
}
