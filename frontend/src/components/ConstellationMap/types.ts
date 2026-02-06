import type { DreamPreview, EmotionTag } from '../../../../shared/types/dream';
import type { DreamFilters } from '../../../../shared/types/api';

export interface StarPosition {
  x: number;
  y: number;
}

export interface StarNode {
  dream: DreamPreview;
  position: StarPosition;
  size: number;
  isPrimaryStar: boolean;
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

export interface ConstellationMapProps {
  dreams: DreamPreview[];
  filters: DreamFilters;
  searchKeyword?: string;
  onDreamClick: (id: string) => void;
  onDreamDelete: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  isLoading?: boolean;
  selectionMode?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export interface StarProps {
  node: StarNode;
  isHovered: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  isHighlighted: boolean;
  selectionMode: boolean;
  screenX: number;
  screenY: number;
  containerWidth: number;
  containerHeight: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  onSelect: (selected: boolean) => void;
  onDelete: () => void;
}

export interface EmotionCluster {
  emotion: EmotionTag;
  centerX: number;
  centerY: number;
  radius: number;
}

export interface TimeMarker {
  x: number;
  label: string;
}

export interface OffscreenIndicator {
  direction: 'left' | 'right' | 'top' | 'bottom';
  count: number;
  onClick: () => void;
}
