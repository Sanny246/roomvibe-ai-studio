import React from 'react';
import { Camera, Sparkles, ArrowRight, Compass, ShieldCheck, Box } from 'lucide-react';

interface LandingHeroProps {
  onStartWithPreset: () => void;
  onOpenUpload: () => void;
  onStartBlank: () => void;
  onCloseHero: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartWithPreset,
  onOpenUpload,
  onStartBlank,
  onCloseHero,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-[#F7F5F0]/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full text-center space-y-6 sm:space-y-8 py-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBE5DA] border border-[#D8C3A5]/60 shadow-2xs">
          <Sparkles className="w-4 h-4 text-[#87988A]" />
          <span className="text-xs font-semibold text-[#45413D] tracking-wide">
            Japandi 日系北歐｜AI 輔助 3D 空間模擬室
          </span>
        </div>

        {/* Hero Title */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#45413D] leading-tight">
            將家中的照片，轉化為
            <span className="text-[#87988A] block sm:inline sm:ml-2">
              可互動的 3D 空間
            </span>
          </h1>
          <p className="text-sm sm:text-base text-[#45413D]/75 max-w-lg mx-auto font-normal leading-relaxed">
            透過手機拍照或上傳室內照片，AI 智慧辨識格局與長寬高。自由挑選日系北歐家具、拖曳擺放、切換俯視與自由角度，模擬心中理想居所。
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-4 rounded-2xl bg-white/80 border border-[#D8C3A5]/50 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#87988A]/15 text-[#556958] flex items-center justify-center mb-2">
              <Camera className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-[#45413D]">
              照片結構測量
            </h4>
            <p className="text-[11px] text-[#45413D]/65 mt-0.5">
              後端 Gemini API 智慧估算房間寬度、進深與採光
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-[#D8C3A5]/50 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#D8C3A5]/30 text-[#6B5A46] flex items-center justify-center mb-2">
              <Compass className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-[#45413D]">
              真 3D 空間互動
            </h4>
            <p className="text-[11px] text-[#45413D]/65 mt-0.5">
              WebGL 自由旋轉視角、俯視平面與人重視角流暢切換
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-[#D8C3A5]/50 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#87988A]/15 text-[#556958] flex items-center justify-center mb-2">
              <Box className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-[#45413D]">
              日系北歐家具庫
            </h4>
            <p className="text-[11px] text-[#45413D]/65 mt-0.5">
              沙發、實木茶几、格柵矮櫃與展示高櫃，自由拖曳擺放
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              onStartWithPreset();
              onCloseHero();
            }}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-[#87988A] hover:bg-[#768779] text-white text-sm font-semibold shadow-sm hover:shadow flex items-center justify-center gap-2 group transition-all"
          >
            <span>載入實景範本開始設計</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => {
              onOpenUpload();
              onCloseHero();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white border border-[#D8C3A5] hover:border-[#87988A] text-[#45413D] text-sm font-medium shadow-xs flex items-center justify-center gap-2 hover:bg-[#F7F5F0] transition-all"
          >
            <Camera className="w-4 h-4 text-[#87988A]" />
            <span>拍照或上傳自家照片</span>
          </button>

          <button
            onClick={() => {
              onStartBlank();
              onCloseHero();
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-medium text-[#45413D]/70 hover:text-[#45413D] transition-colors"
          >
            空白房間起步
          </button>
        </div>
      </div>
    </div>
  );
};
