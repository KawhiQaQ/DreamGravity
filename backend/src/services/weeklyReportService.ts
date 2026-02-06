/**
 * 周报服务
 * 处理梦境周报的生成、IP角色图片创建等业务逻辑
 */

import { getAIService } from './ai';
import { getDreams, getEarliestDreamDate } from '../dao/dreamDao';
import {
  createWeeklyReport,
  getWeeklyReportById,
  getWeeklyReportByWeek,
  getWeeklyReports,
  updateModelStatus,
  updateModelUrl,
  getPendingModelTasks,
  deleteWeeklyReport,
  WeeklyReport
} from '../dao/weeklyReportDao';
import { getIPCharacterByReportId, deleteIPCharacter, updateIPCharacterModelUrl } from '../dao/dreamIpDao';
import { generateIPCharacter } from './dreamIpService';
import { downloadAndSaveImage } from './imageService';

/**
 * 周信息（包含已生成和待生成的周）
 */
export interface WeekInfo {
  weekStart: string;
  weekEnd: string;
  status: 'pending' | 'generated' | 'incomplete';
  dreamCount: number;
  daysWithDreams: number;
  missingDays: string[];
  report?: WeeklyReport & { ipCharacter?: null };
}

/**
 * 获取指定周的日期范围（周一到周日）
 * 使用本地时间计算，避免时区问题
 */
export function getWeekRange(date: Date = new Date()): { weekStart: string; weekEnd: string } {
  // 使用本地时间的年月日
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // 创建本地时间的日期对象
  const d = new Date(year, month, day, 0, 0, 0, 0);
  
  const dayOfWeek = d.getDay(); // 0=周日, 1=周一, ..., 6=周六
  // 计算到周一的偏移量
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  // 计算周一
  const weekStart = new Date(year, month, day + diffToMonday);
  
  // 计算周日
  const weekEnd = new Date(year, month, day + diffToMonday + 6);
  
  // 格式化为 YYYY-MM-DD
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  
  return {
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(weekEnd)
  };
}

/**
 * 检查一周内每天是否都有梦境记录
 */
export function checkWeekComplete(weekStart: string, weekEnd: string): { 
  complete: boolean; 
  daysWithDreams: number;
  missingDays: string[];
} {
  // 解析日期字符串为本地时间
  const [year, month, day] = weekStart.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  
  const missingDays: string[] = [];
  let daysWithDreams = 0;
  
  // 遍历一周的每一天
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(year, month - 1, day + i);
    const y = currentDay.getFullYear();
    const m = String(currentDay.getMonth() + 1).padStart(2, '0');
    const d = String(currentDay.getDate()).padStart(2, '0');
    const dayStr = `${y}-${m}-${d}`;
    
    // 检查这一天是否有梦境
    const { total } = getDreams({
      dateRange: { start: dayStr, end: dayStr },
      limit: 1
    });
    
    if (total > 0) {
      daysWithDreams++;
    } else {
      // 格式化为可读的日期
      missingDays.push(`${currentDay.getMonth() + 1}/${currentDay.getDate()}`);
    }
  }
  
  return {
    complete: daysWithDreams === 7,
    daysWithDreams,
    missingDays
  };
}

/**
 * 获取所有周列表（从最早的梦境日期到当前周）
 * 包含已生成和待生成的周
 */
