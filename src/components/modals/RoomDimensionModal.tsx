import React, { useState } from 'react';
import { Sliders, X, Sparkles, Check, Palette } from 'lucide-react';
import { Room, RoomDimensions } from '../../types';

interface RoomDimensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onUpdateRoom: (updatedRoom: Partial<Room>) => void;
}

const WALL_COLORS = [
  { label: '日系奶油白', hex: '#F4F1EA' },
  { label: '柔和米杏色', hex: '#EBE5D8' },
  { label: '淺暖灰抹灰', hex: '#E2DED6' },
  { label: '純淨暖白', hex: '#FAF9F6' },
  { label: '鼠尾草淺灰綠', hex: '#DFE5DF' },
];

const FLOOR_COLORS = [
  { label: '日式淺橡木', hex: '#DFD2C2' },
  { label: '溫潤白蠟木', hex: '#E8DEC8' },
  { label: '原木原色', hex: '#D5BE9E' },
  { label: '微水泥米磚', hex: '#EAE5DB' },
];

export const RoomDimensionModal: React.FC<RoomDimensionModalProps> = ({
  isOpen,
  onClose,
  room,
  onUpdateRoom,
}) => {
  const [dimensions, setDimensions] = useState<RoomDimensions>(room.dimensions);
  const [wallColor, setWallColor] = useState<string>(room.wallColor);
  const [floorColor, setFloorColor] = useState<string>(room.floorColor);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateRoom({
      dimensions,
      wallColor,
      floorColor,
      isAIEstimated: false, // User manually confirmed/refined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#45413D]/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#F7F5F0] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#D8C3A5]/50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#D8C3A5]/40 flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#87988A]/20 text-[#556958] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#45413D]">
                修正房間尺寸與建材
              </h2>
              <p className="text-xs text-[#45413D]/70">
                可輸入真實雷射測距或現場尺吋進行校正
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

        {/* Form Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Estimated Banner */}
          {room.isAIEstimated && (
            <div className="p-3 rounded-xl bg-[#EBE5DA] border border-[#D8C3A5]/60 flex items-center gap-2 text-xs text-[#45413D]">
              <Sparkles className="w-4 h-4 text-[#87988A] shrink-0" />
              <span>當前數值為 AI 照片估計值。您可拖曳下方滑桿微調為家中實際尺吋。</span>
            </div>
          )}

          {/* Width (X) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-[#45413D]">
                房間寬度 (左右橫寬)
              </label>
              <div className="flex items-center gap-1 font-semibold text-[#45413D]">
                <input
                  type="number"
                  step="0.1"
                  min="2.0"
                  max="12.0"
                  value={dimensions.width}
                  onChange={(e) =>
                    setDimensions((prev) => ({ ...prev, width: parseFloat(e.target.value) || 2.0 }))
                  }
                  className="w-16 px-2 py-0.5 rounded border border-[#D8C3A5] bg-white text-right text-xs"
                />
                <span>m</span>
              </div>
            </div>
            <input
              type="range"
              min="2.0"
              max="10.0"
              step="0.1"
              value={dimensions.width}
              onChange={(e) =>
                setDimensions((prev) => ({ ...prev, width: parseFloat(e.target.value) }))
              }
              className="w-full accent-[#87988A] cursor-pointer"
            />
          </div>

          {/* Length (Z) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-[#45413D]">
                房間深度 (前後進深)
              </label>
              <div className="flex items-center gap-1 font-semibold text-[#45413D]">
                <input
                  type="number"
                  step="0.1"
                  min="2.0"
                  max="12.0"
                  value={dimensions.length}
                  onChange={(e) =>
                    setDimensions((prev) => ({ ...prev, length: parseFloat(e.target.value) || 2.0 }))
                  }
                  className="w-16 px-2 py-0.5 rounded border border-[#D8C3A5] bg-white text-right text-xs"
                />
                <span>m</span>
              </div>
            </div>
            <input
              type="range"
              min="2.0"
              max="10.0"
              step="0.1"
              value={dimensions.length}
              onChange={(e) =>
                setDimensions((prev) => ({ ...prev, length: parseFloat(e.target.value) }))
              }
              className="w-full accent-[#87988A] cursor-pointer"
            />
          </div>

          {/* Height (Y) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-[#45413D]">
                天花板挑高 (樓高)
              </label>
              <div className="flex items-center gap-1 font-semibold text-[#45413D]">
                <input
                  type="number"
                  step="0.1"
                  min="2.2"
                  max="4.5"
                  value={dimensions.height}
                  onChange={(e) =>
                    setDimensions((prev) => ({ ...prev, height: parseFloat(e.target.value) || 2.2 }))
                  }
                  className="w-16 px-2 py-0.5 rounded border border-[#D8C3A5] bg-white text-right text-xs"
                />
                <span>m</span>
              </div>
            </div>
            <input
              type="range"
              min="2.2"
              max="4.0"
              step="0.1"
              value={dimensions.height}
              onChange={(e) =>
                setDimensions((prev) => ({ ...prev, height: parseFloat(e.target.value) }))
              }
              className="w-full accent-[#87988A] cursor-pointer"
            />
          </div>

          {/* Wall Paint Swatches */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#45413D] block">
              牆面塗料色彩 (日系柔和米白)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {WALL_COLORS.map((w) => (
                <button
                  key={w.hex}
                  type="button"
                  onClick={() => setWallColor(w.hex)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                    wallColor === w.hex
                      ? 'border-[#87988A] bg-white ring-2 ring-[#87988A]/30'
                      : 'border-[#D8C3A5]/50 bg-white/70 hover:bg-white'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                    style={{ backgroundColor: w.hex }}
                  />
                  <span className="text-[11px] text-[#45413D] font-medium truncate">
                    {w.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Floor Material Swatches */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#45413D] block">
              地面材質色調 (木質地板)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FLOOR_COLORS.map((f) => (
                <button
                  key={f.hex}
                  type="button"
                  onClick={() => setFloorColor(f.hex)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                    floorColor === f.hex
                      ? 'border-[#87988A] bg-white ring-2 ring-[#87988A]/30'
                      : 'border-[#D8C3A5]/50 bg-white/70 hover:bg-white'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                    style={{ backgroundColor: f.hex }}
                  />
                  <span className="text-[11px] text-[#45413D] font-medium truncate">
                    {f.label}
                  </span>
                </button>
              ))}
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
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#87988A] hover:bg-[#768779] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all"
          >
            <Check className="w-4 h-4" />
            <span>儲存並更新 3D 空間</span>
          </button>
        </div>
      </div>
    </div>
  );
};
