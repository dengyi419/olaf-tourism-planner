import { NextRequest, NextResponse } from 'next/server';

// 模擬航班數據庫（作為後備數據）
const FLIGHT_DATABASE: Record<string, any> = {
  // 示例數據
  'CI100': {
    flightNumber: 'CI100',
    departure: {
      airport: 'TPE',
      city: '台北',
      terminal: '第一航廈',
      checkInCounter: 'A1-A10',
      gate: 'A1',
    },
    arrival: {
      airport: 'NRT',
      city: '東京成田',
      terminal: '第一航廈',
      gate: '31',
      baggageClaim: '3',
    },
    status: '準時',
    scheduledTime: {
      departure: '08:00',
      arrival: '12:30',
    },
  },
  'BR101': {
    flightNumber: 'BR101',
    departure: {
      airport: 'TPE',
      city: '台北',
      terminal: '第一航廈',
      checkInCounter: 'B1-B10',
      gate: 'B5',
    },
    arrival: {
      airport: 'NRT',
      city: '東京成田',
      terminal: '第一航廈',
      gate: '35',
      baggageClaim: '5',
    },
    status: '準時',
    scheduledTime: {
      departure: '09:00',
      arrival: '13:30',
    },
  },
};

// AirLabs API 查詢函數
async function queryAirLabs(flightNumber: string, apiKey: string, flightDate?: string) {
  try {
    // 清理 API Key（去除前後空格和換行符）
    const cleanedApiKey = apiKey.trim().replace(/\s+/g, '');
    
    if (!cleanedApiKey) {
      throw new Error('API Key 為空');
    }
    
    // AirLabs API 端點
    // API 文檔：https://airlabs.co/docs/
    const baseUrl = 'https://airlabs.co/api/v9/flight';
    const params = new URLSearchParams({
      api_key: cleanedApiKey,
      flight_iata: flightNumber,
    });
    
    // 如果提供了日期，添加到查詢參數中
    if (flightDate) {
      params.append('date', flightDate);
    }
    
    // 記錄請求參數（不記錄完整的 API Key，只記錄長度和前幾個字符）
    console.log('AirLabs API 請求:', {
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
      
      // 記錄詳細錯誤信息以便調試
      console.error('AirLabs API 錯誤:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
      });
      
      // 檢查是否是認證相關錯誤
      if (response.status === 401) {
        // 401 通常是 API Key 無效
        throw new Error('AirLabs API Key 無效。請確認 API Key 是否正確。');
      }
      
      if (response.status === 403) {
        // 403 可能是配額用完、權限不足或 API Key 問題
        if (errorData.error?.message?.includes('quota') || errorData.error?.message?.includes('limit')) {
          throw new Error('AirLabs API 配額已用完或達到請求限制。請檢查您的訂閱計劃。');
        }
        throw new Error('AirLabs API 權限不足。請確認 API Key 是否有效且訂閱計劃允許此操作。');
      }
      
      // 處理 API 返回的錯誤信息
      if (errorData.error?.message) {
        throw new Error(`AirLabs API 錯誤: ${errorData.error.message}`);
      }
      
      // 通用錯誤
      throw new Error(`AirLabs API 錯誤 (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    
    // 檢查 API 返回的錯誤（即使 HTTP 狀態碼是 200）
    if (data.error) {
      console.error('AirLabs API 返回錯誤:', data.error);
      // 檢查錯誤代碼
      if (data.error.code === 401 || data.error.code === 403) {
        throw new Error('AirLabs API Key 無效或權限不足。請確認 API Key 是否正確。');
      }
      throw new Error(data.error.message || 'AirLabs API 錯誤');
    }
    
    // 處理 AirLabs 返回的數據
    if (data.response && data.response.length > 0) {
      const flight = data.response[0]; // 使用第一個結果
      
      // 轉換為我們的格式
      return {
        flightNumber: flight.flight_iata || flight.flight_icao || flightNumber,
        departure: {
          airport: flight.dep_iata || flight.dep_icao || '',
          city: flight.dep_name || '',
          terminal: flight.dep_terminal || undefined,
          checkInCounter: undefined, // AirLabs 通常不提供此信息
          gate: flight.dep_gate || undefined,
        },
        arrival: {
          airport: flight.arr_iata || flight.arr_icao || '',
          city: flight.arr_name || '',
          terminal: flight.arr_terminal || undefined,
          gate: flight.arr_gate || undefined,
          baggageClaim: flight.arr_baggage || undefined,
        },
        status: flight.status || '未知',
        scheduledTime: {
          departure: flight.dep_time ? new Date(flight.dep_time * 1000).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
          arrival: flight.arr_time ? new Date(flight.arr_time * 1000).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
        },
        actualTime: {
          departure: flight.dep_actual ? new Date(flight.dep_actual * 1000).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
          arrival: flight.arr_actual ? new Date(flight.arr_actual * 1000).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
        },
      };
    }
    
    throw new Error('未找到航班信息');
  } catch (error: any) {
    console.error('AirLabs API 錯誤:', {
      message: error.message,
      stack: error.stack,
    });
    // 如果是我們自己拋出的錯誤，直接拋出
    if (error.message && (error.message.includes('AirLabs') || error.message.includes('API'))) {
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

    // 優先使用 AirLabs API（如果提供了 API Key）
    const airLabsApiKey = userApiKey || process.env.AIRLABS_API_KEY;
    
    if (airLabsApiKey) {
      try {
        const flightInfo = await queryAirLabs(cleanedFlightNumber, airLabsApiKey, flightDate);
        return NextResponse.json(flightInfo);
      } catch (error: any) {
        console.error('AirLabs 查詢失敗:', error);
        // 如果 AirLabs 失敗，嘗試使用後備數據庫
        if (FLIGHT_DATABASE[cleanedFlightNumber]) {
          console.log('使用後備數據庫');
          return NextResponse.json(FLIGHT_DATABASE[cleanedFlightNumber]);
        }
        // 如果後備數據庫也沒有，返回錯誤
        return NextResponse.json(
          {
            error: error.message || `找不到航班 ${cleanedFlightNumber} 的信息`,
            suggestion: '請確認航班編號是否正確，或聯繫機場查詢最新信息。',
          },
          { status: 404 }
        );
      }
    }

    // 如果沒有 AirLabs API Key，使用後備數據庫
    if (FLIGHT_DATABASE[cleanedFlightNumber]) {
      return NextResponse.json(FLIGHT_DATABASE[cleanedFlightNumber]);
    }

    // 如果都沒有，返回提示
    return NextResponse.json(
      {
        error: `找不到航班 ${cleanedFlightNumber} 的信息。`,
        suggestion: '請在設定頁面設定 AirLabs API Key 以獲取實時航班信息，或確認航班編號是否正確。',
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
