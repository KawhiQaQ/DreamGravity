import type { EmotionTag, ClarityRating, DreamPreview } from '../../../../shared/types/dream';
import type { DreamFilters } from '../../../../shared/types/api';

/**
 * 时间轴组件属性
 */
export interface TimelineProps {
  dreams: DreamPreview[];
  filters: DreamFilters;
  onDreamClick: (id: string) => void;
  onDreamHover: (id: string | null) => void;
  onDreamDelete: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  isLoading?: boolean;
  selectionMode?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

/**
 * 时间轴节点属性
 */
export interface TimelineNodeProps {
  dream: DreamPreview;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDelete: () => void;
  isHovered: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

/**
 * 筛选器组件属性
 */
export interface FilterPanelProps {
  filters: DreamFilters;
  onFiltersChange: (filters: DreamFilters) => void;
}

/**
 * 日期范围选择器属性
 */
export interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange: (range: { start: string; end: string } | undefined) => void;
}

/**
 * 情绪多选器属性
 */
export interface EmotionMultiSelectProps {
  selected: EmotionTag[];
  onChange: (emotions: EmotionTag[]) => void;
}

/**
 * 清晰度范围滑块属性
 */
export interface ClarityRangeSliderProps {
  min?: ClarityRating;
  max?: ClarityRating;
  onChange: (range: { min: ClarityRating; max: ClarityRating } | undefined) => void;
}
