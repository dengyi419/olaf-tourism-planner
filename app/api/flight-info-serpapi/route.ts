import { NextRequest, NextResponse } from 'next/server';

// SerpAPI Google Flights API 查詢函數
async function querySerpAPIFlights(flightNumber: string, apiKey: string, flightDate?: string) {
  try {
    // 清理 API Key（去除前後空格和換行符）
    const cleanedApiKey = apiKey.trim().replace(/\s+/g, '');
    
    if (!cleanedApiKey) {
      throw new Error('API Key 為空');
    }
    
    // SerpAPI Google Flights API 端點
    // API 文檔：https://serpapi.com/google-flights-api
    // 注意：SerpAPI Google Flights 需要出發地和目的地，或使用航班編號查詢
    const baseUrl = 'https://serpapi.com/search.json';
    const params = new URLSearchParams({
      engine: 'google_flights',
      q: flightNumber, // 使用航班編號作為查詢
      api_key: cleanedApiKey,
    });
    
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
      const flight = flights[0]; // 使用第一個結果
      // SerpAPI 可能返回嵌套的 flights 數組
      const flightInfo = Array.isArray(flight.flights) && flight.flights.length > 0 
        ? flight.flights[0] 
        : flight;
      
      console.log('找到航班:', {
        flightNumber: flightInfo.flight_number || flightInfo.flight_iata,
        departure: flightInfo.departure_airport || flightInfo.origin,
        arrival: flightInfo.arrival_airport || flightInfo.destination,
      });
      
      // 提取延誤信息
      const isDelayed = flightInfo.delay || flightInfo.delayed || flightInfo.is_delayed || false;
      const delayMinutes = flightInfo.delay_minutes || flightInfo.delay_min || 0;
      
      // 提取機場信息（嘗試多種可能的字段名）
      const departure = flightInfo.departure_airport || flightInfo.origin || flightInfo.dep || {};
      const arrival = flightInfo.arrival_airport || flightInfo.destination || flightInfo.arr || {};
      
      // 提取時間信息
      const depTime = flightInfo.departure_time || flightInfo.dep_time || flightInfo.scheduled_departure;
      const arrTime = flightInfo.arrival_time || flightInfo.arr_time || flightInfo.scheduled_arrival;
      const depActual = flightInfo.actual_departure_time || flightInfo.actual_dep_time || flightInfo.dep_actual;
      const arrActual = flightInfo.actual_arrival_time || flightInfo.actual_arr_time || flightInfo.arr_actual;
      
      return {
        flightNumber: flightInfo.flight_number || flightInfo.flight_iata || flightNumber,
        departure: {
          airport: departure.id || departure.iata || departure.code || departure.name || '',
          city: departure.city || departure.location || departure.name || '',
          terminal: departure.terminal || flightInfo.dep_terminal || undefined,
          gate: departure.gate || flightInfo.dep_gate || undefined,
          checkInCounter: undefined,
        },
        arrival: {
          airport: arrival.id || arrival.iata || arrival.code || arrival.name || '',
          city: arrival.city || arrival.location || arrival.name || '',
          terminal: arrival.terminal || flightInfo.arr_terminal || undefined,
          gate: arrival.gate || flightInfo.arr_gate || undefined,
          baggageClaim: flightInfo.baggage_claim || undefined,
        },
        status: isDelayed ? `延誤 ${delayMinutes} 分鐘` : (flightInfo.status || '準時'),
        isDelayed: isDelayed,
        delayMinutes: delayMinutes,
        scheduledTime: {
          departure: depTime || undefined,
          arrival: arrTime || undefined,
        },
        actualTime: {
          departure: depActual || undefined,
          arrival: arrActual || undefined,
        },
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
