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
    // 注意：AirLabs API 目前不支持日期參數，會返回 "Date is not supported (for now)" 錯誤
    // 因此我們不發送日期參數，只查詢當前/實時的航班信息
    const baseUrl = 'https://airlabs.co/api/v9/flight';
    const params = new URLSearchParams({
      api_key: cleanedApiKey,
      flight_iata: flightNumber,
    });
    
    // AirLabs API 目前不支持日期參數，所以不添加日期
    // 如果未來支持，可以取消下面的註釋
    // if (flightDate) {
    //   params.append('date', flightDate);
    // }
    
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
    
    // 記錄完整的 API 響應以便調試
    console.log('AirLabs API 響應:', JSON.stringify(data, null, 2));
    
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
    // AirLabs API 返回的 response 是一個對象，不是數組
    // 結構：{ request: {...}, response: { flight_iata: "...", ... }, terms: "..." }
    const flight = data.response;
    
    console.log('解析後的航班數據:', {
      hasResponse: !!data.response,
      responseType: typeof data.response,
      responseIsArray: Array.isArray(data.response),
      hasFlightIata: !!flight?.flight_iata,
      flightIata: flight?.flight_iata,
    });
    
    if (flight && flight.flight_iata) {
      console.log('找到航班:', {
        flight_iata: flight.flight_iata,
        flight_icao: flight.flight_icao,
        dep_iata: flight.dep_iata,
        arr_iata: flight.arr_iata,
        status: flight.status,
      });
      
      // 轉換為我們的格式
      // 注意：AirLabs 返回的時間格式是字符串 "2025-12-28 13:30" 或 Unix 時間戳（秒）
      const parseTime = (timeValue: any) => {
        if (!timeValue) return undefined;
        // 如果是字符串格式 "YYYY-MM-DD HH:mm"
        if (typeof timeValue === 'string' && timeValue.includes(' ')) {
          const [datePart, timePart] = timeValue.split(' ');
          const [year, month, day] = datePart.split('-');
          const [hour, minute] = timePart.split(':');
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        }
        // 如果是 Unix 時間戳（秒）
        if (typeof timeValue === 'number') {
          return new Date(timeValue * 1000);
        }
        return undefined;
      };
      
      const depTime = parseTime(flight.dep_time || flight.dep_time_ts);
      const arrTime = parseTime(flight.arr_time || flight.arr_time_ts);
      const depActual = parseTime(flight.dep_actual || flight.dep_actual_ts);
      const arrActual = parseTime(flight.arr_actual || flight.arr_actual_ts);
      
      return {
        flightNumber: flight.flight_iata || flight.flight_icao || flightNumber,
        departure: {
          airport: flight.dep_iata || flight.dep_icao || '',
          city: flight.dep_city || flight.dep_name || '',
          terminal: flight.dep_terminal || undefined,
          checkInCounter: undefined, // AirLabs 通常不提供此信息
          gate: flight.dep_gate || undefined,
        },
        arrival: {
          airport: flight.arr_iata || flight.arr_icao || '',
          city: flight.arr_city || flight.arr_name || '',
          terminal: flight.arr_terminal || undefined,
          gate: flight.arr_gate || undefined,
          baggageClaim: flight.arr_baggage || undefined,
        },
        status: flight.status || '未知',
        scheduledTime: {
          departure: depTime ? depTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
          arrival: arrTime ? arrTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
        },
        actualTime: {
          departure: depActual ? depActual.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
          arrival: arrActual ? arrActual.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
        },
      };
    }
    
    // 如果沒有找到航班，記錄詳細信息以便調試
    console.warn('未找到航班信息，API 響應結構:', {
      hasData: !!data,
      hasResponse: !!data.response,
      responseType: typeof data.response,
      responseKeys: data.response ? Object.keys(data.response) : [],
    });
    
    throw new Error('未找到航班信息。請確認航班編號是否正確，或該航班可能不在 AirLabs 數據庫中。');
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
