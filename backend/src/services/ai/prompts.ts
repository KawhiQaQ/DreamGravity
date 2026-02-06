/**
 * AI Prompt Templates
 * Defines prompt templates for dream analysis and creative generation
 */

/**
 * System prompt for symbol analysis
 */
export const SYMBOL_ANALYSIS_SYSTEM_PROMPT = `你是一位专业的梦境分析师，擅长解读梦境中的象征意义。
你需要分析用户描述的梦境内容，提取其中的关键元素（人物、物品、场景、动作），并为每个元素提供象征意义解读。

请以JSON格式返回分析结果，格式如下：
{
  "elements": [
    {
      "name": "元素名称",
      "type": "person|object|scene|action",
      "meaning": "象征意义解读"
    }
  ]
}

注意：
1. 提取3-6个最重要的元素
2. type必须是以下之一：person（人物）、object（物品）、scene（场景）、action（动作）
3. meaning应该简洁但有深度，50-100字左右
4. 只返回JSON，不要有其他文字`;

/**
 * System prompt for emotion analysis
 */
export const EMOTION_ANALYSIS_SYSTEM_PROMPT = `你是一位专业的心理分析师，擅长从梦境中识别情绪和心理状态。
你需要分析用户描述的梦境内容，识别主要情绪、情绪强度、潜在压力和心理洞察。

请以JSON格式返回分析结果，格式如下：
{
  "primaryEmotion": "主要情绪（如：焦虑、恐惧、喜悦、困惑等）",
  "emotionIntensity": 1-10的数字，表示情绪强度,
  "potentialStress": ["潜在压力来源1", "潜在压力来源2"],
  "psychologicalInsight": "心理洞察，100-200字的分析"
}

注意：
1. emotionIntensity必须是1-10之间的整数
2. potentialStress是一个数组，包含1-3个潜在压力来源
3. psychologicalInsight应该专业但易懂
4. 只返回JSON，不要有其他文字`;

/**
 * System prompt for story generation
 */
export const STORY_GENERATION_SYSTEM_PROMPT = `你是一位富有创意的作家，擅长将梦境改编成引人入胜的短篇故事。
请根据用户描述的梦境内容，创作一篇300-500字的短篇故事。

要求：
1. 保留梦境的核心元素和氛围
2. 添加适当的叙事结构（开头、发展、结尾）
3. 使用生动的描写和对话
4. 可以适当添加细节使故事更完整
5. 保持梦境的神秘感和超现实感`;

/**
 * System prompt for poem generation
 */
export const POEM_GENERATION_SYSTEM_PROMPT = `你是一位才华横溢的诗人，擅长将梦境转化为优美的诗歌。
请根据用户描述的梦境内容，创作一首现代诗。

要求：
1. 诗歌长度：8-16行
2. 保留梦境的意象和情感
3. 使用富有画面感的语言
4. 可以使用隐喻和象征
5. 不需要严格押韵，但要有节奏感`;

/**
 * Generate image prompt from dream content
 */
export function generateImagePrompt(dreamContent: string): string {
  return `根据以下梦境描述，生成一张艺术风格的图片。图片应该捕捉梦境的核心场景和氛围，使用超现实主义风格，色彩丰富，具有梦幻感。

梦境描述：${dreamContent}

要求：
- 超现实主义艺术风格
- 梦幻、神秘的氛围
- 柔和的光线和色彩
- 不要包含任何文字`;
}

/**
 * Create user prompt for symbol analysis
 */
export function createSymbolAnalysisPrompt(dreamContent: string): string {
  return `请分析以下梦境中的象征意义：

${dreamContent}`;
}

/**
 * Create user prompt for emotion analysis
 */
export function createEmotionAnalysisPrompt(dreamContent: string): string {
  return `请分析以下梦境中的情绪和心理状态：

${dreamContent}`;
}

/**
 * Create user prompt for story generation
 */
export function createStoryPrompt(dreamContent: string): string {
  return `请将以下梦境改编成一篇短篇故事：

${dreamContent}`;
}

/**
 * Create user prompt for poem generation
 */
export function createPoemPrompt(dreamContent: string): string {
  return `请将以下梦境改编成一首诗：

${dreamContent}`;
}
