import React from 'react';
import {
  Camera,
  Upload,
  Undo2,
  Redo2,
  Download,
  Save,
  Compass,
  Layers,
  Sliders,
  Sparkles,
  Eye,
  Grid3X3,
} from 'lucide-react';
import { Room } from '../../types';

interface HeaderProps {
  room: Room;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  viewMode: 'orbit' | 'top' | 'eye';
  onViewModeChange: (mode: 'orbit' | 'top' | 'eye') => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onOpenUpload: () => void;
  onOpenDimensions: () => void;
  onSave: () => void;
  onExport: () => void;
  onExportProjectJson: () => void;
  onImportProjectJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSaving: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  room,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  viewMode,
  onViewModeChange,
  snapToGrid,
  onToggleSnap,
  onOpenUpload,
  onOpenDimensions,
  onSave,
  onExport,
  onExportProjectJson,
  onImportProjectJson,
  isSaving,
}) => {
  const jsonInputRef = React.useRef<HTMLInputElement>(null);
  return (
    <header className="h-16 bg-[#F7F5F0]/95 backdrop-blur-md border-b border-[#D8C3A5]/40 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 select-none transition-all">
      {/* Brand & Room Info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#87988A] text-white flex items-center justify-center shadow-sm">
          <Compass className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-base sm:text-lg tracking-tight text-[#45413D]">
              RoomVibe
            </h1>
            <span className="hidden md:inline-block text-xs px-2 py-0.5 rounded-full bg-[#D8C3A5]/30 text-[#45413D] font-medium">
              3D 居家設計室
            </span>
            {room.isAIEstimated && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#87988A]/15 text-[#556958] font-medium border border-[#87988A]/25">
                <Sparkles className="w-3 h-3 text-[#87988A]" />
                AI 估計格局
              </span>
            )}
          </div>
          <button
            onClick={onOpenDimensions}
            className="text-xs text-[#45413D]/70 hover:text-[#45413D] flex items-center gap-1 group text-left"
            title="點擊修改房間尺寸"
          >
            <span>
              {room.dimensions.width.toFixed(1)}m × {room.dimensions.length.toFixed(1)}m (高 {room.dimensions.height.toFixed(1)}m)
            </span>
            <Sliders className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      {/* Center View Controls (Perspective / Top-down / Eye-level) */}
      <div className="hidden lg:flex items-center bg-[#EBE5DA] p-1 rounded-xl shadow-inner gap-0.5 border border-[#D8C3A5]/40">
        <button
          onClick={() => onViewModeChange('orbit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'orbit'
              ? 'bg-white text-[#45413D] shadow-sm'
              : 'text-[#45413D]/70 hover:text-[#45413D]'
          }`}
          title="3D 自由視角 (支援滑鼠或觸控旋轉與縮放)"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>3D 自由視角</span>
        </button>

        <button
          onClick={() => onViewModeChange('top')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'top'
              ? 'bg-white text-[#45413D] shadow-sm'
              : 'text-[#45413D]/70 hover:text-[#45413D]'
          }`}
          title="俯視平面視角 (適合觀察整體格局動線)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>俯視平面</span>
        </button>

        <button
          onClick={() => onViewModeChange('eye')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'eye'
              ? 'bg-white text-[#45413D] shadow-sm'
              : 'text-[#45413D]/70 hover:text-[#45413D]'
          }`}
          title="人重視角 (模擬身處室內的真實視野)"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>人重視角</span>
        </button>

        <div className="h-4 w-px bg-[#D8C3A5]/60 mx-1" />

        <button
          onClick={onToggleSnap}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            snapToGrid
              ? 'bg-[#87988A]/20 text-[#556958]'
              : 'text-[#45413D]/60 hover:text-[#45413D]'
          }`}
          title="網格對齊吸附 (10cm 精準對齊)"
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          <span>對齊網格</span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-[#EBE5DA]/70 rounded-xl p-0.5 border border-[#D8C3A5]/40 mr-1 sm:mr-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 sm:p-2 rounded-lg transition-all ${
              canUndo
                ? 'text-[#45413D] hover:bg-white hover:shadow-xs'
                : 'text-[#45413D]/30 cursor-not-allowed'
            }`}
            title="復原上一步 (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 sm:p-2 rounded-lg transition-all ${
              canRedo
                ? 'text-[#45413D] hover:bg-white hover:shadow-xs'
                : 'text-[#45413D]/30 cursor-not-allowed'
            }`}
            title="重做下一步 (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Upload / AI Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#D8C3A5] hover:border-[#87988A] text-[#45413D] text-xs sm:text-sm font-medium shadow-xs hover:shadow-sm transition-all"
        >
          <Camera className="w-4 h-4 text-[#87988A]" />
          <span className="hidden sm:inline">照片辨識</span>
          <span className="sm:hidden">拍照</span>
        </button>

        {/* Hidden JSON file input */}
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={onImportProjectJson}
        />

        {/* Save & Project File Options */}
        <div className="flex items-center gap-1 bg-[#EBE5DA]/70 rounded-xl p-0.5 border border-[#D8C3A5]/40">
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white text-[#45413D] text-xs font-medium transition-all"
            title="儲存至瀏覽器 (LocalStorage)"
          >
            <Save className="w-3.5 h-3.5 text-[#45413D]/70" />
            <span className="hidden md:inline">{isSaving ? '已儲存' : '儲存'}</span>
          </button>
          <button
            onClick={onExportProjectJson}
            className="p-1.5 rounded-lg hover:bg-white text-[#45413D]/70 hover:text-[#45413D] transition-all"
            title="匯出專案檔案 (.json) 離線備份"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => jsonInputRef.current?.click()}
            className="p-1.5 rounded-lg hover:bg-white text-[#45413D]/70 hover:text-[#45413D] transition-all"
            title="匯入專案檔案 (.json)"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Export Image */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#87988A] hover:bg-[#768779] text-white text-xs sm:text-sm font-medium shadow-xs hover:shadow transition-all"
          title="匯出高解析度 3D 模擬圖"
        >
          <Download className="w-4 h-4" />
          <span className="font-semibold">匯出圖片</span>
        </button>
      </div>
    </header>
  );
};
