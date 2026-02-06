/**
 * 潜意识回响 - 梦境碎片类型定义
 */

/**
 * 梦境碎片展示模式
 */
export type EchoDisplayMode = 'keywords' | 'sentence';

/**
 * 梦境碎片数据
 */
export interface DreamFragment {
  id: string;
  dreamId: string;
  displayMode: EchoDisplayMode;
  keywords?: string[];
  sentence?: string;
  dreamDate: string;
  emotionTag: string;
}
