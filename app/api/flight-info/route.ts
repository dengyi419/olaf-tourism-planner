import { NextRequest, NextResponse } from 'next/server';

// 模擬航班數據庫（實際應用中應該使用真實的航班 API）
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flightNumber } = body;

    if (!flightNumber) {
      return NextResponse.json(
        { error: '請提供航班編號' },
        { status: 400 }
      );
    }

    // 清理航班編號（移除空格，轉為大寫）
    const cleanedFlightNumber = flightNumber.trim().toUpperCase();

    // 嘗試從數據庫獲取
    if (FLIGHT_DATABASE[cleanedFlightNumber]) {
      return NextResponse.json(FLIGHT_DATABASE[cleanedFlightNumber]);
    }

    // 如果數據庫中沒有，嘗試使用 Google Search API 或其他航班 API
    // 這裡我們先返回一個提示，建議使用真實的航班 API
    return NextResponse.json(
      {
        error: `找不到航班 ${cleanedFlightNumber} 的信息。\n\n提示：此功能需要整合真實的航班 API（如 FlightAware、AviationStack 等）來獲取實時航班信息。`,
        suggestion: '請確認航班編號是否正確，或聯繫機場查詢最新信息。',
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

