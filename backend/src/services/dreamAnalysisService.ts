/**
 * Dream Analysis Service
 * Orchestrates AI analysis and persists results to database
 */

import { getAIService } from './ai';
import { getDreamById, saveDreamAnalysis, updateDreamImageUrl, updateGeneratedStory, updateGeneratedPoem } from '../dao/dreamDao';
import { downloadAndSaveImage } from './imageService';
import type { DreamAnalysis, SymbolAnalysis, EmotionAnalysis } from '../../../shared/types/dream';

/**
 * Full analysis result including both symbol and emotion analysis
 */
export interface FullAnalysisResult {
  symbolAnalysis: SymbolAnalysis;
  emotionAnalysis: EmotionAnalysis;
}

/**
 * Analyze a dream's symbols and emotions
 * @param dreamId - ID of the dream to analyze
 * @returns The analysis result
 * @throws Error if dream not found or AI service fails
 */
export async function analyzeDream(dreamId: string): Promise<DreamAnalysis> {
  // Get the dream
  const dream = getDreamById(dreamId);
  if (!dream) {
    throw new Error(`Dream with id '${dreamId}' not found`);
  }

  const aiService = getAIService();

  // Run both analyses in parallel for better performance
  const [symbolAnalysis, emotionAnalysis] = await Promise.all([
    aiService.analyzeSymbols(dream.content),
    aiService.analyzeEmotions(dream.content),
  ]);

  // Save the analysis to database
  const analysis = saveDreamAnalysis(dreamId, symbolAnalysis, emotionAnalysis);

  if (!analysis) {
    throw new Error('Failed to save dream analysis');
  }

  return analysis;
}

/**
 * Analyze only symbols in a dream (without persisting)
 * @param content - Dream content to analyze
 * @returns Symbol analysis result
 */
export async function analyzeSymbolsOnly(content: string): Promise<SymbolAnalysis> {
  const aiService = getAIService();
  return aiService.analyzeSymbols(content);
}

/**
 * Analyze only emotions in a dream (without persisting)
 * @param content - Dream content to analyze
 * @returns Emotion analysis result
 */
export async function analyzeEmotionsOnly(content: string): Promise<EmotionAnalysis> {
  const aiService = getAIService();
  return aiService.analyzeEmotions(content);
}

/**
 * Generate creative content for a dream
 * @param dreamId - ID of the dream
 * @param format - 'story' or 'poem'
 * @returns Generated creative content
 */
export async function generateCreativeContent(
  dreamId: string,
  format: 'story' | 'poem'
): Promise<string> {
  const dream = getDreamById(dreamId);
  if (!dream) {
    throw new Error(`Dream with id '${dreamId}' not found`);
  }

  if (!dream.analysis) {
    throw new Error('Dream has no analysis yet. Please analyze the dream first.');
  }

  const aiService = getAIService();
  const content = await aiService.generateCreative(dream.content, format);

  // 使用专门的更新函数，避免并发覆盖问题
  if (format === 'story') {
    updateGeneratedStory(dreamId, content);
  } else {
    updateGeneratedPoem(dreamId, content);
  }

  return content;
}

/**
 * Generate an image for a dream
 * @param dreamId - ID of the dream
 * @returns URL of the generated image (local path)
 */
export async function generateDreamImage(dreamId: string): Promise<string> {
  const dream = getDreamById(dreamId);
  if (!dream) {
    throw new Error(`Dream with id '${dreamId}' not found`);
  }

  const aiService = getAIService();
  const remoteImageUrl = await aiService.generateImage(dream.content);
  
  // 下载图片并保存到本地
  console.log('[generateDreamImage] 正在下载并保存图片到本地...');
  const localImageUrl = await downloadAndSaveImage(remoteImageUrl, 'dream', dreamId);
  console.log('[generateDreamImage] 图片保存成功:', localImageUrl);

  // Save the local image URL to the dream
  const updatedDream = updateDreamImageUrl(dreamId, localImageUrl);
  if (!updatedDream) {
    throw new Error('Failed to save image URL');
  }

  return localImageUrl;
}

/**
 * Get analysis for a dream, or analyze if not exists
 * @param dreamId - ID of the dream
 * @param forceReanalyze - If true, re-analyze even if analysis exists
 * @returns The analysis result
 */
export async function getOrAnalyzeDream(
  dreamId: string,
  forceReanalyze = false
): Promise<DreamAnalysis> {
  const dream = getDreamById(dreamId);
  if (!dream) {
    throw new Error(`Dream with id '${dreamId}' not found`);
  }

  // Return existing analysis if available and not forcing re-analysis
  if (dream.analysis && !forceReanalyze) {
    return dream.analysis;
  }

  // Perform new analysis
  return analyzeDream(dreamId);
}
