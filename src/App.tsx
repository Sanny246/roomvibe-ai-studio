import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Room,
  Furniture,
  PlacedFurniture,
  AIRoomAnalysisResult,
  DesignProject,
} from './types';
import { FURNITURE_CATALOG } from './data/furnitures';
import { RoomCanvas } from './components/canvas/RoomCanvas';
import { Header } from './components/ui/Header';
import { FurnitureCatalogDrawer } from './components/ui/FurnitureCatalogDrawer';
import { FurnitureInspector } from './components/ui/FurnitureInspector';
import { PhotoUploadModal } from './components/modals/PhotoUploadModal';
import { RoomDimensionModal } from './components/modals/RoomDimensionModal';
import { ExportModal } from './components/modals/ExportModal';
import { LandingHero } from './components/ui/LandingHero';
import { Check, Sparkles, AlertCircle, Compass, HelpCircle } from 'lucide-react';

// Initial default room modeled after user reference photo (Japandi Living Room)
const DEFAULT_ROOM: Room = {
  id: 'room-japandi-default',
  name: '日系北歐生活客廳',
  dimensions: {
    width: 4.8,
    length: 3.8,
    height: 2.8,
  },
  wallColor: '#F4F1EA',
  floorColor: '#DFD2C2',
  floorTextureType: 'wood_light',
  hasWindow: true,
  windowWall: 'right',
  isAIEstimated: true,
  confidence: 'high',
  detectedFeatures: [
    '大面積落地窗附柔光透白雙層紗簾',
    '頂天立地實木與玻璃展示收納櫃',
    '低重心實木電視矮櫃',
    '溫馨嵌入式天花板崁燈 4 盞',
  ],
  spatialAnalysis:
    '此空間寬約 4.8 米、進深約 3.8 米，右側臨窗處配置舒適沙發與雙層圓茶几，左側安排收納高櫃與電視牆，動線流暢通透。',
};

// Preset furniture placement matching the reference photo
const PRESET_FURNITURES: PlacedFurniture[] = [
  {
    instanceId: 'inst-sofa-1',
    furnitureId: 'sofa-nordic-linen',
    name: '日系北歐棉麻三人沙發',
    category: 'seating',
    modelType: 'sofa_linen',
    position: [0.95, 0, 0.45],
    rotation: -Math.PI / 2, // Facing left toward TV wall
    scale: [1, 1, 1],
    dimensions: { width: 2.1, depth: 0.85, height: 0.78 },
  },
  {
    instanceId: 'inst-table-1',
    furnitureId: 'table-round-coffee',
    name: '典雅雙層實木圓茶几',
    category: 'tables',
    modelType: 'table_round_coffee',
    position: [0.15, 0, 0.45],
    rotation: 0,
    scale: [1, 1, 1],
    dimensions: { width: 0.85, depth: 0.85, height: 0.42 },
  },
  {
    instanceId: 'inst-tv-console-1',
    furnitureId: 'storage-tv-console',
    name: '日系格柵低矮電視櫃',
    category: 'storage',
    modelType: 'tv_console',
    position: [-1.4, 0, 0.45],
    rotation: Math.PI / 2, // Facing right toward sofa
    scale: [1, 1, 1],
    dimensions: { width: 2.0, depth: 0.42, height: 0.45 },
  },
  {
    instanceId: 'inst-cabinet-1',
    furnitureId: 'storage-tall-cabinet',
    name: '落地雙門玻璃展示高櫃',
    category: 'storage',
    modelType: 'tall_display_cabinet',
    position: [-1.4, 0, -1.0],
    rotation: Math.PI / 2, // Flush with left wall
    scale: [1, 1, 1],
    dimensions: { width: 0.9, depth: 0.4, height: 2.1 },
  },
  {
    instanceId: 'inst-rug-1',
    furnitureId: 'decor-rug-moroccan',
    name: '羊毛編織柔和菱格地毯',
    category: 'decor',
    modelType: 'rug_wool',
    position: [0.4, 0, 0.45],
    rotation: 0,
    scale: [1, 1, 1],
    dimensions: { width: 2.4, depth: 1.6, height: 0.02 },
  },
  {
    instanceId: 'inst-plant-1',
    furnitureId: 'decor-plant-fiddle',
    name: '綠意琴葉榕陶瓷大盆栽',
    category: 'decor',
    modelType: 'plant_fiddle',
    position: [1.7, 0, -1.2],
    rotation: 0.4,
    scale: [1, 1, 1],
    dimensions: { width: 0.55, depth: 0.55, height: 1.25 },
  },
];

