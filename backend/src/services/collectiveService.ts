/**
 * 集体潜意识池服务
 * 处理匿名梦境分享和梦境宇宙故事生成
 */

import { getAIService } from './ai';
import { getDreamById } from '../dao/dreamDao';
import {
  shareDreamToPool,
  getCollectiveDreams,
  getCollectiveDreamById,
  isDreamShared,
  incrementViewCount,
  saveDreamUniverseStory,
  getDreamUniverseStories,
  getDreamUniverseStoryById,
  getCollectiveDreamsByIds,
  getCollectiveDreamByOriginalId,
  deleteCollectiveDreamByOriginalId,
  CollectiveDream,
  DreamUniverseStory
} from '../dao/collectiveDao';

// 一次最多选择的梦境数量（防止token过多）
const MAX_DREAMS_FOR_STORY = 5;

/**
 * 分享梦境到集体潜意识池
 */
export async function shareDream(dreamId: string): Promise<CollectiveDream> {
  const dream = getDreamById(dreamId);
  if (!dream) {
    throw new Error(`梦境 '${dreamId}' 不存在`);
  }

  // 检查是否已分享
  if (isDreamShared(dreamId)) {
    throw new Error('该梦境已经分享到集体潜意识池');
  }

  // 匿名化处理：只保留梦境内容、情绪和清晰度
  return shareDreamToPool(
    dreamId,
    dream.content,
    dream.emotionTag,
    dream.clarity
  );
}

/**
 * 获取集体潜意识池中的梦境列表
 */
export function listCollectiveDreams(
  page: number = 1,
  limit: number = 20,
  emotionFilter?: string
): { dreams: CollectiveDream[]; total: number; page: number; limit: number; totalPages: number } {
  const result = getCollectiveDreams(page, limit, emotionFilter);
  return {
    ...result,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit)
  };
}

/**
 * 获取单个集体梦境详情
 */
export function getCollectiveDream(id: string): CollectiveDream | null {
  const dream = getCollectiveDreamById(id);
  if (dream) {
    incrementViewCount(id);
  }
  return dream;
}

/**
 * 检查梦境是否已分享
 */
export function checkDreamShared(dreamId: string): boolean {
  return isDreamShared(dreamId);
}

/**
 * 生成梦境宇宙故事
 * 将多个梦境串联成一个连贯的故事
 */
export async function generateDreamUniverseStory(dreamIds: string[]): Promise<DreamUniverseStory> {
  if (dreamIds.length === 0) {
    throw new Error('请至少选择一个梦境');
  }

  if (dreamIds.length > MAX_DREAMS_FOR_STORY) {
    throw new Error(`一次最多选择 ${MAX_DREAMS_FOR_STORY} 个梦境`);
  }

  // 获取选中的梦境
  const dreams = getCollectiveDreamsByIds(dreamIds);
  if (dreams.length === 0) {
    throw new Error('未找到选中的梦境');
  }

  // 构建AI提示
  const aiService = getAIService();
  const systemPrompt = `你是一位富有想象力的故事作家，擅长将不同的梦境片段编织成一个连贯、引人入胜的故事。
你的任务是将多个匿名用户的梦境融合成一个"梦境宇宙"故事，保持每个梦境的核心元素，同时创造性地将它们连接起来。`;

  const dreamsContext = dreams.map((d, i) => 
    `【梦境${i + 1}】\n情绪：${d.emotionTag}\n内容：${d.content}`
  ).join('\n\n');

  const userPrompt = `请将以下${dreams.length}个梦境融合成一个连贯的"梦境宇宙"故事：

${dreamsContext}

要求：
1. 创造一个能够自然串联所有梦境的叙事框架
2. 保留每个梦境的核心意象和情感
3. 故事应该有开头、发展和结尾
4. 语言优美，富有诗意
5. 故事长度适中（300-600字）

请以JSON格式返回：
{
  "title": "故事标题",
  "story": "故事内容"
}

只返回JSON，不要其他内容。`;

  try {
    const response = await aiService.chat(systemPrompt, userPrompt);
    
    // 解析JSON响应
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI响应格式错误');
    }

    const result = JSON.parse(jsonMatch[0]) as { title: string; story: string };
    
    // 保存故事
    return saveDreamUniverseStory(result.title, result.story, dreamIds);
  } catch (error) {
    console.error('生成梦境宇宙故事失败:', error);
    throw new Error('生成故事失败，请稍后重试');
  }
}

/**
 * 获取梦境宇宙故事列表
 */
export function listDreamUniverseStories(
  page: number = 1,
  limit: number = 10
): { stories: DreamUniverseStory[]; total: number; page: number; limit: number; totalPages: number } {
  const result = getDreamUniverseStories(page, limit);
  return {
    ...result,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit)
  };
}

/**
 * 获取单个梦境宇宙故事
 */
export function getDreamStory(id: string): DreamUniverseStory | null {
  return getDreamUniverseStoryById(id);
}

/**
 * 取消分享梦境（从集体潜意识池删除）
 */
export function unshareDream(originalDreamId: string): boolean {
  if (!isDreamShared(originalDreamId)) {
    throw new Error('该梦境未分享到集体潜意识池');
  }
  return deleteCollectiveDreamByOriginalId(originalDreamId);
}
