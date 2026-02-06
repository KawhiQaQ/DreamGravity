/**
 * Dream Pattern Recognition Service
 * Analyzes dreams to identify patterns like stress-induced dreams
 */

import { getAIService } from './ai';
import { getDreamById, getDreams } from '../dao/dreamDao';
import { savePattern, getPatternsByDreamId, deletePatternsByDreamId } from '../dao/patternDao';
import { getFollowupsByDreamId } from '../dao/followupDao';
import type { DreamPattern, PatternType, DreamEntry } from '../../../shared/types/dream';

/**
 * AI分析结果接口
 */
interface PatternAnalysisResult {
  patternType: PatternType;
  stressSource?: string;
  description: string;
  confidence: number;
}

/**
 * Analyze a dream for patterns using AI
 */
export async function analyzeDreamPattern(dreamId: string): Promise<DreamPattern[]> {
  const dream = getDreamById(dreamId);
  if (!dream) {
    throw new Error(`Dream with id '${dreamId}' not found`);
  }

  // Delete existing patterns for this dream
  deletePatternsByDreamId(dreamId);

  const aiService = getAIService();
  
  // Get followups for context
  const followups = getFollowupsByDreamId(dreamId);
  const hasFollowups = followups.length > 0;
  const cameTrueFollowups = followups.filter(f => f.cameTrue);

  // Build context for AI analysis
  const context = buildPatternAnalysisContext(dream, followups);
  
  // Call AI for pattern analysis
  const patterns = await analyzeWithAI(aiService, context, hasFollowups, cameTrueFollowups.length > 0);

  // Save patterns to database
  const savedPatterns: DreamPattern[] = [];
  for (const pattern of patterns) {
    const saved = savePattern(
      dreamId,
      pattern.patternType,
      pattern.description,
      pattern.confidence,
      pattern.stressSource
    );
    savedPatterns.push(saved);
  }

  return savedPatterns;
}

/**
 * Build context string for AI analysis
 */
function buildPatternAnalysisContext(dream: DreamEntry, followups: { content: string; cameTrue: boolean }[]): string {
  let context = `梦境内容：${dream.content}\n`;
  context += `情绪标签：${dream.emotionTag}\n`;
  context += `清晰度：${dream.clarity}/5\n`;
  context += `是否重复梦境：${dream.isRecurring ? '是' : '否'}\n`;
  
  if (dream.analysis) {
    context += `\n已有分析：\n`;
    if (dream.analysis.emotionAnalysis) {
      context += `主要情绪：${dream.analysis.emotionAnalysis.primaryEmotion}\n`;
      context += `潜在压力源：${dream.analysis.emotionAnalysis.potentialStress.join(', ')}\n`;
    }
  }

  if (followups.length > 0) {
    context += `\n后续关联记录：\n`;
    followups.forEach((f, i) => {
      context += `${i + 1}. ${f.content} (${f.cameTrue ? '已成真' : '未成真'})\n`;
    });
  }

  return context;
}

/**
 * Call AI service for pattern analysis
 */
async function analyzeWithAI(
  aiService: ReturnType<typeof getAIService>,
  context: string,
  hasFollowups: boolean,
  hasTrueFollowups: boolean
): Promise<PatternAnalysisResult[]> {
  const systemPrompt = `你是一位专业的梦境分析专家，擅长识别梦境中的模式和潜在含义。请以JSON格式返回分析结果。`;
  
  const userPrompt = `请分析以下梦境并识别可能的模式。

${context}

请识别以下类型的模式（如果存在）：
1. stress - 压力源引发的梦境（识别具体压力源）
2. recurring_theme - 重复出现的主题模式
3. emotional - 情绪相关的梦境模式
4. predictive - 预示性梦境（仅当有后续关联且成真时考虑）

请以JSON数组格式返回分析结果，每个模式包含：
- patternType: 模式类型
- stressSource: 压力源（仅stress类型需要）
- description: 模式描述
- confidence: 置信度(0-1)

只返回JSON数组，不要其他内容。如果没有明显模式，返回空数组[]。

${hasTrueFollowups ? '注意：此梦境有后续关联且已成真，请考虑是否为预示性梦境。' : ''}`;

  try {
    const response = await aiService.chat(systemPrompt, userPrompt);
    
    // Parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const patterns = JSON.parse(jsonMatch[0]) as PatternAnalysisResult[];
    
    // Validate and filter patterns
    return patterns.filter(p => 
      ['stress', 'recurring_theme', 'emotional', 'predictive'].includes(p.patternType) &&
      typeof p.description === 'string' &&
      typeof p.confidence === 'number' &&
      p.confidence >= 0 && p.confidence <= 1
    );
  } catch (error) {
    console.error('Pattern analysis failed:', error);
    return [];
  }
}

/**
 * Get pattern summary for multiple dreams
 */
export async function getPatternSummary(): Promise<{
  stressSources: { source: string; count: number }[];
  patternTypes: { type: PatternType; count: number }[];
  predictiveDreams: number;
}> {
  const { data: dreams } = getDreams({ limit: 1000 });
  
  const stressSourceMap = new Map<string, number>();
  const patternTypeMap = new Map<PatternType, number>();
  let predictiveDreams = 0;

  for (const dream of dreams) {
    const patterns = getPatternsByDreamId(dream.id);
    for (const pattern of patterns) {
      // Count pattern types
      patternTypeMap.set(pattern.patternType, (patternTypeMap.get(pattern.patternType) || 0) + 1);
      
      // Count stress sources
      if (pattern.stressSource) {
        stressSourceMap.set(pattern.stressSource, (stressSourceMap.get(pattern.stressSource) || 0) + 1);
      }
      
      // Count predictive dreams
      if (pattern.patternType === 'predictive') {
        predictiveDreams++;
      }
    }
  }

  return {
    stressSources: Array.from(stressSourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
    patternTypes: Array.from(patternTypeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    predictiveDreams,
  };
}
