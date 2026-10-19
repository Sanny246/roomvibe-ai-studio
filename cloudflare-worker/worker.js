/**
 * RoomVibe - Cloudflare Worker Gemini AI Proxy
 *
 * 專為 GitHub Pages 免費靜態站點設計的伺服器端中繼器。
 * 作用：將使用者上傳的照片轉發給 Gemini API，並回傳結構化空間長寬高與格局建議。
 * 安全性：Gemini API Key 儲存於 Cloudflare Secrets，絕不暴露於前端或 GitHub 原始碼中。
 */

export default {
  async fetch(request, env) {
    // 處理 CORS 預檢請求 (Preflight)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'RoomVibe Cloudflare Worker Proxy',
          hasKeyConfigured: Boolean(env.GEMINI_API_KEY),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: '僅支援 POST 請求' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 檢查 Cloudflare Secret 是否已設定
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          isConfigured: false,
          message: 'Cloudflare Worker 尚未綁定 GEMINI_API_KEY 密鑰，已切換至手動空間模式。',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      const body = await request.json();
      const { images, roomTypeHint } = body;

      const contents = [];

      // 組合圖片 parts
      if (images && Array.isArray(images) && images.length > 0) {
        for (const img of images) {
          let cleanBase64 = img.base64 || '';
          if (cleanBase64.includes('base64,')) {
            cleanBase64 = cleanBase64.split('base64,')[1];
          }
          contents.push({
            inlineData: {
              mimeType: img.mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          });
        }
      }

      // 繁體中文結構提示詞
      const promptText = `你是一位專業的日系北歐 (Japandi) 室內空間建築師與 3D 空間建模工程師。
請詳細分析上傳的室內空間照片，解析房間結構，估算房間尺寸（公尺，寬度、長度/深度、天花板高度），並分析主要建材顏色、採光窗戶位置、已有結構特色，以及家具配置建議。

${roomTypeHint ? `使用者指定的空間類型傾向：${roomTypeHint}` : ''}

請務必嚴格輸出純 JSON 格式，不得包含任何 Markdown 代碼塊或額外問候語：
{
  "roomType": "客廳",
  "confidence": "high",
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
    "特色2"
  ],
  "structuralElements": {
    "hasWindow": true,
    "windowWall": "back",
    "flooringType": "wood_light"
  },
  "spatialAnalysis": "100-200字的專業空間佈局、採光與動線評述（繁體中文）",
  "suggestedFurnitures": [
    {
      "name": "家具名稱",
      "category": "seating",
      "reason": "擺放考量與位置建議"
    }
  ]
}`;

      contents.push({ text: promptText });

      // 調用 Google Gemini REST API (gemini-3.8-flash)
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'aistudio-build',
        },
        body: JSON.stringify({
          contents: [{ parts: contents }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        throw new Error(`Gemini API 回傳錯誤 (${geminiResponse.status}): ${errorText}`);
      }

      const result = await geminiResponse.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      let parsedData;
      try {
        parsedData = JSON.parse(rawText.trim());
      } catch {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          parsedData = JSON.parse(match[0]);
        } else {
          throw new Error('無法解析模型回傳之 JSON 內容');
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          isConfigured: true,
          analysis: {
            ...parsedData,
            isAIEstimated: true,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          success: false,
          isConfigured: true,
          message: err.message || '分析處理失敗',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
