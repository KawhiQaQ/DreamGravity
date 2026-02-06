/**
 * Element Graph API Routes
 * 梦境元素图谱相关接口
 */
import { Router, Request, Response, NextFunction } from 'express';
import {
  getDreamElementGraph,
  generateConstellationName,
  saveConstellationCard,
  getConstellationCards,
  getConstellationCardById,
  deleteConstellationCard,
  deleteConstellationCards,
} from '../services/elementGraphService';
import type { DreamElementType, ConstellationCard } from '../../../shared/types/api';

const router = Router();

/**
 * GET /api/element-graph - 获取梦境元素图谱数据
 */
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const graph = getDreamElementGraph();
    res.json(graph);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/element-graph/constellation - 生成梦境星座名称
 */
router.post('/constellation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { elements } = req.body as {
      elements: { name: string; type: DreamElementType; count: number }[];
    };

    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      res.status(400).json({ error: 'validation_error', message: 'elements must be a non-empty array' });
      return;
    }

    const result = await generateConstellationName(elements);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/element-graph/cards - 获取所有星座卡片
 */
router.get('/cards', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cards = getConstellationCards();
    res.json(cards);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/element-graph/cards/:id - 获取单个星座卡片
 */
router.get('/cards/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const card = getConstellationCardById(id);
    if (!card) {
      res.status(404).json({ error: 'not_found', message: 'Card not found' });
      return;
    }
    res.json(card);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/element-graph/cards - 保存星座卡片
 */
router.post('/cards', (req: Request, res: Response, next: NextFunction) => {
  try {
    const cardData = req.body as Omit<ConstellationCard, 'id' | 'createdAt'>;

    if (!cardData.name || !cardData.nodes || !cardData.links) {
      res.status(400).json({ error: 'validation_error', message: 'Missing required fields' });
      return;
    }

    const card = saveConstellationCard(cardData);
    res.status(201).json(card);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/element-graph/cards/:id - 删除单个星座卡片
 */
router.delete('/cards/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const deleted = deleteConstellationCard(id);
    if (!deleted) {
      res.status(404).json({ error: 'not_found', message: 'Card not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/element-graph/cards/batch-delete - 批量删除星座卡片
 */
router.post('/cards/batch-delete', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'validation_error', message: 'ids must be a non-empty array' });
      return;
    }
    const result = deleteConstellationCards(ids);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