export function getAllWeeks(): WeekInfo[] {
  // 获取最早的梦境日期
  const earliestDate = getEarliestDreamDate();
  console.log('[getAllWeeks] earliestDate:', earliestDate);
  
  if (!earliestDate) {
    // 没有梦境记录，返回空列表
    return [];
  }
  
  const weeks: WeekInfo[] = [];
  const currentWeek = getWeekRange(new Date());
  
  // 解析最早日期为本地时间
  const [ey, em, ed] = earliestDate.split('-').map(Number);
  const earliestLocalDate = new Date(ey, em - 1, ed);
  const startWeek = getWeekRange(earliestLocalDate);
  
  console.log('[getAllWeeks] currentWeek:', currentWeek);
  console.log('[getAllWeeks] startWeek:', startWeek);
  
  // 解析开始周的周一日期
  const [sy, sm, sd] = startWeek.weekStart.split('-').map(Number);
  let weekDate = new Date(sy, sm - 1, sd);
  
  // 解析结束周的周日日期
  const [cy, cm, cd] = currentWeek.weekEnd.split('-').map(Number);
  const endDate = new Date(cy, cm - 1, cd);
  
  while (weekDate <= endDate) {
    const week = getWeekRange(weekDate);
    
    // 检查该周是否已生成周报
    const existingReport = getWeeklyReportByWeek(week.weekStart, week.weekEnd);
    
    // 检查该周的完整性
    const completeness = checkWeekComplete(week.weekStart, week.weekEnd);
    
    console.log('[getAllWeeks] week:', week, 'completeness:', completeness);
    
    // 只有有梦境的周才加入列表
    if (completeness.daysWithDreams > 0 || existingReport) {
      // 获取该周的梦境总数
      const { total: dreamCount } = getDreams({
        dateRange: { start: week.weekStart, end: week.weekEnd },
        limit: 1
      });
      
      let status: 'pending' | 'generated' | 'incomplete';
      if (existingReport) {
        status = 'generated';
      } else if (completeness.complete) {
        status = 'pending';
      } else {
        status = 'incomplete';
      }
      
      console.log('[getAllWeeks] adding week with status:', status);
      
      weeks.push({
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        status,
        dreamCount,
        daysWithDreams: completeness.daysWithDreams,
        missingDays: completeness.missingDays,
        report: existingReport || undefined
      });
    }
    
    // 移动到下一周
    weekDate = new Date(weekDate.getFullYear(), weekDate.getMonth(), weekDate.getDate() + 7);
  }
  
  // 按时间倒序排列（最新的在前）
  return weeks.reverse();
}

/**
 * 生成周报
 */
export async function generateWeeklyReport(weekStart: string, weekEnd: string): Promise<WeeklyReport> {
  // 检查是否已存在该周的周报
  const existing = getWeeklyReportByWeek(weekStart, weekEnd);
  if (existing) {
    return existing;
  }
  
  // 检查该周是否完整（每天都有梦境）
  const completeness = checkWeekComplete(weekStart, weekEnd);
  if (!completeness.complete) {
    const missingDaysStr = completeness.missingDays.join('、');
    throw new Error(`该周梦境记录不完整，缺少 ${missingDaysStr} 的梦境`);
  }
  
  // 获取该周的梦境
  const { data: dreams } = getDreams({
    dateRange: { start: weekStart, end: weekEnd },
    limit: 100
  });
  
  if (dreams.length === 0) {
    throw new Error('该周没有记录任何梦境');
  }
  
  // 使用AI生成周报总结和图腾描述
  const aiService = getAIService();
  
  const dreamsContext = dreams.map((d, i) => 
    `【梦境${i + 1}】日期：${new Date(d.dreamDate).toLocaleDateString('zh-CN')}\n情绪：${d.emotionTag}\n内容：${d.content}`
  ).join('\n\n');
  
  const systemPrompt = `你是一位专业的梦境分析师和IP角色设计师。你需要分析用户一周的梦境，生成周报总结，并设计一个代表这周梦境的专属IP角色。
IP角色必须是一个拟人化的角色或可爱的动物/生物，它应该融合这周梦境的核心元素和情感，成为用户梦境宇宙中的一员。`;

  const userPrompt = `请分析以下一周的梦境记录，生成周报：

${dreamsContext}

请以JSON格式返回：
{
  "summary": "本周梦境总结（200-300字，分析主要主题、情绪趋势、潜在含义）",
  "ipName": "IP角色名称（简短有诗意，如'星辰守望者'、'迷雾精灵'、'月光猫'）",
  "ipDescription": "IP角色描述（50-100字，描述这个角色的外观特征和性格）",
  "imagePrompt": "像素风格角色图片生成提示词（英文，描述一个可爱的拟人角色或动物角色，必须包含 'pixel art style, cute character'，如 'pixel art style, cute character, a dreamy cat wizard with purple robe and star wand, big eyes, chibi, fantasy'）"
}

注意：IP角色必须是人物或动物/生物形象，不能是物品（如瓶子、塔、灯等）。
只返回JSON，不要其他内容。`;

  const response = await aiService.chat(systemPrompt, userPrompt);
  
  // 解析JSON响应
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI响应格式错误');
  }
  
  const result = JSON.parse(jsonMatch[0]) as {
    summary: string;
    ipName: string;
    ipDescription: string;
    imagePrompt: string;
  };
  
  // 创建周报记录
  const report = createWeeklyReport(
    weekStart,
    weekEnd,
    dreams.length,
    result.summary,
    result.ipName,
    result.ipDescription,
    result.imagePrompt
  );
  
  return report;
}

/**
 * 为周报生成IP角色像素图片
 * @param reportId 周报ID
 * @param forceRegenerate 是否强制重新生成（用于图片过期的情况）
 */
