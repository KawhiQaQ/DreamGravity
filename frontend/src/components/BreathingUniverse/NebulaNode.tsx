/**
 * 星云节点组件 - 聚合状态下的大型发光星云
 */
import { memo, useMemo } from 'react';
import type { Nebula } from './types';

interface NebulaNodeProps {
  nebula: Nebula;
  isHovered: boolean;
  isDimmed: boolean;  // 其他星云被悬停时，当前星云变暗
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  index?: number; // 用于错开动画
}

// 基于索引生成稳定的伪随机数
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

export const NebulaNode = memo(function NebulaNode({
  nebula,
  isHovered,
  isDimmed,
  onClick,
  onMouseEnter,
  onMouseLeave,
  index = 0
}: NebulaNodeProps) {
  const { centerX, centerY, radius, label, icon, color, nodes, totalCount } = nebula;
  
  // 动态调整大小和透明度（变暗时保持可见但明显区分）
  const displayRadius = isHovered ? radius * 1.15 : isDimmed ? radius * 0.9 : radius;
  const glowIntensity = isHovered ? 0.6 : isDimmed ? 0.1 : 0.3;
  const overallOpacity = isDimmed ? 0.35 : 1;
  
  // 预计算星点位置（稳定不变）- 动画从一开始就运行，不需要延迟
  const starPoints = useMemo(() => {
    return nodes.slice(0, 12).map((_, i) => {
      const seed = i + nebula.id.charCodeAt(0);
      const angle = (i / 12) * Math.PI * 2;
      const distRatio = 0.4 + seededRandom(seed) * 0.4;
      const starSize = 2 + seededRandom(seed + 1) * 3;
      // 固定 opacity 为 0.6，与 twinkle 动画中间值一致，避免跳变
      const starOpacity = 0.6;
      // 使用更长的动画周期，让闪烁更自然
      const animDuration = 4 + seededRandom(seed + 3) * 4;
      // 负延迟让动画从中间状态开始，避免所有星点同时从起点开始
      const animDelay = -(seededRandom(seed + 4) * animDuration);
      
      return { angle, distRatio, starSize, starOpacity, animDuration, animDelay };
    });
  }, [nodes.length, nebula.id]);
  
  // 内核半径（用于交互区域）
  const coreRadius = displayRadius * 0.35;
  
  // 负延迟让呼吸动画从中间状态开始，避免初始跳变
  const breatheDelay = -((index * 0.7) % 4);
  
  return (
    <g
      className="nebula-node"
      style={{ 
        opacity: overallOpacity,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      {/* 外层光晕 - 呼吸动画（不响应鼠标） */}
      <circle
        cx={centerX}
        cy={centerY}
        r={displayRadius * 1.5}
        fill={`url(#nebula-glow-${nebula.id})`}
        opacity={glowIntensity}
        pointerEvents="none"
        style={{
          animation: isDimmed ? 'none' : `nebula-breathe 4s ease-in-out infinite`,
          animationDelay: `${breatheDelay}s`,
        }}
      />
      
      {/* 中层星云体（不响应鼠标） */}
      <circle
        cx={centerX}
        cy={centerY}
        r={displayRadius}
        fill={`url(#nebula-body-${nebula.id})`}
        opacity={0.8}
        pointerEvents="none"
        style={{
          filter: `drop-shadow(0 0 ${isHovered ? 30 : isDimmed ? 5 : 15}px ${color})`
        }}
      />
      
      {/* 内核 - 唯一的交互区域 */}
      <circle
        cx={centerX}
        cy={centerY}
        r={coreRadius}
        fill={color}
        opacity={isDimmed ? 0.5 : 0.9}
        className="cursor-pointer"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          filter: `drop-shadow(0 0 ${isDimmed ? 5 : 20}px ${color})`
        }}
      />
      
      {/* 星云内的小星点 - 使用稳定位置（不响应鼠标） */}
      {starPoints.map((point, i) => {
        const starX = centerX + Math.cos(point.angle) * displayRadius * point.distRatio;
        const starY = centerY + Math.sin(point.angle) * displayRadius * point.distRatio;
        
        return (
          <circle
            key={i}
            cx={starX}
            cy={starY}
            r={point.starSize}
            fill="white"
            opacity={isDimmed ? point.starOpacity * 0.3 : point.starOpacity}
            pointerEvents="none"
            style={{
              animation: isDimmed ? 'none' : `twinkle ${point.animDuration}s ease-in-out infinite`,
              animationDelay: `${point.animDelay}s`
            }}
          />
        );
      })}
      
      {/* 图标（不响应鼠标） */}
      <text
        x={centerX}
        y={centerY - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={isHovered ? 28 : 24}
        opacity={isDimmed ? 0.5 : 1}
        pointerEvents="none"
        style={{ transition: 'font-size 0.3s ease, opacity 0.3s ease' }}
      >
        {icon}
      </text>
      
      {/* 标签（不响应鼠标） */}
      <text
        x={centerX}
        y={centerY + 20}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={isHovered ? 14 : 12}
        fontWeight={500}
        opacity={isDimmed ? 0.4 : 1}
        pointerEvents="none"
        style={{
          textShadow: isDimmed ? 'none' : `0 0 10px ${color}`,
          transition: 'font-size 0.3s ease, opacity 0.3s ease'
        }}
      >
        {label}
      </text>
      
      {/* 节点数量（不响应鼠标） */}
      <text
        x={centerX}
        y={centerY + 38}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.6)"
        fontSize={10}
        opacity={isDimmed ? 0.3 : 1}
        pointerEvents="none"
        style={{ transition: 'opacity 0.3s ease' }}
      >
        {nodes.length} 元素 · {totalCount} 次
      </text>
      
      {/* 渐变定义 */}
      <defs>
        <radialGradient id={`nebula-glow-${nebula.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="70%" stopColor={color} stopOpacity="0.1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`nebula-body-${nebula.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="50%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </radialGradient>
      </defs>
    </g>
  );
});
