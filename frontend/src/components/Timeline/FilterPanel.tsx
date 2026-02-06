import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DateRangePicker } from './DateRangePicker';
import { EmotionMultiSelect } from './EmotionMultiSelect';
import { ClarityRangeSlider } from './ClarityRangeSlider';
import type { FilterPanelProps } from './types';
import type { EmotionTag, ClarityRating } from '../../../../shared/types/dream';

/**
 * 筛选器面板组件 - 气泡菜单形式
 */
export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleDateRangeChange = (range: { start: string; end: string } | undefined) => {
    onFiltersChange({ ...filters, dateRange: range });
  };

  const handleEmotionsChange = (emotions: EmotionTag[]) => {
    onFiltersChange({ ...filters, emotions: emotions.length > 0 ? emotions : undefined });
  };

  const handleClarityChange = (range: { min: ClarityRating; max: ClarityRating } | undefined) => {
    onFiltersChange({ ...filters, clarityMin: range?.min, clarityMax: range?.max });
  };

  const handleClearAll = () => {
    onFiltersChange({});
  };

  const activeFilterCount = [
    filters.dateRange,
    filters.emotions && filters.emotions.length > 0,
    filters.clarityMin || filters.clarityMax,
  ].filter(Boolean).length;

  // 计算弹出位置
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 360;
      const popoverHeight = 400;
      
      let left = rect.left;
      let top = rect.bottom + 8;
      
      // 防止超出右边界
      if (left + popoverWidth > window.innerWidth - 20) {
        left = window.innerWidth - popoverWidth - 20;
      }
      // 防止超出底部
      if (top + popoverHeight > window.innerHeight - 20) {
        top = rect.top - popoverHeight - 8;
      }
      
      setPopoverPosition({ top, left });
    }
  }, [isOpen]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        triggerRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* 极细磨砂条触发器 */}
      <div 
        className="flex items-center justify-between px-4 py-2.5 rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 text-sm transition-colors group"
        >
          <svg
            className={`w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-all duration-300 ${isOpen ? 'rotate-180 text-gray-300' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          <span className={`font-light tracking-wide ${isOpen ? 'text-gray-200' : 'text-gray-400 group-hover:text-gray-200'}`}>
            筛选
          </span>
          {activeFilterCount > 0 && (
            <span 
              className="px-2 py-0.5 text-xs rounded-full text-white font-medium"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(6, 182, 212, 0.8))',
                boxShadow: '0 0 12px rgba(139, 92, 246, 0.4)',
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            清除
          </button>
        )}
      </div>

      {/* 气泡菜单弹出层 */}
      {isOpen && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-50 w-[360px] rounded-2xl overflow-hidden filter-popover"
          style={{
            top: popoverPosition.top,
            left: popoverPosition.left,
            background: 'rgba(20, 20, 35, 0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.1)',
          }}
        >
          {/* 弹出层头部 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <span className="text-sm font-light text-gray-200 tracking-wide">筛选条件</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 筛选内容 */}
          <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* 日期范围选择 */}
            <DateRangePicker
              startDate={filters.dateRange?.start}
              endDate={filters.dateRange?.end}
              onChange={handleDateRangeChange}
            />

            {/* 情绪标签多选 */}
            <EmotionMultiSelect
              selected={filters.emotions || []}
              onChange={handleEmotionsChange}
            />

            {/* 清晰度范围滑块 */}
            <ClarityRangeSlider
              min={filters.clarityMin}
              max={filters.clarityMax}
              onChange={handleClarityChange}
            />
          </div>

          {/* 底部操作 */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              重置全部
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2 text-sm text-white rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.7), rgba(6, 182, 212, 0.7))',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
              }}
            >
              应用筛选
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
