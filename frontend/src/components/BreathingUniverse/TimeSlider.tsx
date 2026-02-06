/**
 * 时间切片滑块组件
 */
import { memo, useMemo } from 'react';
import type { TimeSlice } from './types';
import { generateTimeSliceOptions, formatDateRange } from './utils';

interface TimeSliderProps {
  currentSlice: TimeSlice;
  showAllTime: boolean;
  onSliceChange: (slice: TimeSlice) => void;
  onToggleAllTime: () => void;
}

export const TimeSlider = memo(function TimeSlider({
  currentSlice,
  showAllTime,
  onSliceChange,
  onToggleAllTime
}: TimeSliderProps) {
  const timeOptions = useMemo(() => generateTimeSliceOptions(), []);
  
  // 找到当前选中的索引
  const currentIndex = useMemo(() => {
    return timeOptions.findIndex(opt => opt.label === currentSlice.label);
  }, [timeOptions, currentSlice]);
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    if (index >= 0 && index < timeOptions.length) {
      onSliceChange(timeOptions[index]);
    }
  };
  
  return (
    <div className="time-slider glass-card p-4 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">⏰</span>
          <span className="text-sm font-medium text-dream-text">时间切片</span>
        </div>
        
        <button
          onClick={onToggleAllTime}
          className={`px-3 py-1 text-xs rounded-full transition-all ${
            showAllTime
              ? 'bg-dream-neon-purple/30 text-dream-neon-purple border border-dream-neon-purple/50'
              : 'bg-white/10 text-dream-text-secondary hover:bg-white/20'
          }`}
        >
          {showAllTime ? '✓ 显示全部' : '显示全部'}
        </button>
      </div>
      
      {!showAllTime && (
        <>
          {/* 滑块 */}
          <div className="relative mb-2">
            {/* 刻度标记 - 在滑块上方 */}
            <div className="absolute -top-1 left-0 right-0 flex justify-between px-2">
              {timeOptions.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-dream-neon-purple' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            
            <input
              type="range"
              min={0}
              max={timeOptions.length - 1}
              value={currentIndex >= 0 ? currentIndex : 1}
              onChange={handleSliderChange}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer mt-3
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-5
                         [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-dream-neon-purple
                         [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(139,92,246,0.6)]
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:transition-all
                         [&::-webkit-slider-thumb]:hover:scale-110"
            />
          </div>
          
          {/* 当前选择显示 */}
          <div className="text-center mt-4">
            <div className="text-sm font-medium text-dream-neon-cyan">
              {currentSlice.label}
            </div>
            <div className="text-xs text-dream-text-secondary mt-1">
              {formatDateRange(currentSlice.startDate, currentSlice.endDate)}
            </div>
          </div>
          
          {/* 快捷按钮 */}
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {timeOptions.slice(0, 3).map((option, i) => (
              <button
                key={i}
                onClick={() => onSliceChange(option)}
                className={`px-2 py-1 text-xs rounded-lg transition-all ${
                  option.label === currentSlice.label
                    ? 'bg-dream-neon-purple/30 text-dream-neon-purple'
                    : 'bg-white/5 text-dream-text-secondary hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
      
      {showAllTime && (
        <div className="text-center text-sm text-dream-text-secondary py-2">
          显示所有时间的梦境元素
        </div>
      )}
    </div>
  );
});
