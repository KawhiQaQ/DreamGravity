/**
 * 情绪标签枚举
 * 用于标记梦境的主要情绪
 */
export type EmotionTag = 
  | 'happy' | 'excited' | 'peaceful' | 'hopeful' | 'loving'
  | 'sad' | 'anxious' | 'angry' | 'scared' | 'lonely'
  | 'confused' | 'nostalgic' | 'curious' | 'surprised' | 'neutral';

/**
 * 所有有效的情绪标签值
 */
export const EMOTION_TAGS: EmotionTag[] = [
  'happy', 'excited', 'peaceful', 'hopeful', 'loving',
  'sad', 'anxious', 'angry', 'scared', 'lonely',
  'confused', 'nostalgic', 'curious', 'surprised', 'neutral'
];

/**
 * 情绪标签中文映射
 */
export const EmotionTagLabels: Record<EmotionTag, string> = {
  happy: '愉快',
  excited: '兴奋',
  peaceful: '平静',
  hopeful: '希望',
  loving: '温馨',
  sad: '悲伤',
  anxious: '焦虑',
  angry: '愤怒',
  scared: '恐惧',
  lonely: '孤独',
  confused: '困惑',
  nostalgic: '怀旧',
  curious: '好奇',
  surprised: '惊讶',
  neutral: '平淡',
};

/**
 * 清晰度评分类型 (1-5星)
 */
export type ClarityRating = 1 | 2 | 3 | 4 | 5;

/**
 * 清晰度范围常量
 */
export const CLARITY_MIN = 1;
export const CLARITY_MAX = 5;

/**
 * 象征元素类型
 */
export type SymbolElementType = 'person' | 'object' | 'scene' | 'action';

/**
 * 象征元素
 */
export interface SymbolElement {
  name: string;
  type: SymbolElementType;
  meaning: string;
}

/**
 * 象征意义分析结果
 */
export interface SymbolAnalysis {
  elements: SymbolElement[];
  fallback?: boolean;
}

/**
 * 情绪分析结果
 */
export interface EmotionAnalysis {
  primaryEmotion: string;
  emotionIntensity: number;
  potentialStress: string[];
  psychologicalInsight: string;
}

/**
 * 梦境解析结果
 */
export interface DreamAnalysis {
  id: string;
  dreamId: string;
  symbolAnalysis: SymbolAnalysis;
  emotionAnalysis: EmotionAnalysis;
  generatedStory?: string;
  generatedPoem?: string;
  createdAt: Date;
}

/**
 * 梦境记录实体
 */
export interface DreamEntry {
  id: string;
  content: string;
  dreamDate: Date;
  sleepStartTime?: string;
  sleepEndTime?: string;
  emotionTag: EmotionTag;
  clarity: ClarityRating;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
  analysis?: DreamAnalysis;
  imageUrl?: string;
  followups?: DreamFollowup[];
  patterns?: DreamPattern[];
}

/**
 * 梦境预览（用于列表展示）
 */
export interface DreamPreview {
  id: string;
  content: string;
  dreamDate: Date;
  sleepStartTime?: string;
  sleepEndTime?: string;
  emotionTag: EmotionTag;
  clarity: ClarityRating;
  isRecurring: boolean;
  hasAnalysis: boolean;
  hasImage: boolean;
  hasFollowup: boolean;
  imageUrl?: string;
}

/**
 * 梦境后续关联
 */
export interface DreamFollowup {
  id: string;
  dreamId: string;
  content: string;
  cameTrue: boolean;
  followupDate: Date;
  createdAt: Date;
}

/**
 * 梦境模式类型
 */
export type PatternType = 'stress' | 'recurring_theme' | 'emotional' | 'predictive';

/**
 * 梦境模式识别结果
 */
export interface DreamPattern {
  id: string;
  dreamId: string;
  patternType: PatternType;
  stressSource?: string;
  patternDescription: string;
  confidence: number;
  createdAt: Date;
}
