import type { StarNode } from './types';
import { emotionColors } from './utils';

interface MiniMapProps {
  nodes: StarNode[];
  scrollX: number;
  canvasWidth: number;
  containerWidth: number;
  onScrollChange: (scrollX: number) => void;
}

/**
 * 横向迷你地图 - 时间轴缩略图
 */
export function MiniMap({
  nodes,
  scrollX,
  canvasWidth,
  containerWidth,
  onScrollChange,
}: MiniMapProps) {
  const mapWidth = 200;
  const mapHeight = 24;
  
  const scale = mapWidth / canvasWidth;
  const viewportWidth = containerWidth * scale;
  const viewportX = -scrollX * scale;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const targetX = clickX / scale;
    const newScrollX = -(targetX - containerWidth / 2);
    const maxScroll = 0;
    const minScroll = -(canvasWidth - containerWidth);
    onScrollChange(Math.max(minScroll, Math.min(maxScroll, newScrollX)));
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'rgba(10, 10, 25, 0.9)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <svg width={mapWidth} height={mapHeight} onClick={handleClick} style={{ cursor: 'pointer' }}>
        {/* 星点 */}
        {nodes.map((node) => {
          const x = node.position.x * scale;
          const color = emotionColors[node.dream.emotionTag].primary;
          return (
            <circle
              key={node.dream.id}
              cx={x}
              cy={mapHeight / 2}
              r={node.isPrimaryStar ? 2.5 : 1.5}
              fill={color}
              opacity={node.isPrimaryStar ? 0.9 : 0.5}
            />
          );
        })}
        {/* 视口指示器 */}
        <rect
          x={Math.max(0, viewportX)}
          y={2}
          width={Math.min(viewportWidth, mapWidth - Math.max(0, viewportX))}
          height={mapHeight - 4}
          fill="rgba(139, 92, 246, 0.2)"
          stroke="rgba(139, 92, 246, 0.6)"
          strokeWidth={1}
          rx={2}
        />
      </svg>
    </div>
  );
}
