import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIItineraryResponse } from '@/types';

const GEMINI_SYSTEM_PROMPT = `
你是一個旅遊規劃助手。請根據使用者的輸入和提供的文件內容，生成詳細的旅遊行程 JSON。

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
          "estimatedCost": 500,
          "category": "food"
        }
      ]
    }
  ]
}

**重要要求：**
1. **優先使用文件內容**：如果文件中提到了具體的地點、餐廳、景點，請優先使用這些資訊。
2. **地點狀態檢查**：絕對不要推薦已停業、永久關閉、或暫時歇業的地點。
3. **預算最大化**：總預算必須使用到約 90%（85%-95% 之間）。
4. **時間格式**：必須是 HH:mm (24小時制)。
5. **category**：必須是以下之一：food, transport, sightseeing, shopping。
6. **googleMapQuery**：必須精準，以確保地圖連結有效。
7. **行程安排**：需考慮地理位置順序，避免繞路。
`;

// ------- 關鍵字匹配（後備 RAG 策略） -------

// 使用簡單的關鍵字匹配作為 RAG 檢索的後備方案
function extractKeywords(text: string): string[] {
  // 提取中文和英文關鍵字
  const chineseWords = text.match(/[\u4e00-\u9fa5]+/g) || [];
  const englishWords = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  return [...chineseWords, ...englishWords];
}

// 計算文字相似度（基於關鍵字重疊）
function calculateTextSimilarity(textA: string, textB: string): number {
  const keywordsA = new Set(extractKeywords(textA));
  const keywordsB = new Set(extractKeywords(textB));
  
  if (keywordsA.size === 0 || keywordsB.size === 0) return 0;
  
  let intersection = 0;
  for (const keyword of keywordsA) {
    if (keywordsB.has(keyword)) {
      intersection++;
    }
  }
  
  const union = keywordsA.size + keywordsB.size - intersection;
  return union > 0 ? intersection / union : 0; // Jaccard 相似度
}

// 使用關鍵字匹配檢索文檔片段（後備方案）
function retrieveRelevantChunksByKeyword(
  query: string,
  documentChunks: string[],
  topK: number = 5
): string[] {
  // 計算每個文檔塊與查詢的相似度
  const chunkScores: Array<{ chunk: string; score: number }> = [];
  
  for (const chunk of documentChunks) {
    const similarity = calculateTextSimilarity(query, chunk);
    chunkScores.push({ chunk, score: similarity });
  }
  
  // 按相似度排序，取前 topK 個
  chunkScores.sort((a, b) => b.score - a.score);
  const selectedChunks = chunkScores.slice(0, topK).map(item => item.chunk);
  
  // 如果沒有找到相關的（相似度都為0），返回前幾個文檔塊
  if (selectedChunks.length === 0 || chunkScores[0].score === 0) {
    return documentChunks.slice(0, topK);
  }
  
  return selectedChunks;
}

// ------- Hugging Face Embedding RAG 策略 -------

