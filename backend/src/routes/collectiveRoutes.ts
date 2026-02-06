/**
 * 集体潜意识池路由
 * 处理匿名梦境分享和梦境宇宙故事相关的API
 */

import { Router, Request, Response } from 'express';
import {
  shareDream,
  listCollectiveDreams,
  getCollectiveDream,
  checkDreamShared,
  generateDreamUniverseStory,
  listDreamUniverseStories,
  getDreamStory,
  unshareDream
} from '../services/collectiveService';

const router = Router();

/**
 * POST /api/collective/share/:dreamId
 * 分享梦境到集体潜意识池
 */
router.post('/share/:dreamId', async (req: Request, res: Response) => {
  try {
    const dreamId = req.params.dreamId as string;
    const dream = await shareDream(dreamId);
    res.status(201).json(dream);
  } catch (error) {
    const message = error instanceof Error ? error.message : '分享失败';
    res.status(400).json({ error: 'share_failed', message });
  }
});

/**
 * GET /api/collective/dreams
 * 获取集体潜意识池中的梦境列表
 */
router.get('/dreams', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const emotion = req.query.emotion as string | undefined;
    
    const result = listCollectiveDreams(page, limit, emotion);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取失败';
    res.status(500).json({ error: 'fetch_failed', message });
  }
});

/**
 * GET /api/collective/dreams/:id
 * 获取单个集体梦境详情
 */
router.get('/dreams/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const dream = getCollectiveDream(id);
    
    if (!dream) {
      return res.status(404).json({ error: 'not_found', message: '梦境不存在' });
    }
    
    res.json(dream);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取失败';
    res.status(500).json({ error: 'fetch_failed', message });
  }
});

/**
 * GET /api/collective/check/:dreamId
 * 检查梦境是否已分享
 */
router.get('/check/:dreamId', (req: Request, res: Response) => {
  try {
    const dreamId = req.params.dreamId as string;
    const isShared = checkDreamShared(dreamId);
    res.json({ isShared });
  } catch (error) {
    const message = error instanceof Error ? error.message : '检查失败';
    res.status(500).json({ error: 'check_failed', message });
  }
});

/**
 * DELETE /api/collective/unshare/:dreamId
 * 取消分享梦境（从集体潜意识池删除）
 */
router.delete('/unshare/:dreamId', (req: Request, res: Response) => {
  try {
    const dreamId = req.params.dreamId as string;
    unshareDream(dreamId);
    res.json({ success: true, message: '已从集体潜意识池移除' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '取消分享失败';
    res.status(400).json({ error: 'unshare_failed', message });
  }
});

/**
 * POST /api/collective/universe-story
 * 生成梦境宇宙故事
 */
router.post('/universe-story', async (req: Request, res: Response) => {
  try {
    const { dreamIds } = req.body;
    
    if (!Array.isArray(dreamIds)) {
      return res.status(400).json({ error: 'invalid_input', message: '请提供梦境ID数组' });
    }
    
    const story = await generateDreamUniverseStory(dreamIds);
    res.status(201).json(story);
  } catch (error) {
    const message = error instanceof Error ? error.message : '生成失败';
    res.status(400).json({ error: 'generation_failed', message });
  }
});

/**
 * GET /api/collective/universe-stories
 * 获取梦境宇宙故事列表
 */
router.get('/universe-stories', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = listDreamUniverseStories(page, limit);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取失败';
    res.status(500).json({ error: 'fetch_failed', message });
  }
});

/**
 * GET /api/collective/universe-stories/:id
 * 获取单个梦境宇宙故事
 */
router.get('/universe-stories/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const story = getDreamStory(id);
    
    if (!story) {
      return res.status(404).json({ error: 'not_found', message: '故事不存在' });
    }
    
    res.json(story);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取失败';
    res.status(500).json({ error: 'fetch_failed', message });
  }
});

export default router;
