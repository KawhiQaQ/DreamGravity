import type { CalendarHeaderProps } from './types';

/**
 * 格式化月份显示
 */
function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = date.toLocaleDateString('zh-CN', { month: 'long' });
  return `${year}年${month}`;
}

/**
 * 记忆星图日历头部组件
 */
export function CalendarHeader({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      {/* 月份切换按钮 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-2 rounded-lg transition-all duration-300 hover:bg-white/5 group"
          aria-label="上个月"
        >
          <svg
            className="w-4 h-4 text-gray-400 group-hover:text-gray-200 transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-2 rounded-lg transition-all duration-300 hover:bg-white/5 group"
          aria-label="下个月"
        >
          <svg
            className="w-4 h-4 text-gray-400 group-hover:text-gray-200 transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 当前月份显示 - 金属质感渐变银白色 */}
      <h2 className="text-lg font-semibold metallic-text tracking-wider">
        {formatMonth(currentMonth)}
      </h2>

      {/* 返回今天按钮 */}
      <button
        type="button"
        onClick={onToday}
        className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-white/5"
      >
        今天
      </button>
    </div>
  );
}
