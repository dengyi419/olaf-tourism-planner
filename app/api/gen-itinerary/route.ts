import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIItineraryResponse } from '@/types';

const GEMINI_SYSTEM_PROMPT = `
你是一個旅遊規劃助手。請根據使用者的輸入，生成詳細的旅遊行程 JSON。

**必須嚴格遵守以下 JSON 格式回傳，不要包含 Markdown 標記：**

{
  "itinerary": [
    {
      "dayId": 1,
      "activities": [
        {
          "time": "09:00",
          "locationName": "地點名稱",
          "description": "20字內的簡短推薦理由與活動描述",
          "googleMapQuery": "地點名稱+城市 (用於搜尋)",
          "cost": 500,
          "category": "food"
        }
      ]
    }
  ]
}

**重要要求：**
1. **地點狀態檢查**：絕對不要推薦已停業、永久關閉、或暫時歇業的地點。只推薦目前正常營業且可訪問的地點。如果無法確認地點是否營業，請選擇其他確認營業的替代地點。
2. **預算最大化**：總預算必須使用到約 90%（85%-95% 之間）。請根據預算合理分配每天的費用，確保總花費接近預算的 90%。不要過度節省，要充分利用預算。
3. 價格 (cost) 請根據當地物價進行合理預估 (數值)，並確保總和接近預算的 90%。
4. googleMapQuery 必須精準，以確保地圖連結有效。
5. 行程安排需考慮地理位置順序，避免繞路。
6. 每個活動必須包含 id 欄位（使用 UUID 格式，例如：使用時間戳記+隨機字串）。
7. category 必須是以下之一：food, transport, sightseeing, shopping。
8. 時間格式必須是 HH:mm (24小時制)。
9. 請確保所有推薦的地點都是目前可以訪問的，避免推薦已停業或關閉的場所。
`;

