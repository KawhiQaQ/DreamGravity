import { useState } from 'react';
import { TimelineNode } from './TimelineNode';
import type { TimelineProps } from './types';

/**
 * 星河轨迹时间轴组件
 */
export function Timeline({
  dreams,
  onDreamClick,
  onDreamHover,
  onDreamDelete,
  onBatchDelete,
  isLoading = false,
  selectionMode = false,
  selectedIds = [],
  onSelectionChange,
}: TimelineProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleMouseEnter = (id: string) => {
    setHoveredId(id);
    onDreamHover(id);
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
    onDreamHover(null);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === dreams.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(dreams.map(d => d.id));
    }
  };

  const handleSelectionChange = (id: string, selected: boolean) => {
    if (selected) {
      onSelectionChange?.([...selectedIds, id]);
    } else {
      onSelectionChange?.(selectedIds.filter(i => i !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 animate-spin opacity-30 blur-sm" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 animate-pulse" />
        </div>
        <p className="text-gray-400/80 text-sm tracking-wide">星河加载中...</p>
      </div>
    );
  }

  if (dreams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative mb-6">
          <div className="text-6xl float-animation">🌌</div>
          <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
        </div>
        <h3 className="text-xl font-light text-gray-200 mb-2 tracking-wide">星河尚无轨迹</h3>
        <p className="text-gray-400/70 text-sm">开始记录你的第一个梦境吧</p>
      </div>
    );
  }

  // 按日期和睡眠起始时间升序排序
  const sortedDreams = [...dreams].sort((a, b) => {
    const dateA = new Date(a.dreamDate).getTime();
    const dateB = new Date(b.dreamDate).getTime();
    if (dateA !== dateB) return dateA - dateB;
    
    const timeA = a.sleepStartTime || '99:99';
    const timeB = b.sleepStartTime || '99:99';
    return timeA.localeCompare(timeB);
  });

  return (
    <div className="relative">
      {/* 时间轴标题和操作栏 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 star-breathe" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 blur-sm opacity-60" />
          </div>
          <span className="text-sm text-gray-400/80 tracking-wide">共 {dreams.length} 颗记忆星尘</span>
        </div>
        
        {selectionMode && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
            >
              {selectedIds.length === dreams.length ? '取消全选' : '全选'}
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={() => onBatchDelete(selectedIds)}
                className="px-3 py-1.5 text-sm bg-red-500/60 hover:bg-red-500/80 text-white rounded-lg transition-colors backdrop-blur-sm"
              >
                删除选中 ({selectedIds.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* 星河时间轴内容 */}
      <div className="relative pl-6">
        {/* 流动光束时间轴线 */}
        <div className="absolute left-[11px] top-0 bottom-0 w-[2px] star-stream-line" />
        
        {sortedDreams.map((dream, index) => (
          <TimelineNode
            key={dream.id}
            dream={dream}
            onClick={() => onDreamClick(dream.id)}
            onMouseEnter={() => handleMouseEnter(dream.id)}
            onMouseLeave={handleMouseLeave}
            onDelete={() => onDreamDelete(dream.id)}
            isHovered={hoveredId === dream.id}
            selectionMode={selectionMode}
            isSelected={selectedIds.includes(dream.id)}
            onSelect={(selected) => handleSelectionChange(dream.id, selected)}
            isLast={index === sortedDreams.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
