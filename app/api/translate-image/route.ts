import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 支持的模型列表（按優先順序）
const MODEL_NAMES = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.5-flash-lite',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, targetLanguage, userApiKey } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: '缺少圖片數據' },
        { status: 400 }
      );
    }

    if (!userApiKey) {
      return NextResponse.json(
        { error: '缺少 API Key。請在設定頁面設定您的 Gemini API Key。' },
        { status: 400 }
      );
    }

    // 驗證 API Key 格式
    if (!userApiKey.startsWith('AIza')) {
      return NextResponse.json(
        { error: 'API Key 格式不正確。請確認您使用的是 Gemini API Key。' },
        { status: 400 }
      );
    }

    let lastError: any = null;

    // 嘗試使用不同的模型
    for (const modelName of MODEL_NAMES) {
      try {
        const genAI = new GoogleGenerativeAI(userApiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        // 構建人性化、簡單易懂的翻譯 prompt
        const prompt = `You are a helpful travel translator. Translate all text in this image to ${targetLanguage} in a natural, easy-to-understand way.

SPECIAL FOCUS:
- Road signs and traffic signs: Translate clearly and simply, keeping the meaning easy to understand
- Restaurant menus: Translate dish names naturally, making them sound appetizing and easy to understand. For prices, keep the numbers and currency symbols
- Store signs and labels: Translate in a way that travelers can easily understand
- Public notices and warnings: Keep the meaning clear and important

TRANSLATION STYLE:
- Use natural, conversational language that locals would use
- Make it simple and easy to understand for travelers
- Keep important information (numbers, prices, times) unchanged
- For menu items, translate in a way that sounds appetizing and natural
- For road signs, prioritize clarity and safety

INSTRUCTIONS:
1. Identify ALL text in the image (signs, menus, labels, notices, etc.)
2. Translate everything to ${targetLanguage} in a natural, human-friendly way
3. Keep the original layout and structure (line breaks, sections)
4. Return ONLY the translated text - no explanations, no notes, no additional commentary
5. If no text is found, return: "圖片中沒有可識別的文字" (for Chinese) or "No text found in image" (for other languages)

IMPORTANT:
- Translate every word, but make it sound natural and easy to understand
- For menus: Make dish names sound appetizing and natural
- For signs: Prioritize clarity and safety
- Do NOT add explanations or notes
- Do NOT skip any text
- Return ONLY the translated content`;

        // 使用正確的 Gemini API 格式
        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: imageBase64,
                  mimeType: 'image/jpeg',
                },
              },
            ],
          }],
        });

        const response = result.response;
        const translatedText = response.text();

        if (translatedText && translatedText.trim()) {
          return NextResponse.json({
            translatedText: translatedText.trim(),
            model: modelName,
          });
        }
      } catch (error: any) {
        console.error(`模型 ${modelName} 失敗:`, error);
        lastError = error;
        
        // 如果是 404 錯誤（模型不存在），嘗試下一個模型
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          continue;
        }
        
        // 如果是速率限制或配額錯誤，直接返回（不要嘗試下一個模型）
        const errorStr = (error.message || error.toString() || '').toLowerCase();
        if (errorStr.includes('too many requests') || 
            errorStr.includes('rate limit') || 
            errorStr.includes('quota exceeded') ||
            errorStr.includes('429') ||
            errorStr.includes('403')) {
          throw error;
        }
        
        // 如果是其他錯誤，直接返回
        throw error;
      }
    }

    // 如果所有模型都失敗
    throw lastError || new Error('所有模型都無法使用');
  } catch (error: any) {
    console.error('翻譯圖片錯誤:', error);
    
    let errorMessage = '翻譯時發生錯誤';
    let statusCode = 500;
    let isQuotaError = false;
    
    // 檢查錯誤類型
    const errorStr = error.message || error.toString() || '';
    const statusCodeMatch = errorStr.match(/\[(\d+)\]/);
    const httpStatus = statusCodeMatch ? parseInt(statusCodeMatch[1]) : null;
    
    // 檢查是否是配額相關錯誤
    const quotaKeywords = ['quota', 'exceeded', 'limit', 'RPD', 'requests per day', 'resource exhausted'];
    const hasQuotaKeyword = quotaKeywords.some(keyword => 
      errorStr.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (error.message?.includes('API key not valid') || error.message?.includes('401')) {
      errorMessage = 'API Key 無效，請檢查您的 Gemini API Key 是否正確';
      statusCode = 401;
    } else if (httpStatus === 429 || error.message?.includes('429') || error.message?.includes('rate limit')) {
      errorMessage = 'API 請求次數過多（速率限制）\n\n建議：\n- 等待 10-30 秒後再試\n- 避免快速連續請求\n- 系統將自動重試';
      statusCode = 429;
    } else if (httpStatus === 403 || hasQuotaKeyword || error.message?.includes('403') || error.message?.includes('quota') || error.message?.includes('exceeded') || error.message?.includes('RPD')) {
      isQuotaError = true;
      errorMessage = 'API 配額已用完（Peak requests per day 超過限制）\n\n解決方案：\n1. 等待 24 小時後配額重置\n2. 升級您的 Gemini API 配額\n3. 檢查配額使用情況：https://makersuite.google.com/app/apikey\n\n注意：免費配額通常每天有請求次數限制';
      statusCode = 403;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        isQuotaError,
        statusCode 
      },
      { status: statusCode }
    );
  }
}

