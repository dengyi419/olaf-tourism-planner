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
請為我生成一個銀色、高級質感、3D風格的虛擬電子登機證設計。

**航班資訊：**
${boardingPassInfo}

**設計要求：**
1. **銀色主色調**：使用金屬銀、亮銀、深銀等銀色系漸變，營造高級質感
2. **3D立體效果**：
   - 使用漸變、陰影、高光效果創造立體感
   - 卡片邊緣要有厚度感和深度
   - 文字要有浮雕或立體陰影效果
   - 添加光澤和反射效果
3. **高級質感**：
   - 奢華、精緻、優雅的設計風格
   - 使用細膩的漸變和過渡
   - 添加微妙的紋理和質感
   - 整體呈現高端商務感
4. **包含所有航班資訊**：清晰、易讀的資訊布局
5. **使用 SVG 格式**：包含所有視覺元素、顏色、字體、布局等
6. **尺寸**：800x400 像素（橫向）
7. **背景**：深色背景（深灰或黑色）搭配銀色主體，形成強烈對比
8. **文字**：使用優雅的字體，配合銀色漸變和立體效果
9. **裝飾元素**：
   - 精緻的邊框和裝飾線條
   - 3D效果的圖標和圖案
   - 光澤和反射效果
   - 高級感的幾何圖形

**視覺效果重點：**
- 銀色金屬質感（使用 linearGradient 創造金屬光澤）
- 3D 陰影效果（drop-shadow、filter）
- 高光點和反射光（白色或淺銀色漸變）
- 立體邊框和卡片效果
- 精緻的細節和裝飾

**輸出格式：**
請直接輸出完整的 SVG 代碼，不要包含任何 Markdown 標記或額外說明。SVG 應該包含：
- 銀色漸變背景和裝飾元素
- 所有航班資訊的文字（帶有3D效果）
- 立體陰影和高光效果
- 清晰的布局和層次
- 高級質感的視覺設計

直接輸出 SVG 代碼即可。
`;
<｜tool▁call▁begin｜>
read_lints

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

