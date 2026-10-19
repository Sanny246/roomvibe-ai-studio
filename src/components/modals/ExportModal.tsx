import React from 'react';
import { Download, X, Check, Image as ImageIcon, Share2 } from 'lucide-react';
import { Room, PlacedFurniture } from '../../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  room: Room;
  placedFurnitures: PlacedFurniture[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  room,
  placedFurnitures,
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `RoomVibe-設計模擬-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#45413D]/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#F7F5F0] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#D8C3A5]/50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#D8C3A5]/40 flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#87988A]/20 text-[#556958] flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#45413D]">
                匯出 3D 室內模擬圖片
              </h2>
              <p className="text-xs text-[#45413D]/70">
                高解析度 PNG 算圖，隨時儲存或與家人設計師分享
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#D8C3A5]/20 text-[#45413D]/70 hover:text-[#45413D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Render Preview Frame */}
          <div className="relative rounded-2xl overflow-hidden border border-[#D8C3A5]/60 bg-[#EBE5DA] shadow-inner aspect-[16/10] flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="RoomVibe 3D 室內模擬"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-4 text-[#45413D]/60 text-xs">
                正在擷取 3D 算圖畫面...
              </div>
            )}
            <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-[#45413D]/70 text-white text-[10px] font-mono backdrop-blur-xs">
              RoomVibe 3D Studio
            </div>
          </div>

          {/* Design Specs Summary */}
          <div className="grid grid-cols-3 gap-2 bg-white/80 p-3 rounded-xl border border-[#D8C3A5]/40 text-center">
            <div>
              <span className="text-[10px] text-[#45413D]/60 block">空間類型與尺寸</span>
              <span className="text-xs font-semibold text-[#45413D]">
                {room.name || '客廳'} ({room.dimensions.width.toFixed(1)}×{room.dimensions.length.toFixed(1)}m)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#45413D]/60 block">配置家具總數</span>
              <span className="text-xs font-semibold text-[#45413D]">
                {placedFurnitures.length} 件家具
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#45413D]/60 block">風格定義</span>
              <span className="text-xs font-semibold text-[#87988A]">
                Japandi 日系北歐
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#D8C3A5]/40 bg-white/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#45413D]/80 hover:bg-[#D8C3A5]/20 transition-colors"
          >
            關閉
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!imageUrl}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#87988A] hover:bg-[#768779] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>下載 PNG 高清模擬圖</span>
          </button>
        </div>
      </div>
    </div>
  );
};
