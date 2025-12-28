import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 支持的模型列表（按優先順序）
const MODEL_NAMES = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
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

        const prompt = `You are a professional translator. Please identify all text in this image and translate it to ${targetLanguage}.

Requirements:
1. Identify ALL text in the image (including signs, menus, road signs, labels, etc.)
2. Translate ALL text to ${targetLanguage}
3. Maintain the original format and layout as much as possible
4. If there are multiple lines or sections, display them on separate lines
5. ONLY return the translated text, do NOT add any explanations, notes, or additional text
6. If the image contains no text, reply with: "圖片中沒有可識別的文字" (if target language is Chinese) or "No text found in image" (if target language is English)

Important: 
- Translate every single word, character, and number you see
- Do not skip any text
- Do not add your own comments
- Return ONLY the translated content`;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: imageBase64,
              mimeType: 'image/jpeg',
            },
          },
        ]);

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

