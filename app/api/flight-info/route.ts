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

// AviationStack API 查詢函數
async function queryAviationStack(flightNumber: string, apiKey: string, flightDate?: string) {
  try {
    // AviationStack API 端點
    // API 文檔：https://aviationstack.com/documentation
    const baseUrl = 'https://api.aviationstack.com/v1/flights';
    const params = new URLSearchParams({
      access_key: apiKey,
      flight_iata: flightNumber,
      limit: '1',
    });
    
    // 如果提供了日期，添加到查詢參數中
    if (flightDate) {
      params.append('flight_date', flightDate);
    }
    
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
      console.error('AviationStack API 錯誤:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
      });
      
      // 檢查是否是認證相關錯誤
      if (response.status === 401) {
        // 401 通常是 API Key 無效
        throw new Error('AviationStack API Key 無效。請確認 API Key 是否正確。');
      }
      
      if (response.status === 403) {
        // 403 可能是配額用完、權限不足或 API Key 問題
        if (errorData.error?.info?.includes('quota') || errorData.error?.info?.includes('limit')) {
          throw new Error('AviationStack API 配額已用完或達到請求限制。請檢查您的訂閱計劃。');
        }
        throw new Error('AviationStack API 權限不足。請確認 API Key 是否有效且訂閱計劃允許此操作。');
      }
      
      // 處理 API 返回的錯誤信息
      if (errorData.error?.info) {
        throw new Error(`AviationStack API 錯誤: ${errorData.error.info}`);
      }
      
      if (errorData.error?.message) {
        throw new Error(`AviationStack API 錯誤: ${errorData.error.message}`);
      }
      
      // 通用錯誤
      throw new Error(`AviationStack API 錯誤 (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    
    // 處理 AviationStack 返回的數據
    if (data.data && data.data.length > 0) {
      const flight = data.data[0]; // 使用第一個結果
      
      // 轉換為我們的格式
      return {
        flightNumber: flight.flight?.iata || flight.flight?.number || flightNumber,
        departure: {
          airport: flight.departure?.iata || flight.departure?.icao || '',
          city: flight.departure?.airport || flight.departure?.city || '',
          terminal: flight.departure?.terminal || undefined,
          checkInCounter: undefined, // AviationStack 通常不提供此信息
          gate: flight.departure?.gate || undefined,
        },
        arrival: {
          airport: flight.arrival?.iata || flight.arrival?.icao || '',
          city: flight.arrival?.airport || flight.arrival?.city || '',
          terminal: flight.arrival?.terminal || undefined,
          gate: flight.arrival?.gate || undefined,
          baggageClaim: flight.arrival?.baggage || undefined,
        },
        status: flight.flight_status || '未知',
        scheduledTime: {
          departure: flight.departure?.scheduled ? new Date(flight.departure.scheduled).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
          arrival: flight.arrival?.scheduled ? new Date(flight.arrival.scheduled).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
        },
        actualTime: {
          departure: flight.departure?.actual ? new Date(flight.departure.actual).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
          arrival: flight.arrival?.actual ? new Date(flight.arrival.actual).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
        },
      };
    }
    
    throw new Error('未找到航班信息');
  } catch (error: any) {
    console.error('AviationStack API 錯誤:', error);
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

    // 優先使用 AviationStack API（如果提供了 API Key）
    const aviationStackApiKey = userApiKey || process.env.AVIATIONSTACK_API_KEY;
    
    if (aviationStackApiKey) {
      try {
        const flightInfo = await queryAviationStack(cleanedFlightNumber, aviationStackApiKey, flightDate);
        return NextResponse.json(flightInfo);
      } catch (error: any) {
        console.error('AviationStack 查詢失敗:', error);
        // 如果 AviationStack 失敗，嘗試使用後備數據庫
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

    // 如果沒有 AviationStack API Key，使用後備數據庫
    if (FLIGHT_DATABASE[cleanedFlightNumber]) {
      return NextResponse.json(FLIGHT_DATABASE[cleanedFlightNumber]);
    }

    // 如果都沒有，返回提示
    return NextResponse.json(
      {
        error: `找不到航班 ${cleanedFlightNumber} 的信息。`,
        suggestion: '請在設定頁面設定 AviationStack API Key 以獲取實時航班信息，或確認航班編號是否正確。',
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
