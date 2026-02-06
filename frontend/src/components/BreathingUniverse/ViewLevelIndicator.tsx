/**
 * 视图层级指示器 - 显示当前缩放层级
 */
import { memo } from 'react';
import type { ViewLevel } from './types';

interface ViewLevelIndicatorProps {
  level: ViewLevel;
  zoomScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const LEVEL_CONFIG: Record<ViewLevel, { label: string; icon: string; description: string }> = {
  galaxy: {
    label: '银河视角',
    icon: '🌌',
    description: '宏观星云聚合'
  },
  nebula: {
    label: '星云视角',
    icon: '✨',
    description: '星云展开中'
  },
  star: {
    label: '星星视角',
    icon: '⭐',
    description: '单个元素详情'
  }
};

export const ViewLevelIndicator = memo(function ViewLevelIndicator({
  level,
  zoomScale,
  onZoomIn,
  onZoomOut,
  onReset
}: ViewLevelIndicatorProps) {
  const config = LEVEL_CONFIG[level];
  
  return (
    <div className="view-level-indicator glass-card p-3 rounded-xl">
      {/* 当前层级 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{config.icon}</span>
        <div>
          <div className="text-sm font-medium text-dream-text">{config.label}</div>
          <div className="text-xs text-dream-text-secondary">{config.description}</div>
        </div>
      </div>
      
      {/* 缩放控制 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onZoomOut}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 
                     flex items-center justify-center text-dream-text transition-colors"
          title="缩小"
        >
          −
        </button>
        
        <div className="flex-1 text-center">
          <span className="text-xs text-dream-text-secondary">
            {Math.round(zoomScale * 100)}%
          </span>
        </div>
        
        <button
          onClick={onZoomIn}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 
                     flex items-center justify-center text-dream-text transition-colors"
          title="放大"
        >
          +
        </button>
      </div>
      
      {/* 重置按钮 */}
      <button
        onClick={onReset}
        className="w-full mt-2 py-1.5 text-xs rounded-lg bg-white/5 
                   hover:bg-white/10 text-dream-text-secondary transition-colors"
      >
        重置视图
      </button>
      
      {/* 层级指示条 */}
      <div className="mt-3 flex items-center gap-1">
        {(['galaxy', 'nebula', 'star'] as ViewLevel[]).map((l, i) => (
          <div
            key={l}
            className={`flex-1 h-1 rounded-full transition-colors ${
              l === level
                ? 'bg-dream-neon-purple'
                : i < ['galaxy', 'nebula', 'star'].indexOf(level)
                  ? 'bg-dream-neon-purple/50'
                  : 'bg-white/20'
            }`}
          />
        ))}
      </div>
      
      {/* 操作提示 */}
      <div className="mt-3 text-xs text-dream-text-secondary/70 space-y-1">
        <p>• 滚轮缩放切换视角</p>
        <p>• 点击星云展开详情</p>
        <p>• 点击节点聚焦关联</p>
      </div>
    </div>
  );
});
