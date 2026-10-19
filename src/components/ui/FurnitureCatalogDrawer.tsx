import React, { useState } from 'react';
import {
  Armchair,
  FolderOpen,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { Furniture, FurnitureCategory } from '../../types';
import { FURNITURE_CATALOG } from '../../data/furnitures';

interface FurnitureCatalogDrawerProps {
  onAddFurniture: (furniture: Furniture) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const CATEGORIES: Array<{ key: FurnitureCategory; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'seating', label: '沙發/座椅' },
  { key: 'tables', label: '茶几/餐桌' },
  { key: 'storage', label: '收納/電視櫃' },
  { key: 'beds', label: '床架/寢具' },
  { key: 'lighting', label: '氛圍燈飾' },
  { key: 'decor', label: '植栽/地毯' },
];

export const FurnitureCatalogDrawer: React.FC<FurnitureCatalogDrawerProps> = ({
  onAddFurniture,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FurnitureCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFurnitures = FURNITURE_CATALOG.filter((f) => {
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div
      className={`fixed bottom-0 inset-x-0 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-5xl z-30 transition-all duration-300 ease-in-out px-2 sm:px-4 ${
        isCollapsed ? 'translate-y-[calc(100%-44px)]' : 'translate-y-0'
      }`}
    >
      {/* Drawer Container */}
      <div className="bg-[#F7F5F0]/95 backdrop-blur-md rounded-t-2xl sm:rounded-2xl border border-[#D8C3A5]/60 shadow-xl overflow-hidden pb-4 sm:pb-3">
        {/* Dock Header & Toggle Bar */}
        <div className="px-4 py-2.5 bg-white/70 border-b border-[#D8C3A5]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#87988A]" />
            <h3 className="text-xs sm:text-sm font-semibold text-[#45413D]">
              精選日系北歐家具庫 ({FURNITURE_CATALOG.length})
            </h3>
            <span className="hidden md:inline-block text-[11px] text-[#45413D]/60">
              點擊「加入」或直接拖曳置入房間
            </span>
          </div>

          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EBE5DA]/70 hover:bg-[#EBE5DA] text-[#45413D] text-xs font-medium transition-colors"
            title={isCollapsed ? '展開家具目錄' : '收合家具目錄'}
          >
            <span>{isCollapsed ? '展開目錄' : '收合'}</span>
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Content (Visible when not collapsed) */}
        {!isCollapsed && (
          <div className="p-3 sm:p-4 space-y-3">
            {/* Category tabs & Search input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all ${
                      selectedCategory === cat.key
                        ? 'bg-[#87988A] text-white shadow-xs'
                        : 'bg-white/80 text-[#45413D]/80 hover:bg-white border border-[#D8C3A5]/40'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-[#45413D]/50 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋家具、材質..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/90 border border-[#D8C3A5]/60 text-xs text-[#45413D] placeholder-[#45413D]/40 focus:outline-none focus:border-[#87988A]"
                />
              </div>
            </div>

            {/* Furniture Horizontal Scroll / Grid List */}
            <div className="flex items-stretch gap-3 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-[#D8C3A5]">
              {filteredFurnitures.map((item) => (
                <div
                  key={item.id}
                  className="w-56 shrink-0 bg-white rounded-2xl p-3 border border-[#D8C3A5]/50 shadow-xs hover:shadow-md hover:border-[#87988A] transition-all flex flex-col justify-between group"
                >
                  {/* Visual Graphic Representation */}
                  <div
                    className="w-full h-24 rounded-xl flex items-center justify-center relative overflow-hidden mb-2.5"
                    style={{ backgroundColor: item.thumbnailColor }}
                  >
                    {/* Stylized Miniature Graphic */}
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-white/80 shadow-xs flex items-center justify-center text-[#45413D]">
                        <Armchair className="w-6 h-6 stroke-[1.7]" />
                      </div>
                    </div>

                    <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/90 text-[#45413D]">
                      {item.dimensions.width.toFixed(2)} × {item.dimensions.depth.toFixed(2)}m
                    </span>
                  </div>

                  {/* Title & Specs */}
                  <div className="space-y-1 mb-3">
                    <h4 className="text-xs font-semibold text-[#45413D] group-hover:text-[#556958] transition-colors line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-[#45413D]/65 line-clamp-1">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-1 pt-1">
                      {item.tags.slice(0, 2).map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F5F0] text-[#45413D]/70 border border-[#D8C3A5]/30"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={() => onAddFurniture(item)}
                    className="w-full py-2 px-3 rounded-xl bg-[#87988A] hover:bg-[#768779] text-white text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>加入房間</span>
                  </button>
                </div>
              ))}

              {filteredFurnitures.length === 0 && (
                <div className="w-full py-8 text-center text-xs text-[#45413D]/60">
                  沒有符合「{searchQuery}」的家具，請嘗試其他關鍵字。
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