// 使用 Hugging Face Inference API 生成向量
async function generateEmbeddingHF(text: string, hfApiKey: string): Promise<number[]> {
  const cleanedKey = hfApiKey.trim();
  if (!cleanedKey) {
    throw new Error('Hugging Face API Key 為空');
  }

  const response = await fetch(
    'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    }
  );

  if (!response.ok) {
    let errorBody: any = null;
    try {
      errorBody = await response.json();
    } catch {
      // ignore
    }
    console.error('Hugging Face Embedding API 錯誤:', {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    throw new Error(`Hugging Face Embedding API 錯誤 (${response.status})`);
  }

  const data = await response.json();

  // 典型回傳為 [[...向量...]] 或 {...}
  let embedding: any = data;
  if (Array.isArray(data)) {
    if (Array.isArray(data[0])) {
      embedding = data[0];
    }
  } else if (data && Array.isArray(data.embeddings)) {
    embedding = data.embeddings[0];
  }

  if (!Array.isArray(embedding)) {
    throw new Error('Hugging Face Embedding 回傳格式不正確');
  }

  return embedding as number[];
}

// 計算餘弦相似度
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 綜合 RAG 檢索：優先使用 Hugging Face Embedding，失敗時回退到關鍵字匹配
async function retrieveRelevantChunks(
  query: string,
  documentChunks: string[],
  hfApiKey?: string,
  topK: number = 5
): Promise<string[]> {
  // 如果提供了 Hugging Face API key，優先嘗試向量檢索
  if (hfApiKey && hfApiKey.trim()) {
    try {
      const queryEmbedding = await generateEmbeddingHF(query, hfApiKey);
      const chunkScores: Array<{ chunk: string; score: number }> = [];

      for (const chunk of documentChunks) {
        try {
          const chunkEmbedding = await generateEmbeddingHF(chunk, hfApiKey);
          const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
          chunkScores.push({ chunk, score: similarity });
        } catch (err) {
          console.warn('Hugging Face chunk embedding 失敗，跳過該片段:', (err as Error).message);
        }
      }

      if (chunkScores.length > 0) {
        chunkScores.sort((a, b) => b.score - a.score);
        const selected = chunkScores.slice(0, topK).map(item => item.chunk);
        // 如果最高分為 0，代表沒有實質相似度，改用關鍵字匹配
        if (selected.length > 0 && chunkScores[0].score > 0) {
          return selected;
        }
      }
    } catch (err) {
      console.warn('Hugging Face RAG 檢索失敗，改用關鍵字匹配:', (err as Error).message);
    }
  }

  // 後備：使用關鍵字匹配
  return retrieveRelevantChunksByKeyword(query, documentChunks, topK);
}

export async function POST(request: NextRequest) {
  try {
    const { 
      destination, 
      days, 
      budget, 
      preferences, 
      currency = 'TWD', 
      userApiKey, // Gemini 用於生成行程
      hfApiKey,   // Hugging Face 用於 RAG 檢索（可選）
      documentChunks, // 從檔案上傳 API 獲得的文檔塊
      excludedPlaces 
    } = await request.json();

    if (!destination || !days || !budget) {
      return NextResponse.json(
        { error: '缺少必要參數：destination, days, budget' },
        { status: 400 }
      );
    }

    if (!userApiKey || userApiKey.trim() === '') {
      return NextResponse.json(
        { 
          error: 'GEMINI_API_KEY 未設定',
          details: '請在設定頁面輸入您的 Gemini API Key。',
          errorCode: 'API_KEY_NOT_SET'
        },
        { status: 500 }
      );
    }

    if (!documentChunks || !Array.isArray(documentChunks) || documentChunks.length === 0) {
      return NextResponse.json(
        { error: '未提供文件內容，請先上傳旅遊文件' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(userApiKey);
    
    // 計算目標預算（90%）
    const targetBudget = Math.round(budget * 0.9);
    
    // 構建查詢（用於 RAG 檢索）
    const query = `${destination} ${days}天 ${preferences || ''} 旅遊行程`;
    
    // 檢索最相關的文檔片段（優先使用 Hugging Face Embedding，失敗時回退到關鍵字匹配）
    const relevantChunks = await retrieveRelevantChunks(query, documentChunks, hfApiKey, 5);
    
    const documentContext = relevantChunks.join('\n\n');
    
    let excludedPlacesPrompt = '';
    if (excludedPlaces && excludedPlaces.trim()) {
      excludedPlacesPrompt = `
**絕對不要推薦以下地點或類型：**
${excludedPlaces}

請確保行程中完全排除這些地點。
`;
    }
    
    const userPrompt = `
請根據以下文件內容，為我規劃一個 ${days} 天的 ${destination} 旅遊行程。

**重要：必須生成 ${days} 天的行程，不能多也不能少。每一天都必須有活動安排。**

**文件內容（優先參考）：**
${documentContext}

總預算：${budget} ${currency}
目標使用預算：${targetBudget} ${currency}（約 90%）
${preferences ? `旅遊偏好：${preferences}` : ''}

${excludedPlacesPrompt}

**特別注意：**
1. **優先使用文件中的地點和建議**：如果文件中提到了具體的地點、餐廳、景點，請優先將它們納入行程。
2. 所有推薦的地點必須是「目前正常營業」的。
3. 總花費應該接近 ${targetBudget} ${currency}（預算的 90%）。
4. 請確保所有地點都是可以實際訪問的。

${GEMINI_SYSTEM_PROMPT}

請直接回傳 JSON，不要包含任何 Markdown 標記或額外說明。
`;

    // 嘗試多個模型
    const modelNames = ['gemini-2.5-flash', 'gemini-2.5-pro'];
    let cleanedText: string | undefined;
    let lastError: any = null;
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(userPrompt);
        const response = await result.response;
        cleanedText = response.text();
        break;
      } catch (error: any) {
        console.warn(`模型 ${modelName} 失敗:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (!cleanedText) {
      throw lastError || new Error('所有模型都失敗');
    }

    // 清理 JSON（移除可能的 Markdown 標記）
    let jsonText = cleanedText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsedData = JSON.parse(jsonText) as AIItineraryResponse;

    // 驗證並修正行程結構
    if (!parsedData.itinerary || !Array.isArray(parsedData.itinerary)) {
      throw new Error('返回的行程格式不正確');
    }

    // 確保每一天都有正確的 dayId
    parsedData.itinerary = parsedData.itinerary.map((day, index) => ({
      ...day,
      dayId: day.dayId || index + 1,
      activities: (day.activities || []).map((activity: any, actIndex) => ({
        ...activity,
        id: activity.id || `activity-${Date.now()}-${actIndex}`,
        estimatedCost: activity.estimatedCost || activity.cost || 0, // 處理可能的 cost 字段
        actualCost: activity.actualCost || 0,
      })),
    }));

    // 確保天數正確
    if (parsedData.itinerary.length < days) {
      // 如果返回的天數不足，添加空天
      for (let i = parsedData.itinerary.length; i < days; i++) {
        parsedData.itinerary.push({
          dayId: i + 1,
          activities: [],
        });
      }
    } else if (parsedData.itinerary.length > days) {
      // 如果返回的天數過多，截斷
      parsedData.itinerary = parsedData.itinerary.slice(0, days);
    }

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('RAG 行程生成錯誤:', error);
    
    // 處理特定錯誤
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { 
          error: 'GEMINI_API_KEY 無效',
          details: '請確認您的 API Key 是否正確。',
          errorCode: 'INVALID_API_KEY'
        },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('quota') || error.message?.includes('RPD')) {
      return NextResponse.json(
        { 
          error: 'API 配額已用完',
          details: '請稍後再試，或檢查您的 API 配額。',
          isQuotaError: true
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        error: '行程生成失敗',
        details: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

