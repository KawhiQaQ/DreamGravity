/**
 * 呼吸宇宙 - 类型定义
 * 解决节点爆炸问题的三大核心机制：语义聚合、时间切片、重力透镜
 */
import type { DreamElementType, DreamElementNode, DreamElementLink } from '../../../../shared/types/api';

/**
 * 语义类别 - 用于星云聚合
 */
export type SemanticCategory = 
  | 'family'      // 亲人
  | 'friends'     // 朋友
  | 'strangers'   // 陌生人
  | 'food'        // 食物
  | 'nature'      // 自然
  | 'buildings'   // 建筑
  | 'vehicles'    // 交通工具
  | 'emotions'    // 情感相关
  | 'actions'     // 动作行为
  | 'abstract'    // 抽象概念
  | 'other';      // 其他

/**
 * 语义聚合配置
 */
export const SEMANTIC_CATEGORIES: Record<SemanticCategory, {
  label: string;
  keywords: string[];
  color: string;
  icon: string;
}> = {
  family: {
    label: '亲人',
    keywords: ['父亲', '母亲', '爸爸', '妈妈', '爷爷', '奶奶', '外公', '外婆', '哥哥', '姐姐', '弟弟', '妹妹', '儿子', '女儿', '丈夫', '妻子', '家人'],
    color: '#f472b6',
    icon: '👨‍👩‍👧‍👦'
  },
  friends: {
    label: '朋友',
    keywords: ['朋友', '同学', '同事', '老友', '闺蜜', '兄弟', '伙伴'],
    color: '#60a5fa',
    icon: '🤝'
  },
  strangers: {
    label: '陌生人',
    keywords: ['陌生人', '路人', '老人', '小孩', '男人', '女人', '人群'],
    color: '#a78bfa',
    icon: '👥'
  },
  food: {
    label: '食物',
    keywords: ['苹果', '香蕉', '水果', '蔬菜', '肉', '鱼', '米饭', '面条', '蛋糕', '糖果', '饮料', '水', '酒', '食物', '吃'],
    color: '#fbbf24',
    icon: '🍎'
  },
  nature: {
    label: '自然',
    keywords: ['山', '水', '河', '海', '湖', '森林', '树', '花', '草', '天空', '云', '太阳', '月亮', '星星', '雨', '雪', '风'],
    color: '#34d399',
    icon: '🌿'
  },
  buildings: {
    label: '建筑',
    keywords: ['房子', '家', '学校', '公司', '医院', '商场', '酒店', '餐厅', '教堂', '寺庙', '城堡', '塔', '桥'],
    color: '#94a3b8',
    icon: '🏠'
  },
  vehicles: {
    label: '交通',
    keywords: ['车', '汽车', '火车', '飞机', '船', '自行车', '摩托车', '公交', '地铁', '电梯'],
    color: '#f97316',
    icon: '🚗'
  },
  emotions: {
    label: '情感',
    keywords: ['爱', '恨', '恐惧', '害怕', '开心', '悲伤', '愤怒', '焦虑', '孤独', '幸福', '痛苦'],
    color: '#ec4899',
    icon: '💖'
  },
  actions: {
    label: '动作',
    keywords: ['飞', '跑', '走', '跳', '游泳', '爬', '追', '逃', '打', '说话', '唱歌', '跳舞', '睡觉', '醒来'],
    color: '#22d3ee',
    icon: '⚡'
  },
  abstract: {
    label: '抽象',
    keywords: ['时间', '空间', '梦', '记忆', '未来', '过去', '死亡', '生命', '灵魂', '意识'],
    color: '#c084fc',
    icon: '✨'
  },
  other: {
    label: '其他',
    keywords: [],
    color: '#6b7280',
    icon: '📦'
  }
};

/**
 * 星云团（聚合后的节点组）
 */
export interface Nebula {
  id: string;
  category: SemanticCategory;
  label: string;
  nodes: DreamElementNode[];
  totalCount: number;      // 所有节点的出现次数总和
  centerX: number;
  centerY: number;
  radius: number;
  isExpanded: boolean;     // 是否已展开
  color: string;
  icon: string;
}

/**
 * 扩展的D3节点类型
 */
export interface UniverseNode {
  id: string;
  name: string;
  type: DreamElementType;
  count: number;
  dreamIds: string[];
  category: SemanticCategory;
  nebulaId?: string;       // 所属星云ID
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  // 视觉属性
  opacity: number;         // 透明度（用于重力透镜）
  scale: number;           // 缩放（用于时间切片）
  isHighlighted: boolean;  // 是否高亮
  isInTimeRange: boolean;  // 是否在时间范围内
}

/**
 * 时间切片状态
 */
export interface TimeSlice {
  startDate: Date;
  endDate: Date;
  label: string;
}

/**
 * 视图层级
 */
export type ViewLevel = 'galaxy' | 'nebula' | 'star';

/**
 * 呼吸宇宙状态
 */
export interface UniverseState {
  viewLevel: ViewLevel;
  zoomScale: number;
  focusedNodeId: string | null;
  expandedNebulaIds: Set<string>;
  timeSlice: TimeSlice;
  showAllTime: boolean;
}

/**
 * 呼吸宇宙组件Props
 */
export interface BreathingUniverseProps {
  nodes: DreamElementNode[];
  links: DreamElementLink[];
  dreamDates: Map<string, Date>;  // dreamId -> date
  onNodeClick?: (node: DreamElementNode) => void;
  onNebulaClick?: (nebula: Nebula) => void;
  className?: string;
}
