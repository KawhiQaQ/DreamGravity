import type { DreamPreview } from '../../../../shared/types/dream';
import type { DreamFilters } from '../../../../shared/types/api';

/**
 * 日历组件属性
 * Requirements: 8.1, 8.2, 8.5
 */
export interface CalendarProps {
  dreams: DreamPreview[];
  currentMonth: Date;
  filters: DreamFilters;
  onDateClick: (date: Date, dreams: DreamPreview[]) => void;
  onMonthChange: (month: Date) => void;
  onDreamHover: (dream: DreamPreview | null) => void;
  onDreamClick: (id: string) => void;
  onDreamDelete: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  isLoading?: boolean;
  selectionMode?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

/**
 * 日历日期单元格属性
 */
export interface CalendarDayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dreams: DreamPreview[];
  onDateClick: (date: Date, dreams: DreamPreview[]) => void;
  onDreamHover: (dream: DreamPreview | null) => void;
  onDreamClick: (id: string) => void;
  onDreamDelete: (id: string) => void;
  selectionMode?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (id: string, selected: boolean) => void;
}

/**
 * 日历头部属性
 */
export interface CalendarHeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

/**
 * 梦境预览弹窗属性
 */
export interface DreamPreviewPopupProps {
  dream: DreamPreview;
  position: { x: number; y: number };
}

/**
 * 日期与梦境映射
 */
export type DreamsByDate = Map<string, DreamPreview[]>;
