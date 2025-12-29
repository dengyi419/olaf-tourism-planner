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
請為我生成一個場景：在一個純白色的房間中，上方有一盞燈打在銀色登機證上。

**航班資訊：**
${boardingPassInfo}

**場景要求：**
1. **背景**：純白色房間背景（#FFFFFF 或接近白色）
2. **燈光效果**：
   - 從上方（頂部）有一盞燈照射下來
   - 燈光形成圓形或橢圓形的光斑，打在登機證上
   - 使用 radialGradient 或 linearGradient 創造從亮到暗的燈光效果
   - 燈光中心最亮，向外逐漸變暗
3. **登機證**：
   - 銀色、高級質感、3D風格的登機證
   - 位於畫面中央或稍微偏下
   - 使用金屬銀、亮銀、深銀等銀色系漸變
   - 卡片邊緣要有厚度感和深度
   - 在燈光照射下呈現光澤和反射效果
4. **資訊顯示**：
   - **所有航班資訊必須完全在登機證範圍內**
   - 不要有任何文字或元素超出登機證邊界
   - 文字清晰、易讀，使用深色（黑色或深灰色）以確保在銀色背景上可見
   - 資訊布局整齊、專業
5. **尺寸**：800x400 像素（橫向）
6. **視覺效果**：
   - 登機證在燈光照射下有明顯的高光和陰影
   - 房間背景純白，沒有任何裝飾
   - 燈光效果要自然、真實
   - 登機證要有立體感，像是放在白色桌面上

**重要限制：**
- 所有文字和資訊必須嚴格限制在登機證的邊界內
- 不要有任何元素超出登機證範圍
- 登機證的尺寸要合理，不要過大或過小

**輸出格式：**
請直接輸出完整的 SVG 代碼，不要包含任何 Markdown 標記或額外說明。SVG 應該包含：
- 純白色背景（房間）
- 頂部燈光效果（使用漸變）
- 銀色登機證（在燈光照射下）
- 所有航班資訊（完全在登機證範圍內）
- 立體陰影和高光效果

直接輸出 SVG 代碼即可。
`;

    const modelNames = ['gemini-2.5-flash-image', 'gemini-2.5-flash', 'gemini-2.5-pro'];
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

