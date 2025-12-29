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
    const baseUrl = 'https://serpapi.com/search.json';
    const params = new URLSearchParams({
      engine: 'google_flights',
      q: flightNumber,
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
    console.log('SerpAPI Google Flights API 響應:', responseStr.length > 1000 ? responseStr.substring(0, 1000) + '...' : responseStr);
    
    // 檢查 API 返回的錯誤
    if (data.error) {
      console.error('SerpAPI Google Flights API 返回錯誤:', data.error);
      throw new Error(data.error || 'SerpAPI Google Flights API 錯誤');
    }
    
    // 處理 SerpAPI 返回的數據
    // SerpAPI Google Flights 返回的結構可能包含 best_flights, other_flights 等
    const flights = data.best_flights || data.other_flights || [];
    
    if (flights.length > 0) {
      const flight = flights[0]; // 使用第一個結果
      const flightInfo = flight.flights?.[0] || flight;
      
      // 提取延誤信息
      const isDelayed = flightInfo.delay || flightInfo.delayed || false;
      const delayMinutes = flightInfo.delay_minutes || 0;
      
      // 提取機場信息
      const departure = flightInfo.departure_airport || {};
      const arrival = flightInfo.arrival_airport || {};
      
      return {
        flightNumber: flightNumber,
        departure: {
          airport: departure.id || departure.name || '',
          city: departure.city || departure.location || '',
          terminal: departure.terminal || undefined,
          gate: departure.gate || undefined,
          checkInCounter: undefined,
        },
        arrival: {
          airport: arrival.id || arrival.name || '',
          city: arrival.city || arrival.location || '',
          terminal: arrival.terminal || undefined,
          gate: arrival.gate || undefined,
          baggageClaim: undefined,
        },
        status: isDelayed ? `延誤 ${delayMinutes} 分鐘` : '準時',
        isDelayed: isDelayed,
        delayMinutes: delayMinutes,
        scheduledTime: {
          departure: flightInfo.departure_time || undefined,
          arrival: flightInfo.arrival_time || undefined,
        },
        actualTime: {
          departure: flightInfo.actual_departure_time || undefined,
          arrival: flightInfo.actual_arrival_time || undefined,
        },
        // 機場座標（用於地圖顯示）
        departureCoordinates: departure.coordinates || undefined,
        arrivalCoordinates: arrival.coordinates || undefined,
      };
    }
    
    throw new Error('未找到航班信息');
  } catch (error: any) {
    console.error('SerpAPI Google Flights API 錯誤:', {
      message: error.message,
      stack: error.stack,
    });
    throw error;
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

