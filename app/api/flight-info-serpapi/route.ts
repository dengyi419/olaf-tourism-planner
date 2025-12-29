import { NextRequest, NextResponse } from 'next/server';

// 先從 AirLabs 獲取機場資訊，然後用 SerpAPI 查詢詳細資訊
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
    console.warn('無法從 AirLabs 獲取機場資訊:', error);
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
    // type: 1 = 來回程 (round trip), 2 = 單程 (one way)
    const baseUrl = 'https://serpapi.com/search.json';
    const params = new URLSearchParams({
      engine: 'google_flights',
      api_key: cleanedApiKey,
      type: '2', // 2 = 單程 (one way)
    });
    
    // 如果提供了出發地和目的地機場代碼，使用它們
    if (departureAirport && arrivalAirport) {
      params.append('departure_id', departureAirport);
      params.append('arrival_id', arrivalAirport);
    } else {
      // 如果沒有機場代碼，嘗試使用航班編號查詢（但這可能不會工作）
      // 或者返回錯誤提示用戶需要機場信息
      throw new Error('SerpAPI Google Flights API 需要出發地和目的地機場代碼。請先使用 AirLabs API 獲取機場資訊，或手動輸入機場代碼。');
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
    
    // 檢查 API 返回的錯誤或空結果
    if (data.error) {
      console.warn('SerpAPI Google Flights API 返回錯誤:', data.error);
      // 如果是 "no results" 錯誤，返回 null 讓調用者使用 AirLabs 數據
      if (data.error.includes('hasn\'t returned any results') || 
          data.error.includes('no results') ||
          data.search_information?.flights_results_state === 'Fully empty') {
        console.log('SerpAPI 沒有返回結果，將使用 AirLabs 數據');
        return null;
      }
      throw new Error(data.error || 'SerpAPI Google Flights API 錯誤');
    }
    
    // 檢查是否為空結果
    if (data.search_information?.flights_results_state === 'Fully empty') {
      console.log('SerpAPI 返回空結果，將使用 AirLabs 數據');
      return null;
    }
    
    // 處理 SerpAPI 返回的數據
    // SerpAPI Google Flights 返回的結構可能包含 best_flights, other_flights, flights 等
    // 也可能直接包含航班資訊
    let flights: any[] = [];
    
    // 根據 SerpAPI 文檔，航班數據可能在以下位置：
    // 1. best_flights - 最佳航班選項
    // 2. other_flights - 其他航班選項
    // 3. flights - 所有航班
    // 4. flight_info - 單個航班資訊
    if (data.best_flights && Array.isArray(data.best_flights) && data.best_flights.length > 0) {
      flights = data.best_flights;
    } else if (data.other_flights && Array.isArray(data.other_flights) && data.other_flights.length > 0) {
      flights = data.other_flights;
    } else if (data.flights && Array.isArray(data.flights) && data.flights.length > 0) {
      flights = data.flights;
    } else if (data.flight_info) {
      // 如果返回的是單個航班資訊
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
    
    // 記錄完整的航班數據結構以便調試
    if (flights.length > 0) {
      const sampleFlight = flights[0];
      console.log('SerpAPI 航班數據結構示例:', JSON.stringify({
        flightNumber: sampleFlight.flight_number,
        aircraft: sampleFlight.aircraft,
        airplane: sampleFlight.airplane,
        included_baggage: sampleFlight.included_baggage,
        baggage_prices: sampleFlight.baggage_prices,
        baggage: sampleFlight.baggage,
        departure_airport: sampleFlight.departure_airport,
        arrival_airport: sampleFlight.arrival_airport,
        departure_time: sampleFlight.departure_time,
        arrival_time: sampleFlight.arrival_time,
        dep_time: sampleFlight.dep_time,
        arr_time: sampleFlight.arr_time,
        allKeys: Object.keys(sampleFlight),
      }, null, 2).substring(0, 3000));
    }
    
    if (flights.length > 0) {
      // SerpAPI 結構中，每個選項可能包含 flights 陣列，實際航班資訊在其中
      // 這裡需要在所有 leg 裡尋找與目標航班編號完全匹配的項目（例如 "CI104" 對應 "CI 104"）
      const normalizedTargetFlightNumber = flightNumber.replace(/\s+/g, '').toUpperCase();

      const findMatchingOptionAndLeg = (options: any[]): { option: any; leg: any } | null => {
        for (const opt of options) {
          const legs = Array.isArray(opt.flights) && opt.flights.length > 0 ? opt.flights : [opt];
          for (const leg of legs) {
            const rawFn = (leg.flight_number || leg.flight_iata || '').toString();
            const normalizedFn = rawFn.replace(/\s+/g, '').toUpperCase();
            if (normalizedFn === normalizedTargetFlightNumber) {
              return { option: opt, leg };
            }
          }
        }
        return null;
      };

      const match = findMatchingOptionAndLeg(flights);
      const option = match?.option || flights[0];
      const leg = match?.leg || (Array.isArray(option.flights) && option.flights.length > 0 ? option.flights[0] : option);

      // 提取機場資訊（根據 SerpAPI 文檔格式）
      const departure = leg.departure_airport || leg.departure || {};
      const arrival = leg.arrival_airport || leg.arrival || {};
      
      // 提取時間資訊（根據 SerpAPI 文檔，時間格式為 "2025-10-14 11:30"）
      // 時間可能在 departure_airport.time 或 arrival_airport.time
      const parseSerpAPITime = (timeStr: string | undefined): string | undefined => {
        if (!timeStr) return undefined;
        // SerpAPI 時間格式： "2025-10-14 11:30" 或 "11:30"
        if (timeStr.includes(' ')) {
          const [, timePart] = timeStr.split(' ');
          return timePart; // 返回時間部分 "11:30"
        }
        // 如果已經是時間格式，直接返回
        if (timeStr.match(/^\d{2}:\d{2}$/)) {
          return timeStr;
        }
        return timeStr;
      };
      
      const departureTimeRaw = departure.time || leg.departure_time || leg.dep_time || undefined;
      const arrivalTimeRaw = arrival.time || leg.arrival_time || leg.arr_time || undefined;
      const departureTime = parseSerpAPITime(departureTimeRaw);
      const arrivalTime = parseSerpAPITime(arrivalTimeRaw);
      
      console.log('找到航班並提取數據:', JSON.stringify({
        requestedFlightNumber: flightNumber,
        matchedFlightNumber: (leg.flight_number || leg.flight_iata || '').toString(),
        departure: {
          id: departure.id,
          name: departure.name,
          time: departure.time,
          allKeys: Object.keys(departure),
        },
        arrival: {
          id: arrival.id,
          name: arrival.name,
          time: arrival.time,
          allKeys: Object.keys(arrival),
        },
        departureTimeRaw: departureTimeRaw,
        arrivalTimeRaw: arrivalTimeRaw,
        departureTime: departureTime,
        arrivalTime: arrivalTime,
        departureTimeSource: departure.time ? 'departure.time' : 
          (leg.departure_time ? 'flight.departure_time' : 
          (leg.dep_time ? 'flight.dep_time' : 'not found')),
        arrivalTimeSource: arrival.time ? 'arrival.time' : 
          (leg.arrival_time ? 'flight.arrival_time' : 
          (leg.arr_time ? 'flight.arr_time' : 'not found')),
        aircraft: leg.aircraft,
        airplane: leg.airplane,
        included_baggage: leg.included_baggage,
        baggage_prices: leg.baggage_prices,
        baggage: leg.baggage,
        optionKeys: Object.keys(option || {}),
        legKeys: Object.keys(leg || {}),
      }, null, 2).substring(0, 3000));
      
      // 提取延誤資訊（SerpAPI 可能不直接提供延誤資訊，需要從其他字段推斷）
      // 注意：SerpAPI Google Flights 主要提供價格和路線資訊，延誤資訊可能需要其他 API
      const isDelayed = !!(leg.delay || leg.delayed || leg.is_delayed);
      const delayMinutes = leg.delay_minutes || leg.delay_min || 0;
      
      // 提取航班資訊（從 leg 中提取，因為這是實際的航班資訊）
      const airline = leg.airline || '';
      const airlineCode = leg.airline_code || '';
      const flightNum = leg.flight_number || flightNumber;
      
      // 提取行李資訊（根據 SerpAPI 文檔，使用 included_baggage 欄位）
      const baggageInfo: any = {};
      
      // 優先使用 included_baggage 欄位（SerpAPI 標準欄位）
      if (leg.included_baggage) {
        const includedBaggage = leg.included_baggage;
        
        // included_baggage 可能是字符串或對象
        if (typeof includedBaggage === 'string') {
          baggageInfo.baggageAllowance = includedBaggage;
          // 嘗試從字符串中提取隨身行李和託運行李
          const lowerText = includedBaggage.toLowerCase();
          if (lowerText.includes('carry-on') || lowerText.includes('carryon') || lowerText.includes('hand')) {
            baggageInfo.carryOn = includedBaggage;
          }
          if (lowerText.includes('checked') || lowerText.includes('baggage') || lowerText.includes('luggage')) {
            baggageInfo.checkedBaggage = includedBaggage;
          }
        } else if (typeof includedBaggage === 'object') {
          // 如果是對象，提取各個字段
          baggageInfo.baggageAllowance = includedBaggage.text || includedBaggage.label || JSON.stringify(includedBaggage);
          baggageInfo.carryOn = includedBaggage.carry_on || includedBaggage.carryOn;
          baggageInfo.checkedBaggage = includedBaggage.checked || includedBaggage.checkedBaggage;
        }
      }
      
      // 如果沒有 included_baggage，嘗試其他字段作為後備
      if (!baggageInfo.baggageAllowance) {
        const baggagePrices = leg.baggage_prices || leg.baggage || [];
        if (Array.isArray(baggagePrices) && baggagePrices.length > 0) {
          baggageInfo.baggageAllowance = baggagePrices.map((p: any) => {
            if (typeof p === 'string') return p;
            return p.text || p.label || JSON.stringify(p);
          }).join(', ');
          
          const carryOnItem = baggagePrices.find((p: any) => {
            const text = (typeof p === 'string' ? p : p.text || p.label || '').toLowerCase();
            return text.includes('carry-on') || text.includes('carryon') || text.includes('hand');
          });
          baggageInfo.carryOn = carryOnItem ? (typeof carryOnItem === 'string' ? carryOnItem : carryOnItem.text || carryOnItem.label) : undefined;
          
          const checkedItem = baggagePrices.find((p: any) => {
            const text = (typeof p === 'string' ? p : p.text || p.label || '').toLowerCase();
            return !text.includes('carry-on') && !text.includes('carryon') && !text.includes('hand');
          });
          baggageInfo.checkedBaggage = checkedItem ? (typeof checkedItem === 'string' ? checkedItem : checkedItem.text || checkedItem.label) : undefined;
        }
      }
      
      // 如果還是沒有，嘗試 baggage_allowance 字段
      if (!baggageInfo.baggageAllowance && leg.baggage_allowance) {
        baggageInfo.baggageAllowance = leg.baggage_allowance;
      }
      
      // 提取飛機型號資訊（根據 SerpAPI 文檔）
      // 優先使用 airplane 欄位（SerpAPI 標準欄位，如 "Boeing 737MAX 8 Passenger"）
      // 其次使用 aircraft 欄位
      let aircraftInfo: any = undefined;
      
      if (leg.airplane) {
        // airplane 欄位通常是字符串，如 "Boeing 737MAX 8 Passenger"
        aircraftInfo = {
          name: leg.airplane,
        };
      } else if (leg.aircraft) {
        const aircraft = leg.aircraft;
        if (typeof aircraft === 'string') {
          // 如果是字符串，直接使用
          aircraftInfo = {
            name: aircraft,
          };
        } else if (typeof aircraft === 'object') {
          // 如果是對象，提取各個字段
          aircraftInfo = {
            code: aircraft.code || aircraft.icao || aircraft.iata,
            name: aircraft.name || aircraft.model || aircraft.type,
          };
        }
      }
      
      // 如果沒有 aircraft 欄位，嘗試其他字段作為後備
      if (!aircraftInfo) {
        const aircraft = leg.plane || {};
        if (aircraft.code || aircraft.icao || aircraft.iata || aircraft.name) {
          aircraftInfo = {
            code: aircraft.code || aircraft.icao || aircraft.iata,
            name: aircraft.name || aircraft.model || undefined,
          };
        }
      }
      
      // 提取 extensions 資訊（行李、Wi-Fi等）- 從 leg 中提取
      const extensions = leg.extensions || flight.extensions || [];
      const extensionsText = Array.isArray(extensions) 
        ? extensions.map((ext: any) => typeof ext === 'string' ? ext : ext.text || ext.label || '').filter(Boolean).join(', ')
        : '';
      
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
          // 優先使用從機場對象中提取的時間
          departure: departureTime,
          arrival: arrivalTime,
        },
        actualTime: {
          departure: flight.departure_time_actual || flight.dep_actual || undefined,
          arrival: flight.arrival_time_actual || flight.arr_actual || undefined,
        },
        // 行李資訊（如果有的話）
        baggageInfo: Object.keys(baggageInfo).length > 0 ? baggageInfo : undefined,
        // 飛機型號
        aircraft: aircraftInfo,
        // Extensions 資訊（行李、Wi-Fi等）
        extensions: extensionsText || undefined,
        // 額外資訊
        airline: airline,
        duration: leg.duration || option.total_duration || flight.duration, // 飛行時長（分鐘）
        price: option.price || flight.price, // 價格
        numberOfStops: option.layovers?.length || flight.number_of_stops || 0, // 經停次數
        // 機場座標（用於地圖顯示，如果 API 提供）
        departureCoordinates: departure.coordinates || departure.lat_lng || undefined,
        arrivalCoordinates: arrival.coordinates || arrival.lat_lng || undefined,
      };
    }
    
    // 如果沒有找到航班，返回 null 讓調用者使用 AirLabs 數據
    console.warn('SerpAPI 未找到航班資訊，將使用 AirLabs 數據:', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
      hasBestFlights: !!data.best_flights,
      hasOtherFlights: !!data.other_flights,
      hasFlights: !!data.flights,
    });
    
    return null;
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
    throw new Error(`查詢航班資訊失敗: ${error.message || '未知錯誤'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flightNumber, flightDate, userApiKey, airLabsApiKey } = body;

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
        // 先從 AirLabs 獲取機場代碼（如果提供了 AirLabs API Key）
        let depAirport: string | undefined;
        let arrAirport: string | undefined;
        let airLabsFlightInfo: any = null;
        
        if (airLabsApiKey) {
          const airportInfo = await getAirportInfoFromAirLabs(cleanedFlightNumber, airLabsApiKey);
          if (airportInfo) {
            depAirport = airportInfo.departure;
            arrAirport = airportInfo.arrival;
          }
          
          // 同時獲取 AirLabs 的完整航班信息（用於延誤狀態和時間）
          // 注意：AirLabs API 目前不支持日期參數，只能查詢實時/當天的航班資訊
          // 如果用戶選擇了未來日期，我們仍然查詢實時數據，但會在響應中標記
          try {
            const cleanedAirLabsKey = airLabsApiKey.trim().replace(/\s+/g, '');
            // AirLabs API 不支持日期參數，所以不添加日期
            // 這意味著我們只能獲取實時/當天的航班資訊
            const airLabsUrl = `https://airlabs.co/api/v9/flight?api_key=${cleanedAirLabsKey}&flight_iata=${cleanedFlightNumber}`;
            const airLabsResponse = await fetch(airLabsUrl);
            if (airLabsResponse.ok) {
              const airLabsData = await airLabsResponse.json();
              if (airLabsData.response && airLabsData.response.flight_iata) {
                airLabsFlightInfo = airLabsData.response;
                // 如果用戶選擇的日期不是今天，標記數據為實時數據
                if (flightDate) {
                  const selectedDate = new Date(flightDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  selectedDate.setHours(0, 0, 0, 0);
                  if (selectedDate.getTime() !== today.getTime()) {
                    // 標記這是實時數據，不是用戶選擇日期的數據
                    airLabsFlightInfo._isRealTimeData = true;
                    airLabsFlightInfo._requestedDate = flightDate;
                  }
                }
              }
            }
          } catch (err) {
            console.warn('無法獲取 AirLabs 完整資訊:', err);
          }
        }
        
        if (!depAirport || !arrAirport) {
          return NextResponse.json(
            {
              error: '無法獲取出發地和目的地機場代碼',
              suggestion: '請確保已設定 AirLabs API Key，SerpAPI 需要機場代碼才能查詢。',
            },
            { status: 400 }
          );
        }
        
        let serpApiFlightInfo: any = null;
        try {
          serpApiFlightInfo = await querySerpAPIFlights(cleanedFlightNumber, serpApiKey, flightDate, depAirport, arrAirport);
        } catch (serpError: any) {
          // 如果 SerpAPI 查詢失敗，記錄錯誤但繼續使用 AirLabs 數據
          console.warn('SerpAPI 查詢失敗，將僅使用 AirLabs 數據:', serpError.message);
        }
        
        // 如果 SerpAPI 沒有結果，只使用 AirLabs 的數據
        if (!serpApiFlightInfo && airLabsFlightInfo) {
          // 解析 AirLabs 的時間格式
          const parseTime = (timeValue: any) => {
            if (!timeValue) return undefined;
            if (typeof timeValue === 'string' && timeValue.includes(' ')) {
              const [datePart, timePart] = timeValue.split(' ');
              const [year, month, day] = datePart.split('-');
              const [hour, minute] = timePart.split(':');
              return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
            }
            if (typeof timeValue === 'number') {
              return new Date(timeValue * 1000);
            }
            return undefined;
          };
          
          const depTime = parseTime(airLabsFlightInfo.dep_time || airLabsFlightInfo.dep_time_ts);
          const arrTime = parseTime(airLabsFlightInfo.arr_time || airLabsFlightInfo.arr_time_ts);
          const depActual = parseTime(airLabsFlightInfo.dep_actual || airLabsFlightInfo.dep_actual_ts);
          const arrActual = parseTime(airLabsFlightInfo.arr_actual || airLabsFlightInfo.arr_actual_ts);
          
          // 計算延誤時間（分鐘）
          const isDelayed = depActual && depTime ? depActual.getTime() > depTime.getTime() : false;
          const delayMinutes = isDelayed && depActual && depTime 
            ? Math.round((depActual.getTime() - depTime.getTime()) / (1000 * 60))
            : 0;
          
          return NextResponse.json({
            flightNumber: airLabsFlightInfo.flight_iata || airLabsFlightInfo.flight_icao || cleanedFlightNumber,
            departure: {
              airport: airLabsFlightInfo.dep_iata || airLabsFlightInfo.dep_icao || '',
              city: airLabsFlightInfo.dep_city || airLabsFlightInfo.dep_name || '',
              terminal: airLabsFlightInfo.dep_terminal || undefined,
              gate: airLabsFlightInfo.dep_gate || undefined,
              checkInCounter: undefined,
            },
            arrival: {
              airport: airLabsFlightInfo.arr_iata || airLabsFlightInfo.arr_icao || '',
              city: airLabsFlightInfo.arr_city || airLabsFlightInfo.arr_name || '',
              terminal: airLabsFlightInfo.arr_terminal || undefined,
              gate: airLabsFlightInfo.arr_gate || undefined,
              baggageClaim: airLabsFlightInfo.arr_baggage || undefined,
            },
            status: airLabsFlightInfo.status || (isDelayed ? `延誤 ${delayMinutes} 分鐘` : '準時'),
            isDelayed: isDelayed || airLabsFlightInfo.status === 'delayed',
            delayMinutes: delayMinutes,
            scheduledTime: {
              departure: depTime ? depTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
              arrival: arrTime ? arrTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
            },
            actualTime: {
              departure: depActual ? depActual.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
              arrival: arrActual ? arrActual.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined,
            },
            baggageInfo: airLabsFlightInfo.arr_baggage ? {
              baggageClaim: airLabsFlightInfo.arr_baggage,
            } : undefined,
            aircraft: airLabsFlightInfo.aircraft_icao || airLabsFlightInfo.aircraft_iata ? {
              code: airLabsFlightInfo.aircraft_icao || airLabsFlightInfo.aircraft_iata,
              name: airLabsFlightInfo.aircraft_name || undefined,
            } : undefined,
          });
        }
        
        // 合併 SerpAPI 和 AirLabs 的數據
        // SerpAPI 提供路線、價格、機型、行李資訊（優先使用）
        // AirLabs 提供實時狀態、延誤資訊、登機門、行李轉盤（僅當 SerpAPI 沒有時使用，且僅限今天）
        if (airLabsFlightInfo && serpApiFlightInfo) {
          // 檢查查詢的日期是否是今天
          const isToday = (() => {
            if (!flightDate) return true;
            const selectedDate = new Date(flightDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);
            return selectedDate.getTime() === today.getTime();
          })();
          
          // 解析 AirLabs 的時間格式（僅用於今天的實時數據）
          const parseTime = (timeValue: any) => {
            if (!timeValue) return undefined;
            if (typeof timeValue === 'string' && timeValue.includes(' ')) {
              const [datePart, timePart] = timeValue.split(' ');
              const [year, month, day] = datePart.split('-');
              const [hour, minute] = timePart.split(':');
              return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
            }
            if (typeof timeValue === 'number') {
              return new Date(timeValue * 1000);
            }
            return undefined;
          };
          
          // 對於未來日期，不使用 AirLabs 的時間數據（因為 AirLabs 只能查詢當天）
          // 對於今天，可以使用 AirLabs 的實時數據
          let depTime: Date | undefined;
          let arrTime: Date | undefined;
          let depActual: Date | undefined;
          let arrActual: Date | undefined;
          
          if (isToday) {
            // 今天是今天，可以使用 AirLabs 的實時數據
            depTime = parseTime(airLabsFlightInfo.dep_time || airLabsFlightInfo.dep_time_ts);
            arrTime = parseTime(airLabsFlightInfo.arr_time || airLabsFlightInfo.arr_time_ts);
            depActual = parseTime(airLabsFlightInfo.dep_actual || airLabsFlightInfo.dep_actual_ts);
            arrActual = parseTime(airLabsFlightInfo.arr_actual || airLabsFlightInfo.arr_actual_ts);
          }
          
          // 優先使用 SerpAPI 的時間數據
          // 對於未來日期，必須使用 SerpAPI 的時間（因為 AirLabs 只能查詢當天）
          // 對於今天，如果 SerpAPI 沒有時間，可以使用 AirLabs 的實時數據
          const scheduledDeparture = serpApiFlightInfo.scheduledTime?.departure || 
            (isToday && depTime ? depTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined);
          const scheduledArrival = serpApiFlightInfo.scheduledTime?.arrival || 
            (isToday && arrTime ? arrTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined);
          const actualDeparture = serpApiFlightInfo.actualTime?.departure || 
            (isToday && depActual ? depActual.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined);
          const actualArrival = serpApiFlightInfo.actualTime?.arrival || 
            (isToday && arrActual ? arrActual.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : undefined);
          
          // 計算延誤時間（僅限今天，使用 AirLabs 的實時數據）
          let isDelayed = serpApiFlightInfo.isDelayed || false;
          let delayMinutes = serpApiFlightInfo.delayMinutes || 0;
          
          if (isToday && depActual && depTime) {
            const calculatedDelay = depActual.getTime() > depTime.getTime();
            if (calculatedDelay) {
              isDelayed = true;
              delayMinutes = Math.round((depActual.getTime() - depTime.getTime()) / (1000 * 60));
            }
          }
          
          return NextResponse.json({
            ...serpApiFlightInfo,
            departure: {
              ...serpApiFlightInfo.departure,
              // 優先使用 SerpAPI 的機場代碼，如果沒有再使用 AirLabs
              airport: serpApiFlightInfo.departure.airport || airLabsFlightInfo.dep_iata || '',
              city: serpApiFlightInfo.departure.city || airLabsFlightInfo.dep_city || airLabsFlightInfo.dep_name || '',
              // 登機門和航廈僅限今天使用 AirLabs 的實時數據
              terminal: (isToday ? airLabsFlightInfo.dep_terminal : undefined) || serpApiFlightInfo.departure.terminal,
              gate: (isToday ? airLabsFlightInfo.dep_gate : undefined) || serpApiFlightInfo.departure.gate,
            },
            arrival: {
              ...serpApiFlightInfo.arrival,
              // 優先使用 SerpAPI 的機場代碼，如果沒有再使用 AirLabs
              airport: serpApiFlightInfo.arrival.airport || airLabsFlightInfo.arr_iata || '',
              city: serpApiFlightInfo.arrival.city || airLabsFlightInfo.arr_city || airLabsFlightInfo.arr_name || '',
              // 登機門和航廈僅限今天使用 AirLabs 的實時數據
              terminal: (isToday ? airLabsFlightInfo.arr_terminal : undefined) || serpApiFlightInfo.arrival.terminal,
              gate: (isToday ? airLabsFlightInfo.arr_gate : undefined) || serpApiFlightInfo.arrival.gate,
              // 行李轉盤僅限今天使用 AirLabs 的實時數據
              baggageClaim: (isToday ? airLabsFlightInfo.arr_baggage : undefined) || serpApiFlightInfo.arrival.baggageClaim,
            },
            status: (isToday && airLabsFlightInfo.status) ? airLabsFlightInfo.status : 
              (isDelayed ? `延誤 ${delayMinutes} 分鐘` : serpApiFlightInfo.status || '準時'),
            isDelayed: isDelayed,
            delayMinutes: delayMinutes,
            scheduledTime: {
              departure: scheduledDeparture,
              arrival: scheduledArrival,
            },
            actualTime: {
              departure: actualDeparture,
              arrival: actualArrival,
            },
            // 合併行李資訊：優先使用 SerpAPI 的行李資訊，AirLabs 的行李轉盤僅限今天
            baggageInfo: (() => {
              const merged: any = {};
              // 優先使用 SerpAPI 的行李資訊
              if (serpApiFlightInfo.baggageInfo) {
                Object.assign(merged, serpApiFlightInfo.baggageInfo);
              }
              // 行李轉盤僅限今天使用 AirLabs 的實時數據
              if (isToday && airLabsFlightInfo.arr_baggage) {
                merged.baggageClaim = airLabsFlightInfo.arr_baggage;
              }
              // 如果只有行李轉盤資訊，也返回
              if (!merged.baggageAllowance && !merged.carryOn && !merged.checkedBaggage && merged.baggageClaim) {
                return merged;
              }
              return Object.keys(merged).length > 0 ? merged : undefined;
            })(),
            // 合併飛機型號：優先使用 SerpAPI 的飛機資訊
            aircraft: serpApiFlightInfo.aircraft || (airLabsFlightInfo.aircraft_icao || airLabsFlightInfo.aircraft_iata ? {
              code: airLabsFlightInfo.aircraft_icao || airLabsFlightInfo.aircraft_iata,
              name: airLabsFlightInfo.aircraft_name || undefined,
            } : undefined),
          });
        }
        
        return NextResponse.json(serpApiFlightInfo);
      } catch (error: any) {
        console.error('SerpAPI Google Flights 查詢失敗:', error);
        
        // 如果是缺少機場代碼的錯誤，提供更詳細的建議
        if (error.message.includes('departure_id') || error.message.includes('機場代碼')) {
          return NextResponse.json(
            {
              error: error.message,
              suggestion: 'SerpAPI 需要出發地和目的地機場代碼。請確保已設定 AirLabs API Key 以自動獲取機場代碼。',
            },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          {
            error: error.message || `找不到航班 ${cleanedFlightNumber} 的資訊`,
            suggestion: '請確認航班編號是否正確，或聯繫機場查詢最新資訊。',
          },
          { status: 404 }
        );
      }
    }

    // 如果沒有 SerpAPI Key，返回提示
    return NextResponse.json(
      {
        error: `找不到航班 ${cleanedFlightNumber} 的資訊。`,
        suggestion: '請在設定頁面設定 SerpAPI API Key 以獲取實時航班資訊和延誤狀態，或確認航班編號是否正確。',
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('查詢航班資訊錯誤:', error);
    return NextResponse.json(
      { error: '查詢航班資訊時發生錯誤', details: error.message },
      { status: 500 }
    );
  }
}