export default function App() {
  const [room, setRoom] = useState<Room>(() => {
    const saved = localStorage.getItem('roomvibe_room_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_ROOM;
  });

  const [placedFurnitures, setPlacedFurnitures] = useState<PlacedFurniture[]>(() => {
    const saved = localStorage.getItem('roomvibe_furnitures_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return PRESET_FURNITURES;
  });

  // Undo / Redo History Stack
  const [historyPast, setHistoryPast] = useState<PlacedFurniture[][]>([]);
  const [historyFuture, setHistoryFuture] = useState<PlacedFurniture[][]>([]);

  // Selected Furniture ID
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  // View Mode: 'orbit' (3D), 'top' (2D Plan), 'eye' (Human view)
  const [viewMode, setViewMode] = useState<'orbit' | 'top' | 'eye'>('orbit');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  // Modals & Panels State
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isDimensionOpen, setIsDimensionOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isCatalogCollapsed, setIsCatalogCollapsed] = useState<boolean>(false);
  const [isHeroOpen, setIsHeroOpen] = useState<boolean>(() => {
    // Show landing hero on first visit
    return !localStorage.getItem('roomvibe_visited');
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Canvas screenshot capture function ref
  const captureScreenshotRef = useRef<(() => string) | null>(null);
  const [exportImageUrl, setExportImageUrl] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Push to history helper
  const commitHistory = (newItems: PlacedFurniture[]) => {
    setHistoryPast((prev) => [...prev, placedFurnitures]);
    setHistoryFuture([]);
    setPlacedFurnitures(newItems);
  };

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, historyPast.length - 1);
    setHistoryFuture((prev) => [placedFurnitures, ...prev]);
    setHistoryPast(newPast);
    setPlacedFurnitures(previous);
    showToast('已復原上一步操作');
  }, [historyPast, placedFurnitures]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    const newFuture = historyFuture.slice(1);
    setHistoryPast((prev) => [...prev, placedFurnitures]);
    setHistoryFuture(newFuture);
    setPlacedFurnitures(next);
    showToast('已重做操作');
  }, [historyFuture, placedFurnitures]);

  // Keyboard Shortcuts (Undo, Redo, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedInstanceId) {
          handleDeleteFurniture(selectedInstanceId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedInstanceId]);

  // Add new furniture to center of room
  const handleAddFurniture = (item: Furniture) => {
    const instanceId = `inst-${item.id}-${Date.now().toString(36)}`;
    const newPlaced: PlacedFurniture = {
      instanceId,
      furnitureId: item.id,
      name: item.name,
      category: item.category,
      modelType: item.modelType,
      position: [0, 0, 0], // Center of floor
      rotation: 0,
      scale: [1, 1, 1],
      dimensions: item.dimensions,
      customColor: item.defaultColor,
    };

    commitHistory([...placedFurnitures, newPlaced]);
    setSelectedInstanceId(instanceId);
    showToast(`已新增「${item.name}」，可直接拖曳擺放`);
  };

  // Move furniture position
  const handleUpdateFurniturePosition = (
    instanceId: string,
    position: [number, number, number]
  ) => {
    setPlacedFurnitures((prev) =>
      prev.map((item) => (item.instanceId === instanceId ? { ...item, position } : item))
    );
  };

  // Rotate delta
  const handleUpdateRotation = (instanceId: string, angleDeltaRad: number) => {
    const updated = placedFurnitures.map((item) => {
      if (item.instanceId === instanceId) {
        return {
          ...item,
          rotation: (item.rotation + angleDeltaRad) % (Math.PI * 2),
        };
      }
      return item;
    });
    commitHistory(updated);
  };

  // Absolute rotation in degrees
  const handleSetRotationDeg = (instanceId: string, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    const updated = placedFurnitures.map((item) =>
      item.instanceId === instanceId ? { ...item, rotation: rad } : item
    );
    commitHistory(updated);
  };

  // Scale factor
  const handleUpdateScale = (instanceId: string, scaleFactor: number) => {
    const updated = placedFurnitures.map((item) =>
      item.instanceId === instanceId
        ? { ...item, scale: [scaleFactor, scaleFactor, scaleFactor] as [number, number, number] }
        : item
    );
    commitHistory(updated);
  };

  // Custom color
  const handleUpdateColor = (instanceId: string, hexColor: string) => {
    const updated = placedFurnitures.map((item) =>
      item.instanceId === instanceId ? { ...item, customColor: hexColor } : item
    );
    commitHistory(updated);
  };

  // Duplicate furniture
  const handleDuplicateFurniture = (instanceId: string) => {
    const target = placedFurnitures.find((i) => i.instanceId === instanceId);
    if (!target) return;

    const newId = `inst-${target.furnitureId}-${Date.now().toString(36)}`;
    const duplicated: PlacedFurniture = {
      ...target,
      instanceId: newId,
      position: [target.position[0] + 0.3, target.position[1], target.position[2] + 0.3],
    };

    commitHistory([...placedFurnitures, duplicated]);
    setSelectedInstanceId(newId);
    showToast(`已複製「${target.name}」`);
  };

  // Delete furniture
  const handleDeleteFurniture = (instanceId: string) => {
    const target = placedFurnitures.find((i) => i.instanceId === instanceId);
    const updated = placedFurnitures.filter((i) => i.instanceId !== instanceId);
    commitHistory(updated);
    setSelectedInstanceId(null);
    showToast(target ? `已移除「${target.name}」` : '已移除家具');
  };

  // Apply AI Room Analysis
  const handleApplyAnalysis = (analysis: AIRoomAnalysisResult) => {
    const updatedRoom: Room = {
      ...room,
      name: `${analysis.roomType} (AI 測量結構)`,
      dimensions: analysis.dimensions,
      wallColor: analysis.colorPalette.wall || room.wallColor,
      floorColor: analysis.colorPalette.floor || room.floorColor,
      isAIEstimated: analysis.isAIEstimated,
      confidence: analysis.confidence,
      detectedFeatures: analysis.detectedFeatures || [],
      spatialAnalysis: analysis.spatialAnalysis,
    };

    setRoom(updatedRoom);
    showToast('已成功根據 AI 分析建立 3D 空間結構！');
  };

  // Save project to LocalStorage
  const handleSaveProject = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('roomvibe_room_data', JSON.stringify(room));
      localStorage.setItem('roomvibe_furnitures_data', JSON.stringify(placedFurnitures));
      localStorage.setItem('roomvibe_visited', 'true');
      showToast('設計已自動保存至瀏覽器 (LocalStorage)');
    } catch (e) {
      console.error(e);
      showToast('保存遭遇問題');
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  };

  // Export Project JSON file
  const handleExportProjectJson = () => {
    const projectData = {
      version: '1.0',
      appName: 'RoomVibe',
      exportedAt: new Date().toISOString(),
      room,
      placedFurnitures,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RoomVibe-設計專案-${new Date().toISOString().slice(0, 10)}.roomvibe.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('已匯出專案備份檔案 (.json)');
  };

  // Import Project JSON file
  const handleImportProjectJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.room && Array.isArray(parsed.placedFurnitures)) {
          commitHistory(parsed.placedFurnitures);
          setRoom(parsed.room);
          showToast('成功匯入專案檔案！');
        } else {
          showToast('專案檔案格式不相符');
        }
      } catch (err) {
        showToast('無法解析專案 JSON 檔案');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Export Screenshot
  const handleExportScreenshot = () => {
    if (captureScreenshotRef.current) {
      const dataUrl = captureScreenshotRef.current();
      setExportImageUrl(dataUrl);
      setIsExportOpen(true);
    } else {
      showToast('正在準備 3D 畫布算圖...');
    }
  };

  // Selected furniture item object
  const selectedFurniture = placedFurnitures.find((f) => f.instanceId === selectedInstanceId) || null;

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-[#F7F5F0]">
      {/* Top Navigation Bar */}
      <Header
        room={room}
        canUndo={historyPast.length > 0}
        canRedo={historyFuture.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid((prev) => !prev)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDimensions={() => setIsDimensionOpen(true)}
        onSave={handleSaveProject}
        onExport={handleExportScreenshot}
        onExportProjectJson={handleExportProjectJson}
        onImportProjectJson={handleImportProjectJson}
        isSaving={isSaving}
      />

      {/* Main 3D Canvas Viewport */}
      <main className="relative flex-1 w-full h-[calc(100vh-64px)] overflow-hidden">
        <RoomCanvas
          room={room}
          placedFurnitures={placedFurnitures}
          selectedInstanceId={selectedInstanceId}
          onSelectFurniture={setSelectedInstanceId}
          onUpdateFurniturePosition={handleUpdateFurniturePosition}
          viewMode={viewMode}
          snapToGrid={snapToGrid}
          onCanvasReady={(fn) => {
            captureScreenshotRef.current = fn;
          }}
        />

        {/* View mode HUD indicator in bottom-left */}
        <div className="absolute bottom-16 sm:bottom-20 left-4 z-20 pointer-events-none select-none">
          <div className="bg-[#45413D]/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-md">
            <Compass className="w-3.5 h-3.5 text-[#D8C3A5]" />
            <span>
              {viewMode === 'orbit' && '3D 自由視角 (滑鼠/觸控自由旋轉)'}
              {viewMode === 'top' && '俯視平面圖 (頂部垂直俯瞰)'}
              {viewMode === 'eye' && '室內人重視角 (模擬身歷其境)'}
            </span>
          </div>
        </div>

        {/* Selected Furniture Attribute Inspector */}
        <FurnitureInspector
          furniture={selectedFurniture}
          onUpdateRotation={handleUpdateRotation}
          onSetRotationDeg={handleSetRotationDeg}
          onUpdateScale={handleUpdateScale}
          onUpdateColor={handleUpdateColor}
          onDuplicate={handleDuplicateFurniture}
          onDelete={handleDeleteFurniture}
          onClose={() => setSelectedInstanceId(null)}
        />

        {/* Floating Quick Action Tip */}
        <div className="hidden lg:flex absolute top-4 left-4 z-20 items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D8C3A5]/50 text-xs text-[#45413D]/70 shadow-xs pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-[#87988A]" />
          <span>點選 3D 家具即可自由拖曳移動，或按 Delete 鍵移除</span>
        </div>
      </main>

      {/* Bottom Collapsible Furniture Catalog Drawer */}
      <FurnitureCatalogDrawer
        onAddFurniture={handleAddFurniture}
        isCollapsed={isCatalogCollapsed}
        onToggleCollapse={() => setIsCatalogCollapsed((prev) => !prev)}
      />

      {/* Photo Upload & AI Structure Analysis Modal */}
      <PhotoUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onApplyAnalysis={handleApplyAnalysis}
      />

      {/* Room Dimensions & Material Modal */}
      <RoomDimensionModal
        isOpen={isDimensionOpen}
        onClose={() => setIsDimensionOpen(false)}
        room={room}
        onUpdateRoom={(updated) => setRoom((prev) => ({ ...prev, ...updated }))}
      />

      {/* Export Snapshot Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        imageUrl={exportImageUrl}
        room={room}
        placedFurnitures={placedFurnitures}
      />

      {/* First-time / Landing Welcome Hero Screen */}
      {isHeroOpen && (
        <LandingHero
          onStartWithPreset={() => {
            setRoom(DEFAULT_ROOM);
            setPlacedFurnitures(PRESET_FURNITURES);
            localStorage.setItem('roomvibe_visited', 'true');
          }}
          onOpenUpload={() => {
            setIsUploadOpen(true);
            localStorage.setItem('roomvibe_visited', 'true');
          }}
          onStartBlank={() => {
            setPlacedFurnitures([]);
            localStorage.setItem('roomvibe_visited', 'true');
          }}
          onCloseHero={() => {
            setIsHeroOpen(false);
            localStorage.setItem('roomvibe_visited', 'true');
          }}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#45413D] text-white px-4 py-2 rounded-xl text-xs font-medium shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-[#87988A]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
