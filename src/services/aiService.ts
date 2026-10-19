import { AIRoomAnalysisResult } from '../types';

/**
 * AI Room Analysis Service
 *
 * 支援三種運行環境：
 * 1. Cloudflare Workers Proxy (免費部署於雲端，前端無需任何 API Key)
 * 2. 本地 Node/Express 伺服器 (/api/analyze-room)
 * 3. 純前端無伺服器模式 (靜態 GitHub Pages 離線手動 3D 建模模式)
 */

export const getCloudflareWorkerUrl = (): string => {
  return (
    localStorage.getItem('roomvibe_worker_url') ||
    import.meta.env.VITE_AI_API_ENDPOINT ||
    ''
  );
};

export const setCloudflareWorkerUrl = (url: string): void => {
  if (!url || url.trim() === '') {
    localStorage.removeItem('roomvibe_worker_url');
  } else {
    localStorage.setItem('roomvibe_worker_url', url.trim());
  }
};

export interface AnalyzeRoomParams {
  images: Array<{ base64: string; mimeType: string }>;
  roomTypeHint?: string;
}

export interface AnalyzeRoomResponse {
  success: boolean;
  isConfigured: boolean;
  message?: string;
  analysis: AIRoomAnalysisResult;
}

// 預設日系北歐離線手動建模資料
export const getOfflineManualAnalysis = (roomTypeHint = '客廳'): AIRoomAnalysisResult => {
  return {
    roomType: roomTypeHint,
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
      '落地採光窗戶與日式柔光紗簾',
      '日系淺橡木地板紋理',
      '開闊起居與沙發視角',
      '天花板 4 盞溫馨柔光崁燈',
    ],
    structuralElements: {
      hasWindow: true,
      windowWall: 'back',
      flooringType: 'wood_light',
    },
    spatialAnalysis:
      '已載入標準比例 3D 日系空間（寬 4.8m × 深 3.8m × 高 2.8m）。目前為手動建模模式，您可隨時手動微調長寬高與建材色系，自由擺放家具。',
    suggestedFurnitures: [
      { name: '日系北歐棉麻三人沙發', category: 'seating', reason: '置於空間舒適觀景側，保持採光動線暢通' },
      { name: '典雅雙層實木圓茶几', category: 'tables', reason: '圓角柔和客廳視覺中心，避免磕碰' },
      { name: '日系格柵低矮電視櫃', category: 'storage', reason: '低矮重心讓挑高顯得更為開闊' },
    ],
  };
};

export async function requestRoomAnalysis(
  params: AnalyzeRoomParams
): Promise<AnalyzeRoomResponse> {
  const workerUrl = getCloudflareWorkerUrl();

  // 若使用者已設定 Cloudflare Worker 網址，優先呼叫 Worker
  if (workerUrl) {
    try {
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Worker 回傳狀態碼: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.analysis) {
        return data as AnalyzeRoomResponse;
      }
    } catch (err: any) {
      console.warn('呼叫 Cloudflare Worker 失敗，降級至手動模式:', err);
      return {
        success: false,
        isConfigured: true,
        message: `Cloudflare Worker 連線失敗（${err.message || '連線逾時'}），已切換至手動 3D 空間建模模式。`,
        analysis: getOfflineManualAnalysis(params.roomTypeHint),
      };
    }
  }

  // 嘗試呼叫本地 Express 伺服器 (若是在本地 dev 環境)
  try {
    const localRes = await fetch('/api/analyze-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (localRes.ok) {
      const localData = await localRes.json();
      if (localData && localData.analysis) {
        return localData as AnalyzeRoomResponse;
      }
    }
  } catch {
    // 忽略本地 404 或連線失敗，直接降級為 GitHub Pages 純前端模式
  }

  // 純前端 / GitHub Pages 模式：自動啟用可立即操作的手動 3D 建模空間
  return {
    success: true,
    isConfigured: false,
    message: '目前為純前端靜態環境，已自動啟用手動 3D 空間建模。若需啟用 AI 分析，可點選上方「設定 Cloudflare Worker 網址」。',
    analysis: getOfflineManualAnalysis(params.roomTypeHint),
  };
}
