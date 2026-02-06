/**
 * 周报路由
 * 处理梦境周报相关的API
 */

import { Router, Request, Response } from 'express';
import {
  generateWeeklyReport,
  generateIPImage,
  checkModelStatus,
  listWeeklyReports,
  getReport,
  getWeekRange,
  getAllWeeks,
  regenerateWeeklyReport,
  clearWeeklyReport
} from '../services/weeklyReportService';
import {
  generateIPCharacter,
  checkAndCreateIPCharacter,
  getDreamUniverse,
  getCharacter,
  getCharacterByReport
} from '../services/dreamIpService';

const router = Router();

/**
 * GET /api/weekly-reports/weeks
 * 获取所有周列表（包含已生成和待生成的周）
 */
router.get('/weeks', (_req: Request, res: Response) => {
  try {
    const weeks = getAllWeeks();
    res.json({ weeks });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取周列表失败';
    res.status(500).json({ error: 'fetch_failed', message });
  }
});

/**
 * POST /api/weekly-reports/generate
 * 生成周报
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { weekStart, weekEnd } = req.body;
    
    // 如果没有指定日期，使用当前周
    let start = weekStart;
    let end = weekEnd;
    
    if (!start || !end) {
      const range = getWeekRange(new Date());
      start = range.weekStart;
      end = range.weekEnd;
    }
    
    const report = await generateWeeklyReport(start, end);
    res.status(201).json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : '生成周报失败';
    res.status(400).json({ error: 'generation_failed', message });
  }
});

/**
 * POST /api/weekly-reports/:id/regenerate
 * 重新生成周报
 */
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const report = await regenerateWeeklyReport(id);
    res.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : '重新生成周报失败';
    res.status(400).json({ error: 'regeneration_failed', message });
  }
});

/**
 * DELETE /api/weekly-reports/:id
 * 清空周报（删除周报及关联的IP角色）
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = clearWeeklyReport(id);
    res.json({ success: true, ...result, message: '周报已清空，可重新生成' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '清空周报失败';
    res.status(400).json({ error: 'delete_failed', message });
  }
});

/**
 * POST /api/weekly-reports/:id/generate-model
 * 为周报生成IP角色像素图片
 * 可选参数 forceRegenerate: 是否强制重新生成（用于图片过期的情况）
 */
router.post('/:id/generate-model', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const forceRegenerate = req.body?.forceRegenerate === true;
    await generateIPImage(id, forceRegenerate);
    
    const report = getReport(id);
    res.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : '生成IP图片失败';
    res.status(400).json({ error: 'image_generation_failed', message });
  }
});

/**
 * GET /api/weekly-reports/:id/model-status
 * 检查IP图片生成状态
 */
router.get('/:id/model-status', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const report = checkModelStatus(id);
    
    if (!report) {
      return res.status(404).json({ error: 'not_found', message: '周报不存在' });
    }
    
    res.json({
      modelStatus: report.modelStatus,
      modelUrl: report.modelUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '检查状态失败';
    res.status(500).json({ error: 'check_failed', message });
  }
});

/**
 * GET /api/weekly-reports
 * 获取周报列表
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = listWeeklyReports(page, limit);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取失败';
    res.status(500).json({ error: 'fetch_failed', message });
  }
});

/**
 * GET /api/weekly-reports/current-week
 * 获取当前周的日期范围
 */
router.get('/current-week', (_req: Request, res: Response) => {
  const range = getWeekRange(new Date());
  res.json(range);
});

/**
 * GET /api/weekly-reports/universe/characters
 * 获取梦境宇宙（所有IP角色）
 */
router.get('/universe/characters', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = getDreamUniverse(page, limit);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取失败';
    res.status(500).json({ error: 'fetch_failed', message });
  }
});

/**
 * GET /api/weekly-reports/universe/characters/:characterId
 * 获取单个IP角色详情
 */
router.get('/universe/characters/:characterId', (req: Request, res: Response) => {
  try {
    const characterId = req.params.characterId as string;
    const character = getCharacter(characterId);
    
    if (!character) {
      return res.status(404).json({ error: 'not_found', message: 'IP角色不存在' });
    }
    
    res.json(character);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取失败';
    res.status(500).json({ error: 'fetch_failed', message });
  }
});

/**
 * GET /api/weekly-reports/:id
 * 获取单个周报详情（包含IP角色）
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // 只获取周报和已有的IP角色，不自动创建
    const report = getReport(id);
    
    if (!report) {
      return res.status(404).json({ error: 'not_found', message: '周报不存在' });
    }
    
    const character = getCharacterByReport(id);
    res.json({ ...report, ipCharacter: character });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取失败';
    res.status(500).json({ error: 'fetch_failed', message });
  }
});

/**
 * POST /api/weekly-reports/:id/generate-ip
 * 为周报生成IP角色设定
 */
router.post('/:id/generate-ip', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const character = await generateIPCharacter(id);
    res.status(201).json(character);
  } catch (error) {
    const message = error instanceof Error ? error.message : '生成IP角色失败';
    res.status(400).json({ error: 'ip_generation_failed', message });
  }
});

/**
 * GET /api/weekly-reports/:id/ip-character
 * 获取周报对应的IP角色
 */
router.get('/:id/ip-character', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const character = getCharacterByReport(id);
    
    if (!character) {
      return res.status(404).json({ error: 'not_found', message: 'IP角色不存在' });
    }
    
    res.json(character);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取失败';
    res.status(500).json({ error: 'fetch_failed', message });
  }
});

export default router;
