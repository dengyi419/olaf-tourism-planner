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

        const prompt = `請識別這張圖片中的文字，並將所有文字翻譯成${targetLanguage}。如果圖片中沒有文字，請回覆「圖片中沒有可識別的文字」。

要求：
1. 識別圖片中的所有文字（包括標誌、菜單、路牌等）
2. 將所有文字翻譯成${targetLanguage}
3. 保持原始格式和佈局
4. 如果有多段文字，請分行顯示
5. 只返回翻譯後的文字，不要添加額外說明`;

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
    
    // 檢查錯誤類型
    const errorStr = error.message || error.toString() || '';
    const statusCodeMatch = errorStr.match(/\[(\d+)\]/);
    const httpStatus = statusCodeMatch ? parseInt(statusCodeMatch[1]) : null;
    
    if (error.message?.includes('API key not valid') || error.message?.includes('401')) {
      errorMessage = 'API Key 無效，請檢查您的 Gemini API Key 是否正確';
      statusCode = 401;
    } else if (error.message?.includes('429') || httpStatus === 429 || error.message?.includes('rate limit') || error.message?.includes('quota exceeded')) {
      errorMessage = 'API 請求次數過多，請稍後再試（建議等待 10-30 秒）';
      statusCode = 429;
    } else if (error.message?.includes('quota') || error.message?.includes('exceeded')) {
      errorMessage = 'API 配額已用完，請檢查您的 Gemini API 配額';
      statusCode = 403;
    } else if (error.message?.includes('403')) {
      errorMessage = 'API 請求被拒絕，請檢查您的 API Key 權限';
      statusCode = 403;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

