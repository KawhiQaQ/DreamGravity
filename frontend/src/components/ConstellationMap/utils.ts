import type { DreamPreview, EmotionTag } from '../../../../shared/types/dream';
import type { StarNode } from './types';

// 情绪能量值：影响Y轴位置（在固定范围内）
const emotionEnergy: Record<EmotionTag, number> = {
  excited: 0.95, happy: 0.9, loving: 0.85, hopeful: 0.8,
  curious: 0.6, surprised: 0.55, peaceful: 0.5, nostalgic: 0.45, neutral: 0.4,
  confused: 0.3, lonely: 0.25, sad: 0.2, anxious: 0.15, scared: 0.1, angry: 0.05,
};

// 情绪对应的星球颜色
export const emotionColors: Record<EmotionTag, { primary: string; glow: string }> = {
  happy: { primary: '#fbbf24', glow: 'rgba(251, 191, 36, 0.6)' },
  excited: { primary: '#fb923c', glow: 'rgba(251, 146, 60, 0.6)' },
  peaceful: { primary: '#34d399', glow: 'rgba(52, 211, 153, 0.5)' },
  hopeful: { primary: '#facc15', glow: 'rgba(250, 204, 21, 0.6)' },
  loving: { primary: '#f472b6', glow: 'rgba(244, 114, 182, 0.6)' },
  sad: { primary: '#60a5fa', glow: 'rgba(96, 165, 250, 0.6)' },
  anxious: { primary: '#a78bfa', glow: 'rgba(167, 139, 250, 0.6)' },
  angry: { primary: '#f87171', glow: 'rgba(248, 113, 113, 0.6)' },
  scared: { primary: '#c084fc', glow: 'rgba(192, 132, 252, 0.6)' },
  lonely: { primary: '#818cf8', glow: 'rgba(129, 140, 248, 0.6)' },
  confused: { primary: '#c4b5fd', glow: 'rgba(196, 181, 253, 0.6)' },
  nostalgic: { primary: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.5)' },
  curious: { primary: '#22d3ee', glow: 'rgba(34, 211, 238, 0.6)' },
  surprised: { primary: '#a3e635', glow: 'rgba(163, 230, 53, 0.5)' },
  neutral: { primary: '#94a3b8', glow: 'rgba(148, 163, 184, 0.5)' },
};

// 情绪中文标签
export const emotionLabels: Record<EmotionTag, string> = {
  happy: '愉快', excited: '兴奋', peaceful: '平静', hopeful: '希望', loving: '温馨',
  sad: '悲伤', anxious: '焦虑', angry: '愤怒', scared: '恐惧', lonely: '孤独',
  confused: '困惑', nostalgic: '怀旧', curious: '好奇', surprised: '惊讶', neutral: '平淡',
};

/**
 * 计算星球大小 - 固定大小，不受筛选影响
 */
export function calculateStarSize(dream: DreamPreview): { size: number; isPrimaryStar: boolean } {
  const contentLength = dream.content.length;
  const clarity = dream.clarity;
  
  // 基础大小调大
  const baseSize = 74;
  // 内容长度加成
  const contentBonus = Math.min(contentLength / 30, 28);
  // 清晰度加成
  const clarityBonus = (clarity - 1) * 8;
  
  const size = baseSize + contentBonus + clarityBonus;
  const isPrimaryStar = clarity >= 4 || contentLength >= 200 || size >= 90;
  
  return { size, isPrimaryStar };
}

/**
 * 生成星球位置 - 横向长河布局
 * X轴：时间流（左旧右新），间距固定确保屏幕内有3-5个星球
 * Y轴：限制在22%-82%区域内，整体下移，减少底部留空
 */
export function generateStarPositions(
  dreams: DreamPreview[],
  viewportHeight: number
): StarNode[] {
  if (dreams.length === 0) return [];

  // 按日期排序（旧->新）
  const sortedDreams = [...dreams].sort(
    (a, b) => new Date(a.dreamDate).getTime() - new Date(b.dreamDate).getTime()
  );

  // 固定水平间距，确保100%缩放时屏幕内有3-5个星球
  const horizontalSpacing = 280;
  const startX = 150;
  
  // Y轴范围：22%-82%（整体下移，减少底部留空）
  const yMin = viewportHeight * 0.22;
  const yMax = viewportHeight * 0.82;
  const yRange = yMax - yMin;

  const nodes: StarNode[] = [];

  sortedDreams.forEach((dream, index) => {
    const { size, isPrimaryStar } = calculateStarSize(dream);
    
    // X轴：固定间距排列
    const x = startX + index * horizontalSpacing;
    
    // Y轴：基于情绪能量 + 随机偏移
    const energy = emotionEnergy[dream.emotionTag] || 0.5;
    const baseY = yMin + (1 - energy) * yRange;
    const randomOffset = (Math.random() - 0.5) * (yRange * 0.25);
    const y = Math.max(yMin, Math.min(yMax, baseY + randomOffset));

    nodes.push({
      dream,
      position: { x, y },
      size,
      isPrimaryStar,
    });
  });

  return nodes;
}

/**
 * 计算画布总宽度
 */
export function calculateCanvasWidth(dreamCount: number): number {
  const horizontalSpacing = 280;
  const padding = 300;
  return Math.max(800, dreamCount * horizontalSpacing + padding);
}

/**
 * 格式化日期
 */
export function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

/**
 * 获取内容预览
 */
export function getContentPreview(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

/**
 * 提取关键词（简单实现）
 */
export function extractKeywords(content: string): string[] {
  // 简单提取：取前几个有意义的词
  const words = content
    .replace(/[，。！？、；：""''（）\[\]【】]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && w.length <= 6)
    .slice(0, 3);
  return words;
}
