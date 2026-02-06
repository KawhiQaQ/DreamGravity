/**
 * 梦境IP角色服务
 * 处理IP角色的生成和管理
 */

import { getAIService } from './ai';
import { getWeeklyReportById } from '../dao/weeklyReportDao';
import {
  createIPCharacter,
  getIPCharacterById,
  getIPCharacterByReportId,
  getAllIPCharacters,
  updateIPCharacter,
  DreamIPCharacter,
  CreateIPCharacterInput
} from '../dao/dreamIpDao';

/**
 * 为周报生成IP角色设定
 */
export async function generateIPCharacter(weeklyReportId: string): Promise<DreamIPCharacter> {
  const report = getWeeklyReportById(weeklyReportId);
  if (!report) {
    throw new Error('周报不存在');
  }
  
  // 检查是否已有IP角色
  const existing = getIPCharacterByReportId(weeklyReportId);
  if (existing) {
    return existing;
  }
  
  const aiService = getAIService();
  
  const systemPrompt = `你是一位专业的IP角色设计师，擅长为梦境图腾创造丰富的角色设定。
你需要基于梦境周报的总结和图腾描述，创造一个独特的IP角色，包括名字、称号、性格、背景故事、能力、外观和口头禅。
这个角色应该体现这一周梦境的精髓，成为用户"梦境宇宙"中的一员。`;

  const userPrompt = `请为以下梦境图腾创造一个完整的IP角色设定：

【图腾名称】${report.totemName}
【图腾描述】${report.totemDescription}
【周报总结】${report.summary}
【3D模型提示词】${report.modelPrompt || '无'}

请以JSON格式返回角色设定：
{
  "name": "角色名字（可以与图腾名称相同或不同，更有角色感）",
  "title": "角色称号（如'星辰守护者'、'迷雾行者'等）",
  "personality": "性格特点（100-150字，描述角色的性格、行为方式）",
  "backstory": "背景故事（150-250字，角色的起源故事，与梦境主题相关）",
  "abilities": "特殊能力（列出2-3个与梦境主题相关的能力）",
  "appearance": "外观描述（100-150字，详细描述角色的外观特征）",
  "catchphrase": "口头禅（一句代表角色的经典台词）"
}

只返回JSON，不要其他内容。角色设定应该富有想象力，与梦境主题紧密相关。`;

  try {
    const response = await aiService.chat(systemPrompt, userPrompt);
    
    // 解析JSON响应
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI响应格式错误');
    }
    
    console.log('[generateIPCharacter] AI响应:', jsonMatch[0]);
    
    const result = JSON.parse(jsonMatch[0]) as {
      name: string;
      title: string;
      personality: string;
      backstory: string;
      abilities: string | string[];
      appearance: string;
      catchphrase: string;
    };
    
    console.log('[generateIPCharacter] 创建IP角色, weeklyReportId:', weeklyReportId);
    console.log('[generateIPCharacter] modelUrl:', report.modelUrl);
    
    // 将 abilities 数组转为 JSON 字符串（SQLite 只能绑定基本类型）
    const abilitiesStr = Array.isArray(result.abilities) 
      ? JSON.stringify(result.abilities) 
      : result.abilities;
    
    // 创建IP角色
    const character = createIPCharacter({
      weeklyReportId,
      name: result.name,
      title: result.title,
      personality: result.personality,
      backstory: result.backstory,
      abilities: abilitiesStr,
      appearance: result.appearance,
      catchphrase: result.catchphrase,
      modelUrl: report.modelUrl || undefined,
      thumbnailUrl: undefined
    });
    
    return character;
  } catch (error) {
    console.error('生成IP角色失败:', error);
    throw new Error('生成IP角色失败，请稍后重试');
  }
}

/**
 * 当3D模型生成完成时，更新IP角色的模型URL
 */
export async function syncModelToIPCharacter(weeklyReportId: string): Promise<void> {
  const report = getWeeklyReportById(weeklyReportId);
  if (!report || !report.modelUrl) return;
  
  const character = getIPCharacterByReportId(weeklyReportId);
  if (character && !character.modelUrl) {
    updateIPCharacter(character.id, { modelUrl: report.modelUrl });
  }
}

/**
 * 检查IP图片状态并在完成时自动创建IP角色设定
 */
export async function checkAndCreateIPCharacter(weeklyReportId: string): Promise<{
  report: ReturnType<typeof getWeeklyReportById>;
  character: DreamIPCharacter | null;
}> {
  const report = getWeeklyReportById(weeklyReportId);
  if (!report) {
    throw new Error('周报不存在');
  }
  
  // 如果IP图片已完成但没有IP角色设定，创建一个
  if (report.modelStatus === 'completed' && report.modelUrl) {
    let character = getIPCharacterByReportId(weeklyReportId);
    if (!character) {
      try {
        console.log('[checkAndCreateIPCharacter] 自动创建IP角色设定...');
        character = await generateIPCharacter(weeklyReportId);
        updateIPCharacter(character.id, { modelUrl: report.modelUrl });
        console.log('[checkAndCreateIPCharacter] IP角色设定创建成功');
      } catch (error) {
        console.error('[checkAndCreateIPCharacter] 创建IP角色设定失败:', error);
        // 不抛出错误，返回没有角色的报告
      }
    }
    return { report, character };
  }
  
  // 返回现有数据
  const character = getIPCharacterByReportId(weeklyReportId);
  return { report, character };
}

/**
 * 获取用户的梦境宇宙（所有IP角色）
 */
export function getDreamUniverse(page: number = 1, limit: number = 20): {
  characters: DreamIPCharacter[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const result = getAllIPCharacters(page, limit);
  return {
    ...result,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit)
  };
}

/**
 * 获取单个IP角色详情
 */
export function getCharacter(id: string): DreamIPCharacter | null {
  return getIPCharacterById(id);
}

/**
 * 获取周报对应的IP角色
 */
export function getCharacterByReport(weeklyReportId: string): DreamIPCharacter | null {
  return getIPCharacterByReportId(weeklyReportId);
}
