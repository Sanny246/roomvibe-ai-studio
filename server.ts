import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Support JSON body payload up to 50MB for uploaded images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// AI Room Structure Analysis endpoint
app.post('/api/analyze-room', async (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const { images, roomTypeHint } = req.body as {
    images?: Array<{ base64: string; mimeType: string }>;
    roomTypeHint?: string;
  };

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(200).json({
      success: false,
      isConfigured: false,
      message: '伺服器端尚未設定有效的 GEMINI_API_KEY。已自動啟用智慧手動建模與預設日系北歐格局。',
      analysis: {
        roomType: roomTypeHint || '客廳',
        confidence: 'estimated',
        isAIEstimated: false,
        dimensions: {
          width: 4.8,
          length: 3.8,
          height: 2.8,
        },
        colorPalette: {
          wall: '#F4F1EA',
          floor: '#DFD2C2',
          accent: '#87988A',
        },
        detectedFeatures: [
          '大面積自然採光落地窗（搭配米白色紗簾）',
          '頂天立地展示與收納櫃組合',
          '矮型電視櫃與低動線茶几配置',
          '溫和柔光天花板崁燈',
        ],
        structuralElements: {
          hasWindow: true,
          windowWall: 'back',
          flooringType: 'wood_light',
        },
        spatialAnalysis:
          '根據日系北歐 (Japandi) 風格標準格局估算，此空間寬約 4.8 米、深約 3.8 米，挑高約 2.8 米。採光主要來自後方落地窗，右側適合配置主沙發與邊几，左側適合頂天立地收納系統與電視矮櫃，中央保留足夠動線留白。',
        suggestedFurnitures: [
          { name: '日系北歐棉麻三人沙發', category: 'seating', reason: '置於空間舒適觀景側，保持採光動線暢通' },
          { name: '典雅圓形雙層木質茶几', category: 'tables', reason: '圓角柔和客廳視覺中心，避免磕碰' },
          { name: '日系格柵電視矮櫃', category: 'storage', reason: '低矮重心讓挑高顯得更為開闊' },
          { name: '落地雙門玻璃展示高櫃', category: 'storage', reason: '靠左側牆面延伸縱向收納與質感擺飾' },
          { name: '現代暖光弧形落地燈', category: 'lighting', reason: '角落點綴溫馨氛圍光源' },
          { name: '羊毛編織幾何地毯', category: 'decor', reason: '劃分客廳交誼場域，提供赤足溫潤感' },
        ],
      },
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parts: any[] = [];

    if (images && images.length > 0) {
      for (const img of images) {
        // Strip data url prefix if present
        let cleanBase64 = img.base64;
        if (cleanBase64.includes('base64,')) {
          cleanBase64 = cleanBase64.split('base64,')[1];
        }
        parts.push({
          inlineData: {
            mimeType: img.mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }
    }

    const promptText = `你是一位專業的日本與北歐簡約風格 (Japandi) 室內空間建築師與 3D 空間建模工程師。
請詳細分析上傳的室內空間照片，解析房間結構，估算房間尺寸（公尺，寬度、長度/深度、天花板高度），並分析主要建材顏色、採光窗戶位置、已有結構特色，以及家具配置建議。

${roomTypeHint ? `使用者指定的空間類型傾向：${roomTypeHint}` : ''}

請務必嚴格輸出純 JSON 格式，格式如下：
{
  "roomType": "客廳" | "臥室" | "書房" | "多功能起居室",
  "confidence": "high" | "medium" | "estimated",
  "isAIEstimated": true,
  "dimensions": {
    "width": 4.8,
    "length": 3.8,
    "height": 2.8
  },
  "colorPalette": {
    "wall": "#F4F1EA",
    "floor": "#DFD2C2",
    "accent": "#87988A"
  },
  "detectedFeatures": [
    "特色1",
    "特色2",
    "特色3"
  ],
  "structuralElements": {
    "hasWindow": true,
    "windowWall": "back" | "right" | "left",
    "flooringType": "wood_light" | "tile_cream" | "wood_warm"
  },
  "spatialAnalysis": "100-200字的專業空間佈局、採光與動線評述（繁體中文）",
  "suggestedFurnitures": [
    {
      "name": "家具名稱",
      "category": "seating" | "tables" | "storage" | "beds" | "lighting" | "decor",
      "reason": "擺放考量與位置建議"
    }
  ]
}

注意事項：
1. 尺寸均以公尺 (m) 為單位，合理範圍：寬度 2.5~7.0m，長度 2.5~7.0m，天花板高度 2.4~3.6m。
2. 色碼請給出精準的 6 碼 Hex（例如奶油米白 #F4F1EA、淺橡木 #DFD2C2）。
3. 所有文字皆使用繁體中文。`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: parts.length === 1 ? parts[0].text : { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '';
    let parsedData: any;
    try {
      parsedData = JSON.parse(rawText.trim());
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        throw new Error('無法解析 Gemini 模型回傳的 JSON');
      }
    }

    return res.json({
      success: true,
      isConfigured: true,
      analysis: {
        ...parsedData,
        isAIEstimated: true,
      },
    });
  } catch (error: any) {
    console.error('Gemini Room Analysis Error:', error);
    return res.status(200).json({
      success: false,
      isConfigured: true,
      message: `AI 分析遭遇問題（${error?.message || '辨識逾時'}），已為您載入智慧預測的日系北歐客廳 3D 結構，您可隨時手動修正長寬高。`,
      analysis: {
        roomType: roomTypeHint || '客廳',
        confidence: 'estimated',
        isAIEstimated: false,
        dimensions: {
          width: 4.8,
          length: 3.8,
          height: 2.8,
        },
        colorPalette: {
          wall: '#F4F1EA',
          floor: '#DFD2C2',
          accent: '#87988A',
        },
        detectedFeatures: [
          '落地採光窗戶與紗簾',
          '日式無印風格淡雅木質地板',
          '開闊方形生活動線',
        ],
        structuralElements: {
          hasWindow: true,
          windowWall: 'back',
          flooringType: 'wood_light',
        },
        spatialAnalysis:
          '此空間擁有良好的進深與日照條件，建議以低重心、簡潔線條家具為主，保持通透感並預留寬裕的起居活動走道。',
        suggestedFurnitures: [
          { name: '日系北歐棉麻三人沙發', category: 'seating', reason: '置於空間舒適觀景側，保持採光動線暢通' },
          { name: '典雅圓形雙層木質茶几', category: 'tables', reason: '圓角柔和客廳視覺中心，避免磕碰' },
          { name: '日系格柵電視矮櫃', category: 'storage', reason: '低矮重心讓挑高顯得更為開闊' },
        ],
      },
    });
  }
});

// Setup Vite middleware in dev or static server in prod
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[RoomVibe Server] Running at http://localhost:${port} in ${isProd ? 'production' : 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('[RoomVibe Server] Failed to start:', err);
  process.exit(1);
});
