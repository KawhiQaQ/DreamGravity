/**
 * 呼吸宇宙 - 工具函数
 */
import type { DreamElementNode, DreamElementLink } from '../../../../shared/types/api';
import type { SemanticCategory, Nebula, UniverseNode, TimeSlice } from './types';
import { SEMANTIC_CATEGORIES } from './types';

/**
 * 根据节点名称推断语义类别
 */
export function inferSemanticCategory(name: string, type: string): SemanticCategory {
  const lowerName = name.toLowerCase();
  
  for (const [category, config] of Object.entries(SEMANTIC_CATEGORIES)) {
    if (category === 'other') continue;
    if (config.keywords.some(kw => lowerName.includes(kw.toLowerCase()))) {
      return category as SemanticCategory;
    }
  }
  
  // 根据元素类型做默认分类
  switch (type) {
    case 'person': return 'strangers';
    case 'place': return 'buildings';
    case 'object': return 'other';
    case 'action': return 'actions';
    default: return 'other';
  }
}

/**
 * 将节点聚合成星云
 */
export function createNebulae(
  nodes: DreamElementNode[],
  canvasWidth: number,
  canvasHeight: number
): Nebula[] {
  // 按语义类别分组
  const categoryGroups = new Map<SemanticCategory, DreamElementNode[]>();
  
  nodes.forEach(node => {
    const category = inferSemanticCategory(node.name, node.type);
    if (!categoryGroups.has(category)) {
      categoryGroups.set(category, []);
    }
    categoryGroups.get(category)!.push(node);
  });
  
  // 创建星云
  const nebulae: Nebula[] = [];
  const categories = Array.from(categoryGroups.keys());
  const angleStep = (2 * Math.PI) / Math.max(categories.length, 1);
  const orbitRadius = Math.min(canvasWidth, canvasHeight) * 0.3;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  categories.forEach((category, index) => {
    const categoryNodes = categoryGroups.get(category)!;
    if (categoryNodes.length === 0) return;
    
    const config = SEMANTIC_CATEGORIES[category];
    const totalCount = categoryNodes.reduce((sum, n) => sum + n.count, 0);
    
    // 计算星云位置（环形分布）
    const angle = angleStep * index - Math.PI / 2;
    const x = centerX + Math.cos(angle) * orbitRadius;
    const y = centerY + Math.sin(angle) * orbitRadius;
    
    // 星云半径基于节点数量
    const radius = Math.sqrt(categoryNodes.length) * 20 + 40;
    
    nebulae.push({
      id: `nebula-${category}`,
      category,
      label: config.label,
      nodes: categoryNodes,
      totalCount,
      centerX: x,
      centerY: y,
      radius,
      isExpanded: false,
      color: config.color,
      icon: config.icon
    });
  });
  
  return nebulae;
}

/**
 * 展开星云，计算内部节点位置
 * 节点展开到画布中央区域，而不是星云原位置
 */
export function expandNebula(
  nebula: Nebula,
  canvasWidth: number,
  canvasHeight: number
): UniverseNode[] {
  const nodes = nebula.nodes;
  
  // 展开到画布中央
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const expandedRadius = Math.min(canvasWidth, canvasHeight) * 0.35;
  
  // 按出现次数排序
  const sortedNodes = [...nodes].sort((a, b) => b.count - a.count);
  
  return sortedNodes.map((node, index) => {
    // 螺旋分布从中心向外
    const spiralTurns = 2.5; // 螺旋圈数
    const t = index / Math.max(nodes.length - 1, 1);
    const angle = t * Math.PI * 2 * spiralTurns;
    const distance = t * expandedRadius * 0.85 + 40;
    
    return {
      ...node,
      category: nebula.category,
      nebulaId: nebula.id,
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
      opacity: 1,
      scale: 1,
      isHighlighted: false,
      isInTimeRange: true
    };
  });
}

/**
 * 应用时间切片过滤 - 不在范围内的节点直接过滤掉
 */
export function applyTimeSlice(
  nodes: UniverseNode[],
  dreamDates: Map<string, Date>,
  timeSlice: TimeSlice
): UniverseNode[] {
  return nodes.filter(node => {
    // 检查节点关联的梦境是否在时间范围内
    return node.dreamIds.some(dreamId => {
      const date = dreamDates.get(dreamId);
      if (!date) return false;
      return date >= timeSlice.startDate && date <= timeSlice.endDate;
    });
  }).map(node => ({
    ...node,
    isInTimeRange: true,
    opacity: 1,
    scale: 1
  }));
}

/**
 * 应用重力透镜效果
 */
export function applyGravityLens(
  nodes: UniverseNode[],
  links: DreamElementLink[],
  focusedNodeId: string | null
): UniverseNode[] {
  if (!focusedNodeId) {
    return nodes.map(n => ({ ...n, opacity: n.isInTimeRange ? 1 : 0.15, isHighlighted: false }));
  }
  
  // 找出与焦点节点直接相连的节点
  const connectedIds = new Set<string>([focusedNodeId]);
  links.forEach(link => {
    if (link.source === focusedNodeId) connectedIds.add(link.target);
    if (link.target === focusedNodeId) connectedIds.add(link.source);
  });
  
  return nodes.map(node => ({
    ...node,
    opacity: connectedIds.has(node.id) ? 1 : 0.1,
    isHighlighted: node.id === focusedNodeId
  }));
}

/**
 * 计算两点之间的距离
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * 生成时间切片选项
 */
export function generateTimeSliceOptions(): TimeSlice[] {
  const now = new Date();
  const options: TimeSlice[] = [];
  
  // 最近7天
  options.push({
    startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    endDate: now,
    label: '最近 7 天'
  });
  
  // 最近30天
  options.push({
    startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    endDate: now,
    label: '最近 30 天'
  });
  
  // 最近90天
  options.push({
    startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    endDate: now,
    label: '最近 3 个月'
  });
  
  // 最近半年
  options.push({
    startDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
    endDate: now,
    label: '最近半年'
  });
  
  // 最近一年
  options.push({
    startDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    endDate: now,
    label: '最近一年'
  });
  
  return options;
}

/**
 * 格式化日期范围显示
 */
export function formatDateRange(start: Date, end: Date): string {
  const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${formatDate(start)} - ${formatDate(end)}`;
}
