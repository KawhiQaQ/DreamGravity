import { useState } from 'react';
import type { StarProps } from './types';
import { emotionColors, emotionLabels, formatDate, getContentPreview } from './utils';

function getShortTitle(content: string, maxLen: number = 10): string {
  const cleaned = content.replace(/[\n\r]/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen) + '…';
}

export function Star({
  node,
  isHovered,
  isSelected,
  isDimmed,
  isHighlighted,
  selectionMode,
  screenX,
  screenY,
  containerWidth,
  containerHeight,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onSelect,
  onDelete,
}: StarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { dream, position, size, isPrimaryStar } = node;
  const colors = emotionColors[dream.emotionTag];
  
  const showCard = isHovered;
  const glowIntensity = isHighlighted ? 1.5 : isPrimaryStar ? 1.2 : 1;
  const opacity = isDimmed ? 0.15 : 1;

  // 智能判断卡片弹出方向
  const cardWidth = 280;
  const cardHeight = 200;
  // 检查右边是否有足够空间（考虑右侧列表宽度280px）
  const spaceOnRight = containerWidth - 280 - screenX - size / 2 - 8;
  // 检查左边是否有足够空间
  const spaceOnLeft = screenX - size / 2 - 8;
  // 优先显示在右边，除非右边空间不够且左边空间足够
  const cardOnLeft = spaceOnRight < cardWidth && spaceOnLeft >= cardWidth;
  // 如果左边也不够空间，强制显示在右边（会被裁剪但至少可见）
  const cardOnTop = screenY + cardHeight > containerHeight - 60;
  
  // 计算卡片X位置，确保不超出左边界
  let cardX: number;
  if (cardOnLeft) {
    // 显示在左边，但确保不超出左边界
    cardX = Math.max(-(screenX - 8), -(cardWidth + size / 2 + 8));
  } else {
    // 显示在右边
    cardX = size / 2 + 8;
  }
  
  const cardY = cardOnTop ? -(cardHeight - size / 2 - 20) : -40;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectionMode) {
      onSelect(!isSelected);
    } else {
      onClick();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setShowDeleteConfirm(false);
  };

  const shortDate = new Date(dream.dreamDate).toLocaleDateString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit' 
  }).replace('/', '.');

  // 生成唯一ID
  const nebulaId = `nebula-${dream.id}`;
  const glowId = `glow-outer-${dream.id}`;
  
  // 呼吸动画的相位偏移（基于ID生成，让每个星球动画不同步）
  const breatheDelay = (dream.id.charCodeAt(0) % 10) * 0.3;
  
  // 是否有附件（图片或录音）- 显示卫星
  const hasAttachment = dream.hasAnalysis; // 用 hasAnalysis 代表有附件
  
  // 行星环角度（基于ID生成不同倾斜角度）
  const ringAngle = 15 + (dream.id.charCodeAt(0) % 20);

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      style={{ cursor: 'pointer', opacity, transition: 'opacity 0.4s ease' }}
    >
      <defs>
        {/* 星球主体 - 简洁的径向渐变 */}
        <radialGradient id={nebulaId} cx="35%" cy="35%" r="60%">
          {/* 核心高光 */}
          <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
          <stop offset="12%" stopColor={colors.primary} stopOpacity="1" />
          {/* 主体 */}
          <stop offset="50%" stopColor={colors.primary} stopOpacity="0.9" />
          {/* 边缘 */}
          <stop offset="85%" stopColor={colors.primary} stopOpacity="0.7" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0.4" />
        </radialGradient>
        
        {/* 外发光渐变 */}
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="40%" stopColor={colors.primary} stopOpacity="0.15" />
          <stop offset="75%" stopColor={colors.primary} stopOpacity="0.05" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 高亮脉冲光圈 - 搜索匹配时 */}
      {isHighlighted && (
        <circle
          r={size * 1.8}
          fill="none"
          stroke={colors.primary}
          strokeWidth={1.5}
          opacity={0.5}
          className="animate-ping"
          style={{ animationDuration: '2s' }}
        />
      )}

      {/* 外发光层 */}
      <circle
        r={size * (isHovered ? 1.2 : 1.0) * glowIntensity}
        fill={`url(#${glowId})`}
        className="transition-all duration-500 nebula-breathe"
        style={{ animationDelay: `${breatheDelay}s` }}
      />

      {/* 星球本体 */}
      <circle
        r={size / 2}
        fill={`url(#${nebulaId})`}
        className="transition-all duration-300 nebula-breathe"
        style={{
          filter: isHovered 
            ? `drop-shadow(0 0 ${size * 0.25}px ${colors.primary})`
            : `drop-shadow(0 0 ${size * 0.1}px ${colors.primary})`,
          animationDelay: `${breatheDelay}s`,
        }}
      />

      {/* 重要梦境的行星环 */}
      {isPrimaryStar && (
        <g transform={`rotate(${ringAngle})`}>
          {/* 主环 */}
          <ellipse
            cx={0}
            cy={0}
            rx={size * 0.75}
            ry={size * 0.15}
            fill="none"
            stroke={colors.primary}
            strokeWidth={1}
            strokeDasharray="4 6"
            opacity={0.35}
            className={`transition-all duration-300 ${!isHovered ? 'nebula-spin' : ''}`}
          />
          {/* 次环 - 更细更淡 */}
          <ellipse
            cx={0}
            cy={0}
            rx={size * 0.85}
            ry={size * 0.18}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={0.5}
            strokeDasharray="2 8"
            opacity={0.25}
          />
        </g>
      )}

      {/* 卫星 - 表示有附件 */}
      {hasAttachment && (
        <g>
          {/* 卫星轨道线 */}
          <ellipse
            cx={0}
            cy={0}
            rx={size * 0.65}
            ry={size * 0.45}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={0.5}
            strokeDasharray="2 6"
            transform="rotate(-20)"
          />
          {/* 卫星 */}
          <circle
            cx={size * 0.55}
            cy={-size * 0.35}
            r={3}
            fill="rgba(255,255,255,0.7)"
            className="nebula-orbit"
            style={{
              transformOrigin: '0 0',
              filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))',
              ['--orbit-radius' as string]: `${size * 0.5}px`,
            }}
          />
        </g>
      )}

      {/* 选中状态环 */}
      {(isSelected || selectionMode) && (
        <circle
          r={size / 2 + 6}
          fill="none"
          stroke={isSelected ? '#a78bfa' : 'rgba(255,255,255,0.2)'}
          strokeWidth={2}
          strokeDasharray={isSelected ? 'none' : '4 4'}
          opacity={0.8}
        />
      )}

      {/* 日期标签 */}
      <text
        y={size / 2 + 24}
        textAnchor="middle"
        fill="rgba(255,255,255,0.75)"
        fontSize={12}
        fontWeight={400}
        style={{ pointerEvents: 'none' }}
      >
        {shortDate}
      </text>
      
      {/* 简短标题 */}
      <text
        y={size / 2 + 42}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={11}
        fontWeight={300}
        style={{ pointerEvents: 'none' }}
      >
        {getShortTitle(dream.content, 8)}
      </text>

      {/* 悬停卡片 */}
      {showCard && (
        <foreignObject
          x={cardX}
          y={cardY}
          width={280}
          height={220}
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <div
            className="relative p-4 rounded-2xl animate-fadeIn"
            style={{
              background: 'rgba(15, 15, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 40px ${colors.glow}`,
              pointerEvents: 'auto',
            }}
          >
            {showDeleteConfirm && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                <div className="text-center p-3">
                  <p className="text-gray-200 text-sm mb-3">删除这颗星？</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                      className="px-3 py-1.5 text-xs text-gray-300 bg-white/10 rounded-lg hover:bg-white/20"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="px-3 py-1.5 text-xs bg-red-500/70 text-white rounded-lg hover:bg-red-500"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between mb-2">
              <span className="text-lg font-light text-white/90">
                {formatDate(dream.dreamDate)}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: `${colors.primary}30`,
                    color: colors.primary,
                    border: `1px solid ${colors.primary}50`,
                  }}
                >
                  {emotionLabels[dream.emotionTag]}
                </span>
                {!selectionMode && (
                  <button
                    onClick={handleDeleteClick}
                    className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <p className="text-gray-300/90 text-sm font-light leading-relaxed mb-3" style={{ lineHeight: '1.7' }}>
              {getContentPreview(dream.content, 120)}
            </p>

            <div className="flex items-center gap-3 text-xs text-gray-500 pt-2 border-t border-white/10">
              <span>清晰度 {'✦'.repeat(dream.clarity)}{'✧'.repeat(5 - dream.clarity)}</span>
              {dream.isRecurring && <span className="text-purple-400">↻ 重复</span>}
              {dream.hasAnalysis && <span className="text-cyan-400">✧ 已解析</span>}
            </div>

            <div className="mt-2 text-center">
              <span className="text-xs text-gray-500">点击查看详情 →</span>
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}
