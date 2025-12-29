import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 支援的檔案類型
const SUPPORTED_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/jpg': 'image',
  'image/webp': 'image',
  'text/plain': 'text',
  'text/markdown': 'text',
  'application/json': 'text',
} as const;

// 使用 Gemini 解析 PDF（Gemini 1.5+ 支援 PDF）
async function parsePDFWithGemini(pdfBase64: string, apiKey: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // 使用支援 PDF 的模型
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // 移除 data URL 前綴（如果有的話）
    const base64Data = pdfBase64.includes(',') 
      ? pdfBase64.split(',')[1] 
      : pdfBase64;
    
    const result = await model.generateContent([
      '請仔細閱讀這份旅遊相關 PDF 文件，提取所有有用的資訊，包括：',
      '1. 目的地、城市、國家',
      '2. 景點、餐廳、商店名稱',
      '3. 推薦的活動、行程建議',
      '4. 預算、費用資訊',
      '5. 時間安排、日期',
      '6. 任何其他旅遊相關資訊',
      '',
      '請以結構化的方式整理這些資訊，方便後續用於行程規劃。',
      {
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf', // 正確的 PDF MIME type
        },
      },
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('PDF 解析錯誤:', error);
    
    // 如果 PDF 解析失敗，嘗試使用文字提取作為後備
    if (error.message?.includes('Unable to process input') || error.message?.includes('400')) {
      throw new Error(`PDF 解析失敗：此 PDF 可能不包含可讀取的文字內容，或格式不支援。建議使用包含文字的 PDF 文件，或將 PDF 轉換為圖片後上傳。\n\n錯誤詳情：${error.message}`);
    }
    
    throw new Error(`PDF 解析失敗: ${error.message}`);
  }
}

// 使用 Gemini 解析圖片（OCR + 內容理解）
async function parseImageWithGemini(imageBase64: string, apiKey: string, mimeType: string = 'image/png'): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // 移除 data URL 前綴（如果有的話）
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;
    
    // 從 data URL 中提取 MIME type（如果有的話）
    let actualMimeType = mimeType;
    if (imageBase64.startsWith('data:')) {
      const mimeMatch = imageBase64.match(/data:([^;]+)/);
      if (mimeMatch && mimeMatch[1]) {
        actualMimeType = mimeMatch[1];
      }
    }
    
    const result = await model.generateContent([
      '請仔細閱讀這張旅遊相關圖片，提取所有有用的資訊，包括：',
      '1. 目的地、城市、國家',
      '2. 景點、餐廳、商店名稱',
      '3. 推薦的活動、行程建議',
      '4. 預算、費用資訊',
      '5. 時間安排、日期',
      '6. 任何其他旅遊相關資訊',
      '',
      '請以結構化的方式整理這些資訊，方便後續用於行程規劃。',
      {
        inlineData: {
          data: base64Data,
          mimeType: actualMimeType,
        },
      },
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('圖片解析錯誤:', error);
    throw new Error(`圖片解析失敗: ${error.message}`);
  }
}

// 解析文字檔
async function parseTextFile(text: string): Promise<string> {
  // 文字檔直接返回，後續會進行分塊處理
  return text;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userApiKey = formData.get('userApiKey') as string;

    if (!file) {
      return NextResponse.json(
        { error: '未提供檔案' },
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

    const fileType = file.type;
    const supportedType = SUPPORTED_TYPES[fileType as keyof typeof SUPPORTED_TYPES];

    if (!supportedType) {
      return NextResponse.json(
        { 
          error: '不支援的檔案類型',
          details: `支援的檔案類型：PDF、圖片（JPEG/PNG/WEBP）、文字檔（TXT/MD/JSON）`,
        },
        { status: 400 }
      );
    }

    // 讀取檔案內容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${fileType};base64,${base64}`;

    let extractedText = '';

    // 根據檔案類型解析
    if (supportedType === 'pdf') {
      // PDF 解析（使用 Gemini 1.5+ 的 PDF 支援）
      extractedText = await parsePDFWithGemini(dataUrl, userApiKey);
    } else if (supportedType === 'image') {
      // 圖片解析（OCR + 內容理解）
      extractedText = await parseImageWithGemini(dataUrl, userApiKey, fileType);
    } else if (supportedType === 'text') {
      const text = buffer.toString('utf-8');
      extractedText = await parseTextFile(text);
    }

    // 將文字分塊（用於後續 RAG 檢索）
    const chunks = chunkText(extractedText, 500); // 每塊約 500 字元

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType: supportedType,
      extractedText,
      chunks,
      chunkCount: chunks.length,
    });

  } catch (error: any) {
    console.error('檔案上傳錯誤:', error);
    return NextResponse.json(
      { 
        error: '檔案處理失敗',
        details: error.message || '未知錯誤',
      },
      { status: 500 }
    );
  }
}

// 將文字分塊（用於 RAG）
function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[。！？\n]/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence + '。';
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [text]; // 如果沒有分塊，返回原文
}

