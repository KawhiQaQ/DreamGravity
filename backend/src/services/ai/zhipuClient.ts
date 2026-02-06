/**
 * Zhipu AI API Client
 * Implements the AIService interface using Zhipu AI (GLM-4 and CogView)
 */

import type {
  AIService,
  AIServiceConfig,
  ChatMessage,
  ZhipuChatResponse,
  ZhipuImageResponse,
} from './types';
import type { SymbolAnalysis, EmotionAnalysis } from '../../../../shared/types/dream';
import {
  SYMBOL_ANALYSIS_SYSTEM_PROMPT,
  EMOTION_ANALYSIS_SYSTEM_PROMPT,
  STORY_GENERATION_SYSTEM_PROMPT,
  POEM_GENERATION_SYSTEM_PROMPT,
  createSymbolAnalysisPrompt,
  createEmotionAnalysisPrompt,
  createStoryPrompt,
  createPoemPrompt,
  generateImagePrompt,
} from './prompts';

const DEFAULT_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
const DEFAULT_MODEL = 'glm-4';
const DEFAULT_IMAGE_MODEL = 'cogview-3';
const DEFAULT_TIMEOUT = 120000; // 增加到 120 秒

/**
 * Zhipu AI Service implementation
 */
export class ZhipuAIService implements AIService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private imageModel: string;
  private timeout: number;

  constructor(config: AIServiceConfig) {
    if (!config.apiKey) {
      throw new Error('Zhipu API key is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.model = config.model || DEFAULT_MODEL;
    this.imageModel = config.imageModel || DEFAULT_IMAGE_MODEL;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Make a chat completion request to Zhipu AI
   */
  private async chatCompletion(messages: ChatMessage[]): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          top_p: 0.9,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Zhipu API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as ZhipuChatResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Zhipu AI');
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('AI 请求超时，请稍后重试');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse JSON response from AI, handling potential formatting issues
   */
  private parseJsonResponse<T>(content: string): T {
    // Try to extract JSON from the response
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }

    jsonStr = jsonStr.trim();
    
    // Try to find JSON object in the response
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    try {
      return JSON.parse(jsonStr) as T;
    } catch (e) {
      // Try to fix common JSON issues
      try {
        // Remove any BOM or invisible characters
        jsonStr = jsonStr.replace(/^\uFEFF/, '').replace(/[\x00-\x1F\x7F]/g, '');
        return JSON.parse(jsonStr) as T;
      } catch {
        console.error('Failed to parse JSON:', jsonStr);
        throw new Error(`Failed to parse AI response as JSON: ${content.substring(0, 200)}...`);
      }
    }
  }

  /**
   * Analyze symbols in dream content
   */
  async analyzeSymbols(content: string): Promise<SymbolAnalysis> {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYMBOL_ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: createSymbolAnalysisPrompt(content) },
    ];

    const response = await this.chatCompletion(messages);
    const result = this.parseJsonResponse<SymbolAnalysis>(response);

    // Validate the response structure
    if (!result.elements || !Array.isArray(result.elements)) {
      throw new Error('Invalid symbol analysis response structure');
    }

    return result;
  }

  /**
   * Analyze emotions in dream content
   */
  async analyzeEmotions(content: string): Promise<EmotionAnalysis> {
    const messages: ChatMessage[] = [
      { role: 'system', content: EMOTION_ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: createEmotionAnalysisPrompt(content) },
    ];

    const response = await this.chatCompletion(messages);
    const result = this.parseJsonResponse<EmotionAnalysis>(response);

    // Validate and normalize the response
    if (!result.primaryEmotion || typeof result.emotionIntensity !== 'number') {
      throw new Error('Invalid emotion analysis response structure');
    }

    // Ensure emotionIntensity is within bounds
    result.emotionIntensity = Math.max(1, Math.min(10, Math.round(result.emotionIntensity)));

    // Ensure potentialStress is an array
    if (!Array.isArray(result.potentialStress)) {
      result.potentialStress = [];
    }

    return result;
  }

  /**
   * Generate creative content from dream
   */
  async generateCreative(content: string, format: 'story' | 'poem'): Promise<string> {
    const systemPrompt =
      format === 'story' ? STORY_GENERATION_SYSTEM_PROMPT : POEM_GENERATION_SYSTEM_PROMPT;

    const userPrompt = format === 'story' ? createStoryPrompt(content) : createPoemPrompt(content);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.chatCompletion(messages);
    return response.trim();
  }

  /**
   * Generate an image representing the dream
   */
  async generateImage(content: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout * 2); // Longer timeout for image generation

    try {
      const prompt = generateImagePrompt(content);

      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.imageModel,
          prompt,
          size: '1024x1024',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Zhipu Image API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as ZhipuImageResponse;

      if (!data.data || data.data.length === 0 || !data.data[0].url) {
        throw new Error('No image URL in response');
      }

      return data.data[0].url;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('图片生成超时，请稍后重试');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * General chat completion
   */
  async chat(systemPrompt: string, userPrompt: string): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.chatCompletion(messages);
    return response.trim();
  }
}
