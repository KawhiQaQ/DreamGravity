interface IndicatorProps {
  direction: 'left' | 'right' | 'top' | 'bottom';
  count: number;
  onClick: () => void;
}

/**
 * 视口外星球指示器
 */
export function OffscreenIndicator({ direction, count, onClick }: IndicatorProps) {
  if (count === 0) return null;

  const positionStyles: Record<string, React.CSSProperties> = {
    left: { left: 16, top: '50%', transform: 'translateY(-50%)' },
    right: { right: 280, top: '50%', transform: 'translateY(-50%)' }, // 留出右侧列表空间
    top: { top: 16, left: '50%', transform: 'translateX(-50%)' },
    bottom: { bottom: 60, left: '50%', transform: 'translateX(-50%)' },
  };

  const arrowRotation: Record<string, string> = {
    left: 'rotate-180',
    right: '',
    top: '-rotate-90',
    bottom: 'rotate-90',
  };

  return (
    <button
      onClick={onClick}
      className="absolute z-20 flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-105"
      style={{
        ...positionStyles[direction],
        background: 'rgba(139, 92, 246, 0.3)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(139, 92, 246, 0.5)',
        boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
        animation: 'pulse 2s ease-in-out infinite',
      }}
    >
      <svg
        className={`w-4 h-4 text-purple-300 ${arrowRotation[direction]}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <span className="text-xs text-purple-200 font-medium">{count}</span>
    </button>
  );
}

interface OffscreenIndicatorsProps {
  leftCount: number;
  rightCount: number;
  topCount: number;
  bottomCount: number;
  onNavigate: (direction: 'left' | 'right' | 'top' | 'bottom') => void;
}

/**
 * 所有方向的视口外指示器
 */
export function OffscreenIndicators({
  leftCount,
  rightCount,
  topCount,
  bottomCount,
  onNavigate,
}: OffscreenIndicatorsProps) {
  return (
    <>
      <OffscreenIndicator direction="left" count={leftCount} onClick={() => onNavigate('left')} />
      <OffscreenIndicator direction="right" count={rightCount} onClick={() => onNavigate('right')} />
      <OffscreenIndicator direction="top" count={topCount} onClick={() => onNavigate('top')} />
      <OffscreenIndicator direction="bottom" count={bottomCount} onClick={() => onNavigate('bottom')} />
    </>
  );
}
