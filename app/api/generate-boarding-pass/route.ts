import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const {
      flightInfo,
      userApiKey,
    } = await request.json();

    if (!flightInfo) {
      return NextResponse.json(
        { error: '缺少航班資訊' },
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

    const genAI = new GoogleGenerativeAI(userApiKey);

    // 構建登機證資訊描述
    const boardingPassInfo = `
航班號碼：${flightInfo.flightNumber || 'N/A'}
出發機場：${flightInfo.departure?.airport || 'N/A'} (${flightInfo.departure?.city || 'N/A'})
抵達機場：${flightInfo.arrival?.airport || 'N/A'} (${flightInfo.arrival?.city || 'N/A'})
出發時間：${flightInfo.scheduledTime?.departure || 'N/A'}
抵達時間：${flightInfo.scheduledTime?.arrival || 'N/A'}
航廈：${flightInfo.departure?.terminal || 'N/A'}
登機門：${flightInfo.departure?.gate || 'N/A'}
報到櫃檯：${flightInfo.departure?.checkInCounter || 'N/A'}
航空公司：${flightInfo.airline || 'N/A'}
機型：${flightInfo.aircraft?.name || flightInfo.aircraft?.code || 'N/A'}
`;

    const prompt = `
請為我生成一個未來感、賽博龐克風格的虛擬電子登機證設計描述。

**航班資訊：**
${boardingPassInfo}

**設計要求：**
1. 未來感、賽博龐克風格（霓虹色彩、科技感、數位化）
2. 包含所有航班資訊
3. 設計要精美、專業
4. 使用 SVG 格式描述，包含所有視覺元素、顏色、字體、布局等
5. 尺寸：800x400 像素（橫向）
6. 背景：深色（黑色或深藍色）帶有霓虹光效
7. 文字：使用發光效果、科技感字體
8. 包含裝飾性元素：幾何圖形、光線效果、數位化邊框等

**輸出格式：**
請直接輸出完整的 SVG 代碼，不要包含任何 Markdown 標記或額外說明。SVG 應該包含：
- 背景和裝飾元素
- 所有航班資訊的文字
- 霓虹光效和科技感設計
- 清晰的布局和層次

直接輸出 SVG 代碼即可。
`;

    const modelNames = ['gemini-3-pro-image-preview', 'gemini-3-pro-preview', 'gemini-2.5-pro'];
    let svgCode: string | undefined;
    let lastError: any = null;

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        // 清理可能的 Markdown 標記
        if (text.startsWith('```svg')) {
          text = text.replace(/^```svg\s*/, '').replace(/\s*```$/, '');
        } else if (text.startsWith('```')) {
          text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        svgCode = text;
        break;
      } catch (error: any) {
        console.warn(`模型 ${modelName} 失敗:`, error.message);
        lastError = error;
        continue;
      }
    }

    if (!svgCode) {
      throw lastError || new Error('所有模型都失敗');
    }

    return NextResponse.json({
      success: true,
      svgCode,
    });

  } catch (error: any) {
    console.error('生成登機證錯誤:', error);

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
          error: 'Gemini API 配額已用完',
          details: '請稍後再試，或檢查您的 Gemini API 配額。',
          isQuotaError: true
        },
        { status: 403 }
      );
    }

    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        {
          error: 'Gemini API 速率限制',
          details: '請求過於頻繁，請稍後再試。',
          isRateLimitError: true
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: '生成登機證失敗',
        details: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

