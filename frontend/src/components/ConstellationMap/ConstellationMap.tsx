import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Star } from './Star';
import { DreamList } from './DreamList';
import type { ConstellationMapProps, StarNode } from './types';
import { generateStarPositions, calculateCanvasWidth, emotionColors } from './utils';

export function ConstellationMap({
  dreams,
  searchKeyword = '',
  onDreamClick,
  onDreamDelete,
  onBatchDelete,
  isLoading = false,
  selectionMode = false,
  selectedIds = [],
  onSelectionChange,
}: ConstellationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollX, setScrollX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 500 });
  const [listCollapsed, setListCollapsed] = useState(false);

  // 计算画布宽度和星球位置
  const canvasWidth = useMemo(() => calculateCanvasWidth(dreams.length), [dreams.length]);
  const starNodes = useMemo<StarNode[]>(() => {
    return generateStarPositions(dreams, containerSize.height);
  }, [dreams, containerSize.height]);

  // 搜索高亮
  const highlightedIds = useMemo(() => {
    if (!searchKeyword.trim()) return new Set<string>();
    const keyword = searchKeyword.toLowerCase();
    return new Set(dreams.filter(d => d.content.toLowerCase().includes(keyword)).map(d => d.id));
  }, [dreams, searchKeyword]);
  const hasSearch = highlightedIds.size > 0;

  // 视口内可见的星球 - 精确匹配画布可见区域
  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    const listWidth = listCollapsed ? 40 : 256;
    // SVG画布的实际可见宽度
    const svgWidth = containerSize.width - listWidth;
    
    starNodes.forEach(node => {
      const screenX = node.position.x + scrollX;
      // 星球中心在SVG可见区域内（左边界0，右边界svgWidth），加上星球半径的容差
      const starRadius = node.size / 2;
      if (screenX >= -starRadius && screenX <= svgWidth + starRadius) {
        ids.add(node.dream.id);
      }
    });
    return ids;
  }, [starNodes, scrollX, containerSize.width, listCollapsed]);

  // 视口外高亮星球数量
  const offscreenCounts = useMemo(() => {
    if (!hasSearch) return { left: 0, right: 0 };
    let left = 0, right = 0;
    const listWidth = listCollapsed ? 40 : 256;
    starNodes.forEach(node => {
      if (!highlightedIds.has(node.dream.id)) return;
      const screenX = node.position.x + scrollX;
      if (screenX < 0) left++;
      else if (screenX > containerSize.width - listWidth) right++;
    });
    return { left, right };
  }, [starNodes, highlightedIds, scrollX, containerSize.width, hasSearch, listCollapsed]);


  // 监听容器大小
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 滚轮横向滚动
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
    const listWidth = listCollapsed ? 40 : 256;
    const maxScroll = 0;
    const minScroll = -(canvasWidth - containerSize.width + listWidth);
    setScrollX(x => Math.max(minScroll, Math.min(maxScroll, x - delta)));
  }, [canvasWidth, containerSize.width, listCollapsed]);

  // 拖拽滚动
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStartX(e.clientX - scrollX);
  }, [scrollX]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const listWidth = listCollapsed ? 40 : 256;
    const maxScroll = 0;
    const minScroll = -(canvasWidth - containerSize.width + listWidth);
    const newX = e.clientX - dragStartX;
    setScrollX(Math.max(minScroll, Math.min(maxScroll, newX)));
  }, [isDragging, dragStartX, canvasWidth, containerSize.width, listCollapsed]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // 导航到视口外的高亮星球
  const navigateToOffscreen = (direction: 'left' | 'right') => {
    const targets = starNodes.filter(n => highlightedIds.has(n.dream.id));
    if (targets.length === 0) return;
    const listWidth = listCollapsed ? 32 : 256;
    let target: StarNode | null = null;
    
    if (direction === 'left') {
      targets.forEach(node => {
        if (node.position.x + scrollX < 0) target = node;
      });
    } else {
      for (const node of targets) {
        if (node.position.x + scrollX > containerSize.width - listWidth) {
          target = node;
          break;
        }
      }
    }
    
    if (target) {
      setScrollX(-target.position.x + containerSize.width / 2 - listWidth / 2);
    }
  };

  // 跳转到指定星球
  const scrollToStar = (id: string) => {
    const node = starNodes.find(n => n.dream.id === id);
    if (node) {
      const listWidth = listCollapsed ? 32 : 256;
      setScrollX(-node.position.x + (containerSize.width - listWidth) / 2);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === dreams.length) onSelectionChange?.([]);
    else onSelectionChange?.(dreams.map(d => d.id));
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 animate-spin opacity-30 blur-md" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 animate-pulse" />
        </div>
        <p className="text-gray-400/80 text-sm">星河加载中...</p>
      </div>
    );
  }

  if (dreams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-6xl mb-4 animate-pulse">🌌</div>
        <h3 className="text-xl font-light text-gray-200 mb-2">星空尚无星辰</h3>
        <p className="text-gray-400/70 text-sm">记录你的第一个梦境，点亮第一颗星</p>
      </div>
    );
  }

  const sortedNodes = [...starNodes].sort(
    (a, b) => new Date(a.dream.dreamDate).getTime() - new Date(b.dream.dreamDate).getTime()
  );

  // 计算进度条位置
  const listWidth = listCollapsed ? 40 : 256;
  const maxScroll = 0;
  const minScroll = -(canvasWidth - containerSize.width + listWidth);
  const scrollRange = maxScroll - minScroll;
  const progressRatio = scrollRange > 0 ? (maxScroll - scrollX) / scrollRange : 0;

  return (
    <div className="relative w-full h-full overflow-hidden" ref={containerRef}>
      {/* 顶部控制栏 */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(15,15,30,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="text-xs text-gray-400">✦ {dreams.length} 颗星辰</span>
          <span className="text-gray-600">|</span>
          <span className="text-xs text-gray-500">← 过去</span>
          <span className="text-xs text-gray-500">现在 →</span>
        </div>
        {selectionMode && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(15,15,30,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={handleSelectAll} className="text-xs text-purple-300 hover:text-purple-200">
              {selectedIds.length === dreams.length ? '取消全选' : '全选'}
            </button>
            {selectedIds.length > 0 && (
              <button onClick={() => onBatchDelete(selectedIds)}
                className="text-xs px-2 py-1 bg-red-500/60 hover:bg-red-500/80 text-white rounded-lg">
                删除 ({selectedIds.length})
              </button>
            )}
          </div>
        )}
      </div>


      {/* 底部时间进度条 */}
      <div className="absolute bottom-3 left-3 right-3 z-20" style={{ marginRight: listWidth + 12 }}>
        <div className="relative h-6 rounded-xl overflow-hidden flex items-center px-12"
          style={{ background: 'rgba(15,15,30,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {/* 左侧标签 */}
          <span className="absolute left-3 text-[10px] text-gray-500">← 过去</span>
          {/* 进度轨道 */}
          <div className="flex-1 relative h-1 bg-white/10 rounded-full mx-2">
            {/* 星点标记 */}
            {starNodes.map((node, i) => {
              const ratio = starNodes.length > 1 ? i / (starNodes.length - 1) : 0.5;
              return (
                <div
                  key={node.dream.id}
                  className="absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 top-1/2 cursor-pointer hover:scale-150 transition-transform"
                  style={{
                    left: `${ratio * 100}%`,
                    background: emotionColors[node.dream.emotionTag].primary,
                    opacity: highlightedIds.has(node.dream.id) ? 1 : hasSearch ? 0.2 : 0.6,
                  }}
                  onClick={() => scrollToStar(node.dream.id)}
                  title={new Date(node.dream.dreamDate).toLocaleDateString('zh-CN')}
                />
              );
            })}
            {/* 当前位置指示器 */}
            <div
              className="absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 top-1/2 transition-all"
              style={{
                left: `${progressRatio * 100}%`,
                background: 'linear-gradient(135deg, #a78bfa, #06b6d4)',
                boxShadow: '0 0 10px rgba(139,92,246,0.6)',
              }}
            />
          </div>
          {/* 右侧标签 */}
          <span className="absolute right-3 text-[10px] text-gray-500">现在 →</span>
        </div>
      </div>

      {/* 左侧视口外指示器 */}
      {hasSearch && offscreenCounts.left > 0 && (
        <button
          onClick={() => navigateToOffscreen('left')}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 px-3 py-2 rounded-xl"
          style={{
            background: 'rgba(139,92,246,0.3)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(139,92,246,0.5)', boxShadow: '0 0 20px rgba(139,92,246,0.3)',
          }}
        >
          <svg className="w-4 h-4 text-purple-300 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs text-purple-200">{offscreenCounts.left}</span>
        </button>
      )}

      {/* 右侧视口外指示器 */}
      {hasSearch && offscreenCounts.right > 0 && (
        <button
          onClick={() => navigateToOffscreen('right')}
          className="absolute z-20 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-2 rounded-xl"
          style={{
            right: listWidth + 12,
            background: 'rgba(139,92,246,0.3)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(139,92,246,0.5)', boxShadow: '0 0 20px rgba(139,92,246,0.3)',
          }}
        >
          <span className="text-xs text-purple-200">{offscreenCounts.right}</span>
          <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}


      {/* 右侧列表 */}
      <DreamList
        nodes={starNodes}
        visibleIds={visibleIds}
        hoveredId={hoveredId}
        highlightedIds={highlightedIds}
        onHover={setHoveredId}
        onClick={onDreamClick}
        onScrollToStar={scrollToStar}
        isCollapsed={listCollapsed}
        onToggleCollapse={() => setListCollapsed(!listCollapsed)}
      />

      {/* SVG 星空画布 */}
      <svg
        className={`${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ 
          width: listCollapsed ? '100%' : `calc(100% - 256px)`,
          height: '100%',
          background: 'transparent'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          {Object.entries(emotionColors).map(([emotion, colors]) => (
            <radialGradient key={emotion} id={`glow-${emotion}`}>
              <stop offset="0%" stopColor={colors.glow} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          ))}
          <linearGradient id="thread-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.15)" />
            <stop offset="50%" stopColor="rgba(139,92,246,0.35)" />
            <stop offset="100%" stopColor="rgba(6,182,212,0.25)" />
          </linearGradient>
        </defs>

        {/* 背景星尘（视差效果 - 移动慢） */}
        <g transform={`translate(${scrollX * 0.3}, 0)`}>
          {Array.from({ length: 30 }).map((_, i) => (
            <circle
              key={`dust-${i}`}
              cx={(i * 137) % canvasWidth}
              cy={(i * 89) % containerSize.height}
              r={1 + (i % 3)}
              fill="rgba(255,255,255,0.15)"
            />
          ))}
        </g>

        {/* 主内容层 */}
        <g transform={`translate(${scrollX}, 0)`}>
          {/* 星座连线 */}
          {sortedNodes.length > 1 && (
            <g>
              {sortedNodes.slice(0, -1).map((node, i) => {
                const next = sortedNodes[i + 1];
                if (!next) return null;
                const midX = (node.position.x + next.position.x) / 2;
                const midY = (node.position.y + next.position.y) / 2;
                return (
                  <path
                    key={`thread-${i}`}
                    d={`M ${node.position.x} ${node.position.y} Q ${midX} ${midY + 15} ${next.position.x} ${next.position.y}`}
                    fill="none"
                    stroke="url(#thread-gradient)"
                    strokeWidth={1.5}
                    strokeDasharray="8 12"
                    opacity={0.5}
                  />
                );
              })}
            </g>
          )}

          {/* 星球 */}
          {starNodes.map((node) => {
            const screenX = node.position.x + scrollX;
            const screenY = node.position.y;
            return (
              <Star
                key={node.dream.id}
                node={node}
                isHovered={hoveredId === node.dream.id}
                isSelected={selectedIds.includes(node.dream.id)}
                isDimmed={hasSearch && !highlightedIds.has(node.dream.id)}
                isHighlighted={highlightedIds.has(node.dream.id)}
                selectionMode={selectionMode}
                screenX={screenX}
                screenY={screenY}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
                onMouseEnter={() => setHoveredId(node.dream.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onDreamClick(node.dream.id)}
                onSelect={(selected) => {
                  if (selected) onSelectionChange?.([...selectedIds, node.dream.id]);
                  else onSelectionChange?.(selectedIds.filter(id => id !== node.dream.id));
                }}
                onDelete={() => onDreamDelete(node.dream.id)}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
