import React from 'react';
import {
  RotateCw,
  RotateCcw,
  Copy,
  Trash2,
  X,
  Maximize2,
  Sliders,
  Palette,
  Move,
} from 'lucide-react';
import { PlacedFurniture } from '../../types';

interface FurnitureInspectorProps {
  furniture: PlacedFurniture | null;
  onUpdateRotation: (instanceId: string, angleDeltaRad: number) => void;
  onSetRotationDeg: (instanceId: string, deg: number) => void;
  onUpdateScale: (instanceId: string, scaleFactor: number) => void;
  onUpdateColor: (instanceId: string, hexColor: string) => void;
  onDuplicate: (instanceId: string) => void;
  onDelete: (instanceId: string) => void;
  onClose: () => void;
}

const COLOR_SWATCHES = [
  { label: '自然米白', hex: '#F4F1EA' },
  { label: '淺灰棉麻', hex: '#E0DDD5' },
  { label: '淺橡木', hex: '#D8C3A5' },
  { label: '暖白木', hex: '#EDE6DB' },
  { label: '鼠尾草綠', hex: '#87988A' },
  { label: '沈穩深灰', hex: '#45413D' },
];

export const FurnitureInspector: React.FC<FurnitureInspectorProps> = ({
  furniture,
  onUpdateRotation,
  onSetRotationDeg,
  onUpdateScale,
  onUpdateColor,
  onDuplicate,
  onDelete,
  onClose,
}) => {
  if (!furniture) return null;

  const currentDeg = Math.round(((furniture.rotation * 180) / Math.PI) % 360);
  const normalizedDeg = currentDeg < 0 ? currentDeg + 360 : currentDeg;
  const currentScale = Math.round(furniture.scale[0] * 100);

  return (
    <div className="fixed top-20 right-3 sm:right-6 z-30 w-72 sm:w-80 bg-[#F7F5F0]/95 backdrop-blur-md rounded-2xl border border-[#D8C3A5]/60 shadow-xl p-4 space-y-3.5 select-none animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Title & Close */}
      <div className="flex items-center justify-between border-b border-[#D8C3A5]/40 pb-2.5">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#87988A] tracking-wider block">
            已選取家具
          </span>
          <h4 className="text-sm font-semibold text-[#45413D] truncate max-w-[200px]">
            {furniture.name}
          </h4>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[#D8C3A5]/20 text-[#45413D]/60 hover:text-[#45413D] transition-colors"
          title="關閉選單"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Dimensions specs */}
      <div className="text-xs text-[#45413D]/70 bg-white/70 p-2.5 rounded-xl border border-[#D8C3A5]/40 flex items-center justify-between">
        <span>實際規格</span>
        <span className="font-semibold text-[#45413D]">
          寬 {furniture.dimensions.width.toFixed(2)}m × 深 {furniture.dimensions.depth.toFixed(2)}m × 高 {furniture.dimensions.height.toFixed(2)}m
        </span>
      </div>

      {/* Rotation Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#45413D] flex items-center gap-1.5">
            <RotateCw className="w-3.5 h-3.5 text-[#87988A]" />
            旋轉角度
          </span>
          <span className="font-semibold text-[#45413D]">{normalizedDeg}°</span>
        </div>

        {/* Quick rotation buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => onUpdateRotation(furniture.instanceId, -Math.PI / 4)}
            className="py-1.5 rounded-lg bg-white border border-[#D8C3A5]/60 hover:border-[#87988A] text-xs font-medium text-[#45413D] shadow-2xs"
            title="逆時針轉 45 度"
          >
            -45°
          </button>
          <button
            onClick={() => onUpdateRotation(furniture.instanceId, Math.PI / 4)}
            className="py-1.5 rounded-lg bg-white border border-[#D8C3A5]/60 hover:border-[#87988A] text-xs font-medium text-[#45413D] shadow-2xs"
            title="順時針轉 45 度"
          >
            +45°
          </button>
          <button
            onClick={() => onUpdateRotation(furniture.instanceId, Math.PI / 2)}
            className="py-1.5 rounded-lg bg-white border border-[#D8C3A5]/60 hover:border-[#87988A] text-xs font-medium text-[#45413D] shadow-2xs"
            title="轉 90 度"
          >
            90°
          </button>
          <button
            onClick={() => onUpdateRotation(furniture.instanceId, Math.PI)}
            className="py-1.5 rounded-lg bg-white border border-[#D8C3A5]/60 hover:border-[#87988A] text-xs font-medium text-[#45413D] shadow-2xs"
            title="調轉 180 度"
          >
            180°
          </button>
        </div>

        {/* Rotation Slider */}
        <input
          type="range"
          min="0"
          max="360"
          step="5"
          value={normalizedDeg}
          onChange={(e) => onSetRotationDeg(furniture.instanceId, parseFloat(e.target.value))}
          className="w-full accent-[#87988A] cursor-pointer"
        />
      </div>

      {/* Scale Control */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#45413D] flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-[#87988A]" />
            等比縮放
          </span>
          <span className="font-semibold text-[#45413D]">{currentScale}%</span>
        </div>
        <input
          type="range"
          min="0.7"
          max="1.4"
          step="0.05"
          value={furniture.scale[0]}
          onChange={(e) => onUpdateScale(furniture.instanceId, parseFloat(e.target.value))}
          className="w-full accent-[#87988A] cursor-pointer"
        />
      </div>

      {/* Color Customizer */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-[#45413D] flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[#87988A]" />
          更換面料/原木色系
        </span>
        <div className="flex items-center gap-2 pt-0.5">
          {COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch.hex}
              onClick={() => onUpdateColor(furniture.instanceId, swatch.hex)}
              className="w-7 h-7 rounded-full border-2 border-white shadow-xs hover:scale-110 transition-transform relative"
              style={{ backgroundColor: swatch.hex }}
              title={swatch.label}
            >
              {furniture.customColor === swatch.hex && (
                <span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white shadow-xs" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons: Duplicate & Delete */}
      <div className="pt-2 border-t border-[#D8C3A5]/40 grid grid-cols-2 gap-2">
        <button
          onClick={() => onDuplicate(furniture.instanceId)}
          className="py-2 px-3 rounded-xl bg-white border border-[#D8C3A5] hover:border-[#87988A] text-xs font-medium text-[#45413D] flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all"
        >
          <Copy className="w-3.5 h-3.5 text-[#87988A]" />
          <span>複製家具</span>
        </button>

        <button
          onClick={() => onDelete(furniture.instanceId)}
          className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-medium text-red-600 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>刪除家具</span>
        </button>
      </div>
    </div>
  );
};
