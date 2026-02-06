/**
 * AI Service Module
 * Exports AI service interface and implementations
 */

import { ZhipuAIService } from './zhipuClient';
import type { AIService, AIServiceConfig } from './types';

export type { AIService, AIServiceConfig } from './types';
export { ZhipuAIService } from './zhipuClient';

// Singleton instance
let aiServiceInstance: AIService | null = null;

/**
 * Get the AI service instance
 * Creates a singleton instance using environment configuration
 */
export function getAIService(): AIService {
  if (!aiServiceInstance) {
    const apiKey = process.env.ZHIPU_API_KEY;

    if (!apiKey) {
      throw new Error('ZHIPU_API_KEY environment variable is not set');
    }

    const config: AIServiceConfig = {
      apiKey,
      baseUrl: process.env.ZHIPU_BASE_URL,
      model: process.env.ZHIPU_MODEL,
      imageModel: process.env.ZHIPU_IMAGE_MODEL,
      timeout: process.env.ZHIPU_TIMEOUT ? parseInt(process.env.ZHIPU_TIMEOUT, 10) : undefined,
    };

    aiServiceInstance = new ZhipuAIService(config);
  }

  return aiServiceInstance;
}

/**
 * Create a new AI service instance with custom configuration
 * Useful for testing or using different configurations
 */
export function createAIService(config: AIServiceConfig): AIService {
  return new ZhipuAIService(config);
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetAIService(): void {
  aiServiceInstance = null;
}
