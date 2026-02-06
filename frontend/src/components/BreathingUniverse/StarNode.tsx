/**
 * 星星节点组件 - 展开后的单个元素节点
 */
import { memo } from 'react';
import type { UniverseNode } from './types';
import type { DreamElementType } from '../../../../shared/types/api';

// 元素类型配置
const TYPE_CONFIG: Record<DreamElementType, { color: string; icon: string }> = {
  person: { color: '#8b5cf6', icon: '👤' },
  place: { color: '#06b6d4', icon: '📍' },
  object: { color: '#f59e0b', icon: '📦' },
  action: { color: '#10b981', icon: '⚡' },
};

interface StarNodeProps {
  node: UniverseNode;
  isHovered: boolean;
  isFocused: boolean;
  isNew?: boolean; // 是否是新展开的节点
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const StarNode = memo(function StarNode({
  node,
  isHovered,
  isFocused,
  isNew = false,
  onClick,
  onMouseEnter,
  onMouseLeave
}: StarNodeProps) {
  const { x = 0, y = 0, name, type, count, opacity, scale, isHighlighted } = node;
  const config = TYPE_CONFIG[type];
  
  // 基础半径根据出现次数
  const baseRadius = Math.sqrt(count) * 5 + 8;
  const displayRadius = baseRadius * scale * (isHovered ? 1.2 : 1);
  
  // 透明度处理
  const displayOpacity = isHighlighted ? 1 : opacity;
  
  return (
    <g
      className="star-node cursor-pointer"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        opacity: displayOpacity,
        // 新节点只有透明度过渡，已存在节点有位置过渡
        transition: isNew 
          ? 'opacity 0.5s ease-out' 
          : 'opacity 0.3s ease-out, transform 0.5s ease-out'
      }}
      transform={`translate(${x}, ${y})`}
    >
      {/* 外层光晕 */}
      <circle
        r={displayRadius * 2}
        fill={config.color}
        opacity={isHovered || isFocused ? 0.3 : 0.1}
        style={{
          filter: `blur(${displayRadius * 0.5}px)`,
          transition: 'r 0.3s ease, opacity 0.3s ease'
        }}
      />
      
      {/* 主体星星 */}
      <circle
        r={displayRadius}
        fill={config.color}
        opacity={0.9}
        style={{
          filter: `drop-shadow(0 0 ${isHovered ? 15 : 8}px ${config.color})`,
          transition: 'r 0.3s ease'
        }}
      />
      
      {/* 中心亮点 */}
      <circle
        r={displayRadius * 0.4}
        fill="white"
        opacity={0.8}
      />
      
      {/* 聚焦时的光环 */}
      {isFocused && (
        <circle
          r={displayRadius * 1.8}
          fill="none"
          stroke={config.color}
          strokeWidth={2}
          strokeDasharray="4 4"
          opacity={0.6}
          style={{
            animation: 'rotate-ring 10s linear infinite'
          }}
        />
      )}
      
      {/* 名称标签 */}
      <text
        y={displayRadius + 16}
        textAnchor="middle"
        fill="white"
        fontSize={isHovered ? 13 : 11}
        fontWeight={isHovered ? 600 : 400}
        opacity={isHovered ? 1 : 0.8}
        style={{
          textShadow: `0 0 8px ${config.color}`,
          transition: 'font-size 0.3s ease'
        }}
      >
        {name}
      </text>
      
      {/* 出现次数（悬停时显示） */}
      {isHovered && (
        <text
          y={displayRadius + 30}
          textAnchor="middle"
          fill="rgba(255,255,255,0.6)"
          fontSize={10}
        >
          出现 {count} 次
        </text>
      )}
    </g>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，确保 isNew 变化时组件更新
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.x === nextProps.node.x &&
    prevProps.node.y === nextProps.node.y &&
    prevProps.node.opacity === nextProps.node.opacity &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.isFocused === nextProps.isFocused &&
    prevProps.isNew === nextProps.isNew
  );
});
