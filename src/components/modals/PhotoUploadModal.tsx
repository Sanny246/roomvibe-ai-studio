import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Sliders,
  ChevronRight,
  Eye,
  Settings,
  Link as LinkIcon,
} from 'lucide-react';
import { UploadedPhoto, AIRoomAnalysisResult } from '../../types';
import {
  requestRoomAnalysis,
  getCloudflareWorkerUrl,
  setCloudflareWorkerUrl,
  getOfflineManualAnalysis,
} from '../../services/aiService';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAnalysis: (analysis: AIRoomAnalysisResult) => void;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onApplyAnalysis,
}) => {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [roomTypeHint, setRoomTypeHint] = useState<string>('客廳');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AIRoomAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUsingCamera, setIsUsingCamera] = useState<boolean>(false);
  const [showWorkerConfig, setShowWorkerConfig] = useState<boolean>(false);
  const [workerUrlInput, setWorkerUrlInput] = useState<string>(getCloudflareWorkerUrl());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera on unmount or close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isOpen) return null;

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsUsingCamera(false);
  };

  const startCamera = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsUsingCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.warn('Live camera access failed, falling back to camera file input:', err);
      // Fallback to native mobile camera file capture
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        setErrorMessage('無法直接啟用即時相機，請使用下方「拍照或選擇照片」按鈕');
      }
    }
  };

  const capturePhotoFromStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      const newPhoto: UploadedPhoto = {
        id: `camera-${Date.now()}`,
        name: `現場拍攝-${new Date().toLocaleTimeString('zh-TW', { hour12: false })}.jpg`,
        base64,
        mimeType: 'image/jpeg',
        previewUrl: base64,
        progress: 100,
        status: 'ready',
      };
      setPhotos((prev) => [...prev, newPhoto]);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const id = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Initial entry
      const initialEntry: UploadedPhoto = {
        id,
        name: file.name,
        base64: '',
        mimeType: file.type || 'image/jpeg',
        previewUrl: '',
        progress: 30,
        status: 'uploading',
      };

      setPhotos((prev) => [...prev, initialEntry]);

      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  base64: result,
                  previewUrl: result,
                  progress: 100,
                  status: 'ready',
                }
              : p
          )
        );
      };

      reader.onerror = () => {
        setPhotos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: 'error', progress: 0 } : p))
        );
      };

      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Load Preset Japandi Living Room (reference photo)
  const loadReferencePreset = () => {
    const mockAnalysis: AIRoomAnalysisResult = {
      roomType: '客廳',
      confidence: 'estimated',
      isAIEstimated: true,
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
        '大面積落地採光窗與雙層透光紗簾',
        '頂天立地展示與收納櫃組合（上段透明玻璃酒櫃）',
        '矮型實木電視櫃與壁掛電視',
        '天花板 4 盞嵌入式溫暖柔光崁燈',
        '壁掛冷氣機與開闊生活動線',
      ],
      structuralElements: {
        hasWindow: true,
        windowWall: 'back',
        flooringType: 'wood_light',
      },
      spatialAnalysis:
        '根據日系北歐簡約 (Japandi) 標準空間配置：寬約 4.8 米、深約 3.8 米、挑高 2.8 米。空間特點為大面積自然光線，左側配置高櫃與電視主牆，右側臨窗處預留沙發與休閒單椅，以溫潤木質調凝聚起居核心。',
      suggestedFurnitures: [
        { name: '日系北歐棉麻三人沙發', category: 'seating', reason: '置於臨窗側，享受充足採光' },
        { name: '典雅雙層實木圓茶几', category: 'tables', reason: '圓角柔和動線，搭配羊毛地毯' },
        { name: '日系格柵低矮電視櫃', category: 'storage', reason: '低重心拉開空間通透感' },
        { name: '落地雙門玻璃展示高櫃', category: 'storage', reason: '靠左側牆面延伸縱向展示' },
        { name: '微光弧形黃銅織布落地燈', category: 'lighting', reason: '夜晚營造溫馨起居光氛圍' },
      ],
    };

    setAnalysisResult(mockAnalysis);
  };

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    const readyPhotos = photos.filter((p) => p.status === 'ready');

    try {
      const data = await requestRoomAnalysis({
        images: readyPhotos.map((p) => ({ base64: p.base64, mimeType: p.mimeType })),
        roomTypeHint,
      });

      if (data && data.analysis) {
        setAnalysisResult(data.analysis);
        if (data.message) {
          setErrorMessage(data.message);
        }
      } else {
        throw new Error('未取得空間分析結果');
      }
    } catch (err: any) {
      console.warn('Analysis error:', err);
      setErrorMessage(
        'AI 分析伺服器目前無法連線，已為您自動載入日系北歐手動 3D 空間，您可自由調整尺寸與配置。'
      );
      setAnalysisResult(getOfflineManualAnalysis(roomTypeHint));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartManualMode = () => {
    setAnalysisResult(getOfflineManualAnalysis(roomTypeHint));
    setErrorMessage('已啟用手動 3D 空間設計模式（無需連線外部 AI）');
  };

  const handleSaveWorkerUrl = () => {
    setCloudflareWorkerUrl(workerUrlInput);
    setShowWorkerConfig(false);
  };

  const handleConfirmApply = () => {
    if (analysisResult) {
      onApplyAnalysis(analysisResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#45413D]/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#F7F5F0] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#D8C3A5]/50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#D8C3A5]/40 flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#87988A]/20 text-[#556958] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#45413D]">
                拍照或上傳室內照片
              </h2>
              <p className="text-xs text-[#45413D]/70">
                AI 智慧分析房間格局、尺寸估計與日系北歐建材
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowWorkerConfig((prev) => !prev)}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-all ${
                showWorkerConfig || workerUrlInput
                  ? 'bg-[#87988A]/20 text-[#556958] border border-[#87988A]/30'
                  : 'text-[#45413D]/70 hover:bg-[#D8C3A5]/20'
              }`}
              title="設定 Cloudflare Worker 網址（可選）"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">API 設定</span>
            </button>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-[#D8C3A5]/20 text-[#45413D]/70 hover:text-[#45413D] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cloudflare Worker Setting Dropdown */}
        {showWorkerConfig && (
          <div className="px-5 py-3.5 bg-[#EBE5DA] border-b border-[#D8C3A5]/60 text-xs text-[#45413D] space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#87988A]" />
                Cloudflare Worker API 端點 (GitHub Pages 部署專用)
              </span>
              <span className="text-[10px] text-[#45413D]/60">選填・無需任何 API Key</span>
            </div>
            <p className="text-[11px] text-[#45413D]/70">
              若部署在免費 GitHub Pages，可輸入您部署在 Cloudflare 的 Worker 網址；未設定時會自動啟用完整的手動 3D 空間建模模式。
            </p>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={workerUrlInput}
                onChange={(e) => setWorkerUrlInput(e.target.value)}
                placeholder="https://roomvibe-ai-proxy.yourname.workers.dev"
                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-[#D8C3A5] text-xs text-[#45413D] focus:outline-none focus:border-[#87988A]"
              />
              <button
                type="button"
                onClick={handleSaveWorkerUrl}
                className="px-3 py-1.5 rounded-xl bg-[#87988A] text-white font-medium hover:bg-[#768779] transition-colors"
              >
                儲存網址
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Live Camera View */}
          {isUsingCamera ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 flex items-center gap-3">
                <button
                  onClick={capturePhotoFromStream}
                  className="px-5 py-2.5 rounded-full bg-white text-[#45413D] font-medium text-sm shadow-lg flex items-center gap-2 hover:bg-[#F7F5F0] active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4 text-[#87988A]" />
                  <span>拍攝此視角</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2.5 rounded-full bg-[#45413D]/70 text-white text-xs hover:bg-[#45413D]"
                >
                  取消拍照
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Upload & Camera Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={startCamera}
                  className="group p-4 rounded-2xl border-2 border-dashed border-[#D8C3A5] hover:border-[#87988A] bg-white/60 hover:bg-white flex flex-col items-center justify-center text-center transition-all cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-full bg-[#87988A]/15 text-[#556958] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-[#45413D]">
                    手機相機即時拍照
                  </span>
                  <span className="text-xs text-[#45413D]/60 mt-0.5">
                    拍攝房間多視角、全景或角落
                  </span>
                </button>

                <label className="group p-4 rounded-2xl border-2 border-dashed border-[#D8C3A5] hover:border-[#87988A] bg-white/60 hover:bg-white flex flex-col items-center justify-center text-center transition-all cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/heic,image/webp"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-11 h-11 rounded-full bg-[#D8C3A5]/30 text-[#6B5A46] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-[#45413D]">
                    上傳室內照片 (多張)
                  </span>
                  <span className="text-xs text-[#45413D]/60 mt-0.5">
                    支援 JPG、PNG、HEIC、WebP
                  </span>
                </label>

                {/* Hidden native camera file capture for iOS/Android fallback */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Sample Preset Button */}
              <div className="p-3.5 rounded-xl bg-[#EBE5DA]/60 border border-[#D8C3A5]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#87988A] text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#45413D]">
                      立即體驗：日系北歐實景客廳範例
                    </h4>
                    <p className="text-[11px] text-[#45413D]/70">
                      以採光落地窗、木質地坪、展示高櫃為藍本的完美格局
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={loadReferencePreset}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#D8C3A5] text-[#45413D] text-xs font-medium hover:border-[#87988A] hover:bg-[#F7F5F0] transition-colors self-start sm:self-auto shrink-0 shadow-xs"
                >
                  載入實景範本
                </button>
              </div>
            </>
          )}

          {/* Photo Thumbnails List */}
          {photos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#45413D]">
                  已選取照片 ({photos.length} 張)
                </span>
                <span className="text-[11px] text-[#45413D]/60">
                  建議包含 1-3 張不同角度的照片以提高精準度
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {photos.map((p) => (
                  <div
                    key={p.id}
                    className="relative group rounded-xl overflow-hidden aspect-square border border-[#D8C3A5]/60 bg-white"
                  >
                    {p.previewUrl ? (
                      <img
                        src={p.previewUrl}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#EBE5DA] text-xs text-[#45413D]/60">
                        讀取中...
                      </div>
                    )}
                    <button
                      onClick={() => removePhoto(p.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-90 group-hover:opacity-100 hover:bg-black transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                      <p className="text-[10px] text-white truncate">{p.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#45413D] block">
              空間類型傾向
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['客廳', '臥室', '書房', '起居室'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRoomTypeHint(type)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                    roomTypeHint === type
                      ? 'bg-[#87988A] text-white border-[#87988A] shadow-xs'
                      : 'bg-white text-[#45413D] border-[#D8C3A5]/60 hover:border-[#87988A]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Error / Notice Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#EBE5DA] border border-[#D8C3A5] flex items-start gap-2 text-xs text-[#45413D]">
              <AlertCircle className="w-4 h-4 text-[#87988A] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Analysis Result Card */}
          {analysisResult && (
            <div className="p-4 rounded-2xl bg-white border border-[#D8C3A5] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#87988A]" />
                  <h4 className="text-sm font-semibold text-[#45413D]">
                    房間分析結果 ({analysisResult.roomType})
                  </h4>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#87988A]/15 text-[#556958] font-medium border border-[#87988A]/25">
                  {analysisResult.isAIEstimated ? 'AI 估計值' : '手動預設值'}
                </span>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-2 bg-[#F7F5F0] p-3 rounded-xl text-center">
                <div>
                  <span className="text-[10px] text-[#45413D]/60 block">估計寬度 (X)</span>
                  <span className="text-sm font-semibold text-[#45413D]">
                    {analysisResult.dimensions.width.toFixed(1)} m
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#45413D]/60 block">估計進深 (Z)</span>
                  <span className="text-sm font-semibold text-[#45413D]">
                    {analysisResult.dimensions.length.toFixed(1)} m
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#45413D]/60 block">天花板挑高 (Y)</span>
                  <span className="text-sm font-semibold text-[#45413D]">
                    {analysisResult.dimensions.height.toFixed(1)} m
                  </span>
                </div>
              </div>

              {/* Detected Features */}
              {analysisResult.detectedFeatures?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-[#45413D] block mb-1">
                    偵測到之空間結構：
                  </span>
                  <ul className="text-xs text-[#45413D]/80 space-y-1 list-disc list-inside">
                    {analysisResult.detectedFeatures.map((feat, i) => (
                      <li key={i}>{feat}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Spatial Analysis text */}
              {analysisResult.spatialAnalysis && (
                <p className="text-xs text-[#45413D]/70 bg-[#F7F5F0] p-2.5 rounded-lg leading-relaxed">
                  {analysisResult.spatialAnalysis}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#D8C3A5]/40 bg-white/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#45413D]/80 hover:bg-[#D8C3A5]/20 transition-colors"
          >
            關閉
          </button>

          <div className="flex items-center gap-2">
            {!analysisResult ? (
              <>
                <button
                  type="button"
                  onClick={handleStartManualMode}
                  className="px-3.5 py-2.5 rounded-xl border border-[#D8C3A5] bg-white hover:bg-[#F7F5F0] text-[#45413D] text-xs sm:text-sm font-medium transition-all"
                  title="不經由 AI，直接以日系北歐標準比例手動建立"
                >
                  直接手動建立
                </button>
                <button
                  type="button"
                  disabled={isAnalyzing || (photos.length === 0 && !analysisResult)}
                  onClick={handleStartAnalysis}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all ${
                    isAnalyzing || (photos.length === 0 && !analysisResult)
                      ? 'bg-[#D8C3A5] text-white/70 cursor-not-allowed'
                      : 'bg-[#87988A] hover:bg-[#768779] text-white hover:shadow'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini AI 分析中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>開始 AI 分析</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConfirmApply}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#87988A] hover:bg-[#768779] text-white shadow-xs hover:shadow transition-all"
              >
                <span>套用並建立 3D 空間</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
