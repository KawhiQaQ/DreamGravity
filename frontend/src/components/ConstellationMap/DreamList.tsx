import { useRef, useEffect } from 'react';
import type { StarNode } from './types';
import { emotionColors, emotionLabels } from './utils';

interface DreamListProps {
  nodes: StarNode[];
  visibleIds: Set<string>;
  hoveredId: string | null;
  highlightedIds: Set<string>;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  onScrollToStar?: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * 右侧梦境列表组件 - 与星图双向联动
 */
export function DreamList({
  nodes,
  visibleIds,
  hoveredId,
  highlightedIds,
  onHover,
  onClick,
  onScrollToStar,
  isCollapsed,
  onToggleCollapse,
}: DreamListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (hoveredId && itemRefs.current.has(hoveredId)) {
      const item = itemRefs.current.get(hoveredId);
      item?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [hoveredId]);

  const sortedNodes = [...nodes].sort(
    (a, b) => new Date(b.dream.dreamDate).getTime() - new Date(a.dream.dreamDate).getTime()
  );

  // 显示所有节点
  const displayNodes = sortedNodes;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    }).replace('/', '.');
  };

  const getPreview = (content: string, len: number = 20) => {
    const cleaned = content.replace(/[\n\r]/g, ' ').trim();
    return cleaned.length <= len ? cleaned : cleaned.slice(0, len) + '…';
  };

  return (
    <>
      {/* 折叠按钮 - 固定在屏幕右侧 */}
      <button
        onClick={onToggleCollapse}
        className="fixed top-1/2 -translate-y-1/2 z-40 w-8 h-16 flex items-center justify-center rounded-l-xl"
        style={{
          right: isCollapsed ? 0 : 256,
          background: 'rgba(15, 15, 30, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRight: 'none',
          transition: 'right 0.3s ease',
        }}
      >
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 列表面板 - 固定在屏幕右侧 */}
      <div
        className="fixed top-0 bottom-0 z-30 w-64 flex flex-col"
        style={{
          right: isCollapsed ? -256 : 0,
          background: 'rgba(15, 15, 30, 0.85)',
          backdropFilter: 'blur(16px)',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          transition: 'right 0.3s ease',
        }}
      >
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-medium text-gray-200">
            梦境列表
            <span className="ml-2 text-xs text-gray-500">
              {nodes.length}
            </span>
          </h3>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto">
          {displayNodes.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {highlightedIds.size > 0 ? '无匹配结果' : '拖动画布查看更多'}
            </div>
          ) : (
            displayNodes.map((node) => {
              const colors = emotionColors[node.dream.emotionTag];
              const isHovered = hoveredId === node.dream.id;
              const isHighlighted = highlightedIds.has(node.dream.id);
              
              return (
                <div
                  key={node.dream.id}
                  ref={(el) => {
                    if (el) itemRefs.current.set(node.dream.id, el);
                  }}
                  className={`px-4 py-3 border-b border-white/5 cursor-pointer transition-all ${
                    isHovered ? 'bg-white/10' : isHighlighted ? 'bg-purple-500/10' : 'hover:bg-white/5'
                  }`}
                  onMouseEnter={() => onHover(node.dream.id)}
                  onMouseLeave={() => onHover(null)}
                  onClick={() => {
                    // 如果星球不在视口内，先跳转到星球位置
                    if (!visibleIds.has(node.dream.id) && onScrollToStar) {
                      onScrollToStar(node.dream.id);
                    }
                    onClick(node.dream.id);
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: colors.primary,
                        boxShadow: isHighlighted ? `0 0 8px ${colors.glow}` : 'none',
                      }}
                    />
                    <span className="text-xs text-gray-400">{formatDate(node.dream.dreamDate)}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        background: `${colors.primary}20`,
                        color: colors.primary,
                      }}
                    >
                      {emotionLabels[node.dream.emotionTag]}
                    </span>
                    {node.isPrimaryStar && (
                      <span className="text-[10px] text-yellow-400">★</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 font-light truncate">
                    {getPreview(node.dream.content, 25)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
