/**
 * 格式化睡眠时间显示
 * 如果时间跨越24点（入睡时间 > 醒来时间），在醒来时间前加"次日"
 */
export function formatSleepTime(startTime?: string, endTime?: string): string {
  if (!startTime && !endTime) return '';
  
  if (startTime && endTime) {
    // 解析时间
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    
    // 如果入睡时间的小时数大于醒来时间的小时数，说明跨越了24点
    // 例如：22:00 入睡，07:00 醒来
    if (startHour > endHour || (startHour === endHour && startTime > endTime)) {
      return `${startTime} - 次日${endTime}`;
    }
    return `${startTime} - ${endTime}`;
  }
  
  if (startTime) return `入睡 ${startTime}`;
  return `醒来 ${endTime}`;
}
