import type { DreamEntry, SymbolAnalysis, EmotionAnalysis } from '../../../../shared/types/dream';

/**
 * 解析卡片类型
 */
export type AnalysisCardType = 'symbol' | 'emotion' | 'story' | 'poem';

/**
 * 解析卡片组件属性
 */
export interface AnalysisCardsProps {
  dream: DreamEntry;
  onDreamUpdate: (dream: DreamEntry) => void;
}

/**
 * 单个解析卡片属性
 */
export interface SymbolCardProps {
  analysis: SymbolAnalysis;
}

export interface EmotionCardProps {
  analysis: EmotionAnalysis;
}

export interface CreativeCardProps {
  type: 'story' | 'poem';
  content: string;
}

/**
 * 加载状态
 */
export interface LoadingState {
  analyze: boolean;
  generateImage: boolean;
  generateStory: boolean;
  generatePoem: boolean;
}

/**
 * 错误状态
 */
export interface ErrorState {
  analyze: string | null;
  generateImage: string | null;
  generateStory: string | null;
  generatePoem: string | null;
}