export async function POST(request: NextRequest) {
  try {
    const { destination, days, budget, preferences, currency = 'TWD', userApiKey, excludedPlaces, imageBase64 } = await request.json();

    if (!destination || !days || !budget) {
      return NextResponse.json(
        { error: '缺少必要參數：destination, days, budget' },
        { status: 400 }
      );
    }

    // 只使用使用者提供的 API key，不使用環境變數作為 fallback
    if (!userApiKey || userApiKey.trim() === '') {
      return NextResponse.json(
        { 
          error: 'GEMINI_API_KEY 未設定',
          details: '請在設定頁面輸入您的 Gemini API Key。您可以在 https://makersuite.google.com/app/apikey 取得新的 API 金鑰。',
          errorCode: 'API_KEY_NOT_SET'
        },
        { status: 500 }
      );
    }

    const apiKey = userApiKey;

    // 檢查 API 金鑰格式（Gemini API 金鑰通常以 AIza 開頭）
    if (!apiKey.startsWith('AIza')) {
      console.warn('警告：API 金鑰格式可能不正確。Gemini API 金鑰通常以 "AIza" 開頭');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 嘗試多個模型名稱（按優先順序，如果有圖片則使用支持視覺的模型）
    const modelNames = imageBase64 
      ? ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash', 'gemini-2.5-pro']
      : ['gemini-2.5-flash', 'gemini-2.5-pro'];
    
    // 計算目標預算（90%）
    const targetBudget = Math.round(budget * 0.9);
    
    let imageAnalysisPrompt = '';
    if (imageBase64) {
      imageAnalysisPrompt = `
**圖片分析要求：**
請仔細分析上傳的圖片，識別圖片中的地點、景點、餐廳、商店等。將這些地點加入行程中，並確保這些地點與目的地 ${destination} 相關。如果圖片中的地點不在 ${destination}，請忽略它們。
`;
    }

    let excludedPlacesPrompt = '';
    if (excludedPlaces && excludedPlaces.trim()) {
      excludedPlacesPrompt = `
**絕對不要推薦以下地點或類型：**
${excludedPlaces}

請確保行程中完全排除這些地點，不要以任何形式推薦它們。
`;
    }
    
    const userPrompt = `
請為我規劃一個 ${days} 天的 ${destination} 旅遊行程。

總預算：${budget} ${currency}
目標使用預算：${targetBudget} ${currency}（約 90%）
${preferences ? `旅遊偏好：${preferences}` : ''}

${imageAnalysisPrompt}

${excludedPlacesPrompt}

**特別注意：**
1. 所有推薦的地點必須是「目前正常營業」的，絕對不要推薦已停業、永久關閉或暫時歇業的地點。
2. 總花費應該接近 ${targetBudget} ${currency}（預算的 90%），請充分利用預算規劃優質行程。
3. 請確保所有地點都是可以實際訪問的，避免推薦已關閉的場所。
${excludedPlaces && excludedPlaces.trim() ? '4. 絕對不要推薦排除清單中的地點。' : ''}

${GEMINI_SYSTEM_PROMPT}

請直接回傳 JSON，不要包含任何 Markdown 標記或額外說明。
`;

    // 嘗試每個模型，直到成功為止
    let cleanedText: string | undefined;
    let lastError: any = null;
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        
        let result;
        if (imageBase64) {
          // 如果有圖片，使用視覺模型
          const imagePart = {
            inlineData: {
              data: imageBase64.split(',')[1] || imageBase64, // 移除 data:image/...;base64, 前綴
              mimeType: imageBase64.startsWith('data:image/') 
                ? imageBase64.split(';')[0].split(':')[1] 
                : 'image/jpeg',
            },
          };
          result = await model.generateContent([userPrompt, imagePart]);
        } else {
          result = await model.generateContent(userPrompt);
        }
        
        const response = await result.response;
        const text = response.text();
        
        // 如果成功，跳出循環
        cleanedText = text.trim();
        break;
      } catch (modelError: any) {
        lastError = modelError;
        // 如果是模型不存在的錯誤，嘗試下一個模型
        if (modelError.message?.includes('is not found') || modelError.message?.includes('404')) {
          console.warn(`模型 ${modelName} 不可用，嘗試下一個...`);
          continue;
        }
        // 其他錯誤直接拋出
        throw modelError;
      }
    }
    
    // 如果所有模型都失敗
    if (!cleanedText) {
      if (lastError) {
        throw lastError;
      }
      throw new Error('無法找到可用的 Gemini 模型');
    }

    // 清理回應文字，移除可能的 Markdown 標記
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // 解析 JSON
    let parsedData: AIItineraryResponse;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON 解析錯誤:', parseError);
      console.error('原始回應:', cleanedText);
      return NextResponse.json(
        { error: 'AI 回應格式錯誤', rawResponse: cleanedText },
        { status: 500 }
      );
    }

    // 為每個活動生成 ID，並將 cost 轉換為 estimatedCost，actualCost 設為 0
    const itineraryWithIds = parsedData.itinerary.map((day) => ({
      ...day,
      activities: day.activities.map((activity: any) => {
        // AI 回傳的 JSON 使用 cost 欄位，我們需要轉換為 estimatedCost
        const estimatedCost = activity.cost || activity.estimatedCost || 0;
        const { cost, ...restActivity } = activity;
        return {
          ...restActivity,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          estimatedCost, // AI 預估費用
          actualCost: 0, // 使用者實際花費，預設為 0
        };
      }),
    }));

    // 驗證總預算使用率
    const totalEstimatedCost = itineraryWithIds.reduce((total, day) => {
      return total + day.activities.reduce((dayTotal, activity: any) => {
        return dayTotal + (activity.estimatedCost || 0);
      }, 0);
    }, 0);

    const budgetUsageRate = (totalEstimatedCost / budget) * 100;
    const targetRate = 90;
    const tolerance = 15; // 允許 15% 的誤差範圍（75%-105%）

    // 如果預算使用率不在合理範圍內，記錄警告（但不阻止返回）
    if (budgetUsageRate < targetRate - tolerance || budgetUsageRate > targetRate + tolerance) {
      console.warn(`預算使用率警告: ${budgetUsageRate.toFixed(1)}% (目標: ${targetRate}%)`);
    }

    return NextResponse.json({ 
      itinerary: itineraryWithIds,
      budgetInfo: {
        totalBudget: budget,
        totalEstimatedCost,
        budgetUsageRate: parseFloat(budgetUsageRate.toFixed(2)),
        currency,
      }
    });
  } catch (error: any) {
    console.error('生成行程錯誤:', error);
    
    let errorMessage = '生成行程失敗';
    let statusCode = 500;
    let isQuotaError = false;
    let errorCode = 'UNKNOWN_ERROR';
    let details = error.message || '';
    
    // 檢查錯誤類型
    const errorStr = error.message || error.toString() || '';
    const statusCodeMatch = errorStr.match(/\[(\d+)\]/);
    const httpStatus = statusCodeMatch ? parseInt(statusCodeMatch[1]) : null;
    
    // 檢查是否是配額相關錯誤
    const quotaKeywords = ['quota', 'exceeded', 'limit', 'RPD', 'requests per day', 'resource exhausted'];
    const hasQuotaKeyword = quotaKeywords.some(keyword => 
      errorStr.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // 處理 API 金鑰相關錯誤
    if (error.message?.includes('API key not valid') || error.message?.includes('API_KEY_INVALID') || error.message?.includes('401')) {
      errorMessage = 'API 金鑰無效';
      details = '請檢查您的 Gemini API Key 是否正確。您可以在 https://makersuite.google.com/app/apikey 取得新的 API 金鑰。';
      errorCode = 'INVALID_API_KEY';
      statusCode = 401;
    }
    // 處理速率限制錯誤（429）
    else if (httpStatus === 429 || error.message?.includes('429') || error.message?.includes('rate limit')) {
      errorMessage = 'API 請求次數過多（速率限制）';
      details = '建議：\n- 等待 10-30 秒後再試\n- 避免快速連續請求';
      errorCode = 'RATE_LIMIT';
      statusCode = 429;
    }
    // 處理配額限制錯誤（403）
    else if (httpStatus === 403 || hasQuotaKeyword || error.message?.includes('403') || error.message?.includes('quota') || error.message?.includes('exceeded') || error.message?.includes('RPD')) {
      isQuotaError = true;
      errorMessage = 'API 配額已用完（Peak requests per day 超過限制）';
      details = '解決方案：\n1. 等待 24 小時後配額重置\n2. 升級您的 Gemini API 配額\n3. 檢查配額使用情況：https://makersuite.google.com/app/apikey\n\n注意：免費配額通常每天有請求次數限制';
      errorCode = 'QUOTA_EXCEEDED';
      statusCode = 403;
    }
    // 處理模型不存在錯誤
    else if (error.message?.includes('is not found') || error.message?.includes('404')) {
      errorMessage = 'AI 模型不可用';
      details = 'Gemini 模型名稱可能已更新。請檢查 Google AI Studio 以確認可用的模型名稱。';
      errorCode = 'MODEL_NOT_FOUND';
      statusCode = 404;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details,
        errorCode,
        isQuotaError
      },
      { status: statusCode }
    );
  }
}

