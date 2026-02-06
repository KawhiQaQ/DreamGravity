/**
 * AI Service Types
 * Defines interfaces for AI service abstraction
 */

import type { SymbolAnalysis, EmotionAnalysis } from '../../../../shared/types/dream';

/**
 * AI Service interface - abstraction for AI providers
 */
export interface AIService {
  /**
   * Analyze symbols in dream content
   * @param content - Dream content text
   * @returns Symbol analysis with key elements and meanings
   */
  analyzeSymbols(content: string): Promise<SymbolAnalysis>;

  /**
   * Analyze emotions in dream content
   * @param content - Dream content text
   * @returns Emotion analysis with primary emotion and psychological insights
   */
  analyzeEmotions(content: string): Promise<EmotionAnalysis>;

  /**
   * Generate creative content from dream
   * @param content - Dream content text
   * @param format - Output format ('story' or 'poem')
   * @returns Generated creative content
   */
  generateCreative(content: string, format: 'story' | 'poem'): Promise<string>;

  /**
   * Generate an image representing the dream
   * @param content - Dream content text
   * @returns URL of the generated image
   */
  generateImage(content: string): Promise<string>;

  /**
   * General chat completion
   * @param systemPrompt - System prompt for the AI
   * @param userPrompt - User prompt/question
   * @returns AI response text
   */
  chat(systemPrompt: string, userPrompt: string): Promise<string>;
}

/**
 * Chat message for AI API
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Zhipu AI chat completion response
 */
export interface ZhipuChatResponse {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Zhipu AI image generation response
 */
export interface ZhipuImageResponse {
  created: number;
  data: Array<{
    url: string;
  }>;
}

/**
 * AI Service configuration
 */
export interface AIServiceConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  imageModel?: string;
  timeout?: number;
}
