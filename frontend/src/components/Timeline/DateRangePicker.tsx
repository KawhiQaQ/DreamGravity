import type { DateRangePickerProps } from './types';

/**
 * 日期范围选择器组件
 * Requirements: 7.4
 */
export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    if (newStart && endDate) {
      onChange({ start: newStart, end: endDate });
    } else if (newStart) {
      // 如果只有开始日期，设置结束日期为今天
      onChange({ start: newStart, end: new Date().toISOString().split('T')[0] });
    } else if (!newStart && !endDate) {
      onChange(undefined);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    if (startDate && newEnd) {
      onChange({ start: startDate, end: newEnd });
    } else if (newEnd) {
      // 如果只有结束日期，设置开始日期为一年前
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      onChange({ start: oneYearAgo.toISOString().split('T')[0], end: newEnd });
    } else if (!startDate && !newEnd) {
      onChange(undefined);
    }
  };

  const handleClear = () => {
    onChange(undefined);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-dream-text">
          日期范围
        </label>
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-gray-400 hover:text-purple-300 transition-colors"
          >
            清除
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={startDate || ''}
          onChange={handleStartChange}
          className="flex-1 px-3 py-2.5 rounded-xl text-sm text-gray-200 transition-all duration-300 focus:outline-none"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1.5px solid rgba(255, 255, 255, 0.1)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
            e.target.style.boxShadow = '0 0 12px rgba(139, 92, 246, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.boxShadow = 'none';
          }}
        />
        <span className="text-gray-500 text-sm">至</span>
        <input
          type="date"
          value={endDate || ''}
          onChange={handleEndChange}
          className="flex-1 px-3 py-2.5 rounded-xl text-sm text-gray-200 transition-all duration-300 focus:outline-none"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1.5px solid rgba(255, 255, 255, 0.1)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
            e.target.style.boxShadow = '0 0 12px rgba(139, 92, 246, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>
    </div>
  );
}