export async function generateIPImage(reportId: string, forceRegenerate: boolean = false): Promise<string> {
  const report = getWeeklyReportById(reportId);
  if (!report) {
    throw new Error('周报不存在');
  }
  
  if (!report.modelPrompt) {
    throw new Error('周报没有图片提示词');
  }
  
  // 如果不是强制重新生成，且已有本地图片，直接返回
  if (!forceRegenerate && report.modelStatus === 'completed' && report.modelUrl) {
    // 检查是否是本地图片路径
    if (report.modelUrl.startsWith('/api/images/')) {
      return report.modelUrl;
    }
  }
  
  try {
    // 更新状态为处理中
    updateModelStatus(reportId, 'processing');
    
    // 使用智谱AI生成像素风格IP角色图片
    const aiService = getAIService();
    console.log('[generateIPImage] 正在生成IP角色图片...');
    const remoteImageUrl = await aiService.generateImage(report.modelPrompt);
    console.log('[generateIPImage] IP角色图片生成成功:', remoteImageUrl);
    
    // 下载图片并保存到本地
    console.log('[generateIPImage] 正在下载并保存图片到本地...');
    const localImageUrl = await downloadAndSaveImage(remoteImageUrl, 'ip', reportId);
    console.log('[generateIPImage] 图片保存成功:', localImageUrl);
    
    // 更新模型URL（使用本地路径）
    updateModelUrl(reportId, localImageUrl);
    
    // 同时更新 IP 角色的图片 URL
    const ipCharacter = getIPCharacterByReportId(reportId);
    if (ipCharacter) {
      updateIPCharacterModelUrl(ipCharacter.id, localImageUrl);
    }
    
    // 如果还没有 IP 角色设定，自动创建
    if (!ipCharacter) {
      try {
        console.log('[generateIPImage] 正在生成IP角色设定...');
        await generateIPCharacter(reportId);
        console.log('[generateIPImage] IP角色设定生成成功');
      } catch (ipError) {
        console.error('[generateIPImage] IP角色设定生成失败:', ipError);
        // IP角色设定生成失败不影响图片生成结果
      }
    }
    
    return localImageUrl;
  } catch (error) {
    console.error('[generateIPImage] 生成失败:', error);
    updateModelStatus(reportId, 'failed');
    throw error;
  }
}

/**
 * 获取周报状态（简化版，不再需要轮询外部API）
 */
export function checkModelStatus(reportId: string): WeeklyReport {
  const report = getWeeklyReportById(reportId);
  if (!report) {
    throw new Error('周报不存在');
  }
  return report;
}

/**
 * 获取周报列表
 */
export function listWeeklyReports(page: number = 1, limit: number = 10): {
  reports: WeeklyReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const result = getWeeklyReports(page, limit);
  return {
    ...result,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit)
  };
}

/**
 * 获取单个周报
 */
export function getReport(id: string): WeeklyReport | null {
  return getWeeklyReportById(id);
}

/**
 * 批量检查待处理的模型任务
 */
export async function checkPendingModels(): Promise<void> {
  const pendingReports = getPendingModelTasks();
  
  for (const report of pendingReports) {
    try {
      await checkModelStatus(report.id);
    } catch (error) {
      console.error(`检查周报 ${report.id} 模型状态失败:`, error);
    }
  }
}

/**
 * 重新生成周报
 * 删除旧周报及关联的IP角色，然后重新生成
 */
export async function regenerateWeeklyReport(reportId: string): Promise<WeeklyReport> {
  const oldReport = getWeeklyReportById(reportId);
  if (!oldReport) {
    throw new Error('周报不存在');
  }
  
  const { weekStart, weekEnd } = oldReport;
  
  // 删除关联的IP角色
  const ipCharacter = getIPCharacterByReportId(reportId);
  if (ipCharacter) {
    deleteIPCharacter(ipCharacter.id);
  }
  
  // 删除旧周报
  deleteWeeklyReport(reportId);
  
  // 重新生成周报
  return generateWeeklyReport(weekStart, weekEnd);
}

/**
 * 清空周报
 * 删除周报及关联的IP角色，用户可重新生成
 */
export function clearWeeklyReport(reportId: string): { weekStart: string; weekEnd: string } {
  const report = getWeeklyReportById(reportId);
  if (!report) {
    throw new Error('周报不存在');
  }
  
  const { weekStart, weekEnd } = report;
  
  // 删除关联的IP角色
  const ipCharacter = getIPCharacterByReportId(reportId);
  if (ipCharacter) {
    deleteIPCharacter(ipCharacter.id);
  }
  
  // 删除周报
  deleteWeeklyReport(reportId);
  
  return { weekStart, weekEnd };
}
