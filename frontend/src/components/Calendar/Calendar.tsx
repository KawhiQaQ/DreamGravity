import { useMemo } from 'react';
import { CalendarHeader } from './CalendarHeader';
import { CalendarDayCell } from './CalendarDayCell';
import type { CalendarProps, DreamsByDate } from './types';
import type { DreamPreview } from '../../../../shared/types/dream';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];
  
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  // 只填充到35格（5行），不需要第6行
  const remainingDays = 35 - days.length;
  if (remainingDays > 0) {
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
  }
  
  return days.slice(0, 35); // 确保最多35格
}

function formatDateKey(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function groupDreamsByDate(dreams: DreamPreview[]): DreamsByDate {
  const map = new Map<string, DreamPreview[]>();
  dreams.forEach(dream => {
    const dateKey = formatDateKey(new Date(dream.dreamDate));
    const existing = map.get(dateKey) || [];
    map.set(dateKey, [...existing, dream]);
  });
  return map;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

export function Calendar({
  dreams,
  currentMonth,
  onDateClick,
  onMonthChange,
  onDreamHover,
  onDreamClick,
  onDreamDelete,
  onBatchDelete,
  isLoading = false,
  selectionMode = false,
  selectedIds = [],
  onSelectionChange,
}: CalendarProps) {
  const today = new Date();
  
  const calendarDays = useMemo(() => {
    return getCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth]);
  
  const dreamsByDate = useMemo(() => {
    return groupDreamsByDate(dreams);
  }, [dreams]);
  
  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    onMonthChange(newMonth);
  };
  
  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    onMonthChange(newMonth);
  };
  
  const handleToday = () => {
    onMonthChange(new Date());
  };

  const handleSelectionChange = (id: string, selected: boolean) => {
    if (!onSelectionChange) return;
    if (selected) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(i => i !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 animate-spin opacity-30 blur-sm" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 animate-pulse" />
        </div>
        <p className="text-gray-400/80 text-sm tracking-wide">星图加载中...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0">
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
        />
      </div>
      
      {/* 批量操作栏 */}
      {selectionMode && selectedIds.length > 0 && (
        <div className="flex-shrink-0 flex items-center justify-between mb-2 p-2 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <span className="text-sm text-gray-300">已选择 {selectedIds.length} 颗星尘</span>
          <button
            onClick={() => onBatchDelete(selectedIds)}
            className="px-3 py-1 text-sm bg-red-500/60 hover:bg-red-500/80 text-white rounded-lg transition-colors"
          >
            删除选中
          </button>
        </div>
      )}
      
      {/* 星期标题 */}
      <div className="flex-shrink-0 grid grid-cols-7 mb-1">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs font-light py-1.5 tracking-wider ${
              index === 0 || index === 6 ? 'text-purple-400/70' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* 日历网格 - 填充剩余空间，5行 */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-1 min-h-0">
        {calendarDays.map((date, index) => {
          const dateKey = formatDateKey(date);
          const dateDreams = dreamsByDate.get(dateKey) || [];
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(date, today);
          
          return (
            <CalendarDayCell
              key={`${dateKey}-${index}`}
              date={date}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              dreams={dateDreams}
              onDateClick={onDateClick}
              onDreamHover={onDreamHover}
              onDreamClick={onDreamClick}
              onDreamDelete={onDreamDelete}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onSelectionChange={handleSelectionChange}
            />
          );
        })}
      </div>
    </div>
  );
}
