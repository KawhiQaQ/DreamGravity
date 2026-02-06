/**
 * Dream API Routes
 * Handles all REST API endpoints for dream CRUD operations and AI analysis
 */
import { Router, Request, Response, NextFunction } from 'express';
import {
  createDream,
  getDreamById,
  getDreams,
  updateDream,
  deleteDream,
  getRandomDreamFragment,
} from '../dao/dreamDao';
import { validateCreateDream, validateUpdateDream } from '../middleware/validation';
import {
  analyzeDream,
  generateCreativeContent,
  generateDreamImage,
} from '../services/dreamAnalysisService';
import type { CreateDreamDTO, UpdateDreamDTO, QueryParams, CreativeFormat } from '../../../shared/types/api';
import type { EmotionTag, ClarityRating } from '../../../shared/types/dream';

const router = Router();

/**
 * POST /api/dreams - Create a new dream entry
 */
router.post('/', validateCreateDream, (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto: CreateDreamDTO = req.body;
    const dream = createDream(dto);
    res.status(201).json(dream);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dreams - Get paginated list of dreams with filtering
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const params: QueryParams = {};

    // Parse pagination params
    if (req.query.page) {
      params.page = parseInt(req.query.page as string, 10);
    }
    if (req.query.limit) {
      params.limit = parseInt(req.query.limit as string, 10);
    }

    // Parse date range
    if (req.query.startDate || req.query.endDate) {
      params.dateRange = {
        start: req.query.startDate as string,
        end: req.query.endDate as string,
      };
    }

    // Parse emotions filter (comma-separated or array)
    if (req.query.emotions) {
      const emotionsParam = req.query.emotions;
      if (typeof emotionsParam === 'string') {
        params.emotions = emotionsParam.split(',') as EmotionTag[];
      } else if (Array.isArray(emotionsParam)) {
        params.emotions = emotionsParam as EmotionTag[];
      }
    }

    // Parse clarity range
    if (req.query.clarityMin) {
      params.clarityMin = parseInt(req.query.clarityMin as string, 10) as ClarityRating;
    }
    if (req.query.clarityMax) {
      params.clarityMax = parseInt(req.query.clarityMax as string, 10) as ClarityRating;
    }

    const result = getDreams(params);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dreams/random-fragment - Get a random dream fragment for Subconscious Echo
 * Returns a random dream with extracted keywords or sentence
 */
router.get('/random-fragment', (req: Request, res: Response, next: NextFunction) => {
  try {
    const fragment = getRandomDreamFragment();
    
    if (!fragment) {
      res.json({
        id: null,
        dreamId: null,
        displayMode: 'keywords',
        keywords: ['🌙 记录梦境', '✨ 探索潜意识'],
        sentence: null,
        dreamDate: null,
        emotionTag: null,
      });
      return;
    }
    
    // 统一使用短句展示模式
    const sentence = extractSentence(fragment.content);
    
    res.json({
      id: fragment.id,
      dreamId: fragment.id,
      displayMode: 'sentence',
      keywords: null,
      sentence,
      dreamDate: fragment.dreamDate,
      emotionTag: fragment.emotionTag,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Extract keywords from dream content
 * 提取梦境中的关键意象词汇，而非截断句子
 */
function extractKeywords(content: string): string[] {
  const emojis: Record<string, string[]> = {
    // 自然元素
    nature: ['🌊', '🌙', '🌸', '🌿', '🌈', '🌺', '🍃', '🌻', '🏔️', '🌅', '🌌', '☀️', '🌧️', '❄️', '🔥', '🌴'],
    // 动物
    animal: ['🦋', '🐘', '🐦', '🐱', '🐕', '🐟', '🦅', '🐍', '🦊', '🐺', '🦁', '🐻'],
    // 物品
    object: ['🔑', '🚪', '💎', '📿', '🎭', '🪞', '⏰', '📚', '🎹', '🗝️', '💌', '🎁'],
    // 场景
    scene: ['🏠', '🏰', '🌃', '🛤️', '🌉', '⛩️', '🎪', '🏛️'],
    // 情感/抽象
    emotion: ['✨', '💫', '🔮', '⭐', '💭', '🌀', '♾️'],
  };
  
  // 常见梦境意象关键词映射
  const keywordPatterns: Array<{ pattern: RegExp; category: string; display: string }> = [
    // 自然
    { pattern: /海|水|河|湖|波浪|游泳|潜水|溺水/g, category: 'nature', display: '深海' },
    { pattern: /月|月亮|月光/g, category: 'nature', display: '月光' },
    { pattern: /星|星空|星星/g, category: 'nature', display: '星空' },
    { pattern: /山|高山|山峰|攀登/g, category: 'nature', display: '高山' },
    { pattern: /森林|树林|树木|丛林/g, category: 'nature', display: '森林' },
    { pattern: /花|花园|花朵|开花/g, category: 'nature', display: '花园' },
    { pattern: /天空|云|飞|飞翔|飞行/g, category: 'nature', display: '飞翔' },
    { pattern: /雨|下雨|暴雨|雷/g, category: 'nature', display: '雨夜' },
    { pattern: /雪|下雪|冰|冰冷/g, category: 'nature', display: '冰雪' },
    { pattern: /火|燃烧|火焰/g, category: 'nature', display: '火焰' },
    { pattern: /阳光|太阳|日出|日落/g, category: 'nature', display: '阳光' },
    
    // 动物
    { pattern: /猫|小猫/g, category: 'animal', display: '猫' },
    { pattern: /狗|小狗/g, category: 'animal', display: '狗' },
    { pattern: /鸟|飞鸟|鸟儿/g, category: 'animal', display: '飞鸟' },
    { pattern: /蛇/g, category: 'animal', display: '蛇' },
    { pattern: /鱼|游鱼/g, category: 'animal', display: '鱼' },
    { pattern: /蝴蝶/g, category: 'animal', display: '蝴蝶' },
    { pattern: /狼/g, category: 'animal', display: '狼' },
    { pattern: /狮|老虎|虎/g, category: 'animal', display: '猛兽' },
    { pattern: /龙/g, category: 'animal', display: '龙' },
    
    // 人物
    { pattern: /妈妈|母亲|妈/g, category: 'emotion', display: '母亲' },
    { pattern: /爸爸|父亲|爸/g, category: 'emotion', display: '父亲' },
    { pattern: /朋友|好友/g, category: 'emotion', display: '朋友' },
    { pattern: /陌生人|陌生/g, category: 'emotion', display: '陌生人' },
    { pattern: /孩子|小孩|儿童/g, category: 'emotion', display: '孩子' },
    { pattern: /老人|老者/g, category: 'emotion', display: '老者' },
    
    // 场景
    { pattern: /房子|房间|屋|家/g, category: 'scene', display: '房屋' },
    { pattern: /学校|教室|课堂/g, category: 'scene', display: '学校' },
    { pattern: /城市|街道|马路/g, category: 'scene', display: '城市' },
    { pattern: /迷宫|迷路/g, category: 'scene', display: '迷宫' },
    { pattern: /电梯|楼梯/g, category: 'scene', display: '楼梯' },
    { pattern: /桥/g, category: 'scene', display: '桥' },
    { pattern: /门|大门/g, category: 'object', display: '门' },
    { pattern: /窗|窗户/g, category: 'scene', display: '窗' },
    
    // 物品
    { pattern: /钥匙/g, category: 'object', display: '钥匙' },
    { pattern: /镜子|镜/g, category: 'object', display: '镜子' },
    { pattern: /书|书本/g, category: 'object', display: '书' },
    { pattern: /钟|时钟|钟表/g, category: 'object', display: '时钟' },
    { pattern: /信|信件|信封/g, category: 'object', display: '信' },
    { pattern: /手机|电话/g, category: 'object', display: '电话' },
    
    // 动作/状态
    { pattern: /追|追逐|被追|逃跑|奔跑/g, category: 'emotion', display: '追逐' },
    { pattern: /坠落|掉落|下坠|跌落/g, category: 'emotion', display: '坠落' },
    { pattern: /迟到|赶不上/g, category: 'emotion', display: '迟到' },
    { pattern: /考试|测验/g, category: 'scene', display: '考试' },
    { pattern: /死|死亡|去世/g, category: 'emotion', display: '死亡' },
    { pattern: /哭|流泪|眼泪/g, category: 'emotion', display: '泪水' },
    { pattern: /笑|微笑|大笑/g, category: 'emotion', display: '欢笑' },
    { pattern: /恐惧|害怕|恐怖/g, category: 'emotion', display: '恐惧' },
    { pattern: /爱|爱情|恋爱/g, category: 'emotion', display: '爱' },
  ];
  
  const foundKeywords: Array<{ display: string; category: string }> = [];
  
  // 匹配关键词
  for (const { pattern, category, display } of keywordPatterns) {
    if (pattern.test(content) && !foundKeywords.some(k => k.display === display)) {
      foundKeywords.push({ display, category });
      if (foundKeywords.length >= 4) break;
    }
  }
  
  // 如果找到的关键词不够，从内容中提取短词
  if (foundKeywords.length < 2) {
    // 提取2-4字的词组
    const shortPhrases = content.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    // 过滤掉常见无意义词和可能是句子片段的词
    const stopWords = ['我们', '他们', '这个', '那个', '什么', '怎么', '然后', '但是', '因为', '所以', '可以', '不是', '没有', '已经', '一个', '自己', '的时候', '的人', '的事', '一下', '起来', '出来', '进去', '过去', '回来', '下去', '上去', '出去', '进来'];
    const uniquePhrases = [...new Set(shortPhrases)].filter(p => {
      // 过滤掉停用词
      if (stopWords.includes(p)) return false;
      // 过滤掉以虚词开头或结尾的词组
      if (/^[的了是在有和与到被把给让跟向往从]/.test(p)) return false;
      if (/[的了是在有和与到被把给让跟向往从]$/.test(p)) return false;
      return true;
    });
    
    for (const phrase of uniquePhrases) {
      if (foundKeywords.length >= 3) break;
      if (!foundKeywords.some(k => k.display === phrase)) {
        foundKeywords.push({ display: phrase, category: 'emotion' });
      }
    }
  }
  
  // 添加emoji并返回
  if (foundKeywords.length === 0) {
    return ['🌙 神秘梦境', '✨ 未知意象'];
  }
  
  return foundKeywords.map(k => {
    const categoryEmojis = emojis[k.category] || emojis.emotion;
    const emoji = categoryEmojis[Math.floor(Math.random() * categoryEmojis.length)];
    return `${emoji} ${k.display}`;
  });
}

/**
 * Extract a compelling sentence from dream content
 */
function extractSentence(content: string): string {
  const sentences = content.split(/[。！？\n]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) {
    return '...梦境的碎片在记忆中闪烁...';
  }
  
  // Pick a random sentence
  const sentence = sentences[Math.floor(Math.random() * sentences.length)].trim();
  
  // Truncate if too long and add ellipsis
  if (sentence.length > 30) {
    return `...${sentence.substring(0, 28)}...`;
  }
  
  return `...${sentence}...`;
}

/**
 * POST /api/dreams/batch-delete - Delete multiple dream entries
 * Request body: { ids: string[] }
 * NOTE: This route must be defined before /:id routes to avoid matching "batch-delete" as an id
 */
router.post('/batch-delete', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        error: 'validation_error',
        message: 'ids must be a non-empty array',
      });
      return;
    }

    const results = {
      deleted: [] as string[],
      notFound: [] as string[],
    };

    for (const id of ids) {
      const deleted = deleteDream(id);
      if (deleted) {
        results.deleted.push(id);
      } else {
        results.notFound.push(id);
      }
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dreams/:id - Get a single dream by ID
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const dream = getDreamById(id);

    if (!dream) {
      res.status(404).json({
        error: 'not_found',
        message: `Dream with id '${id}' not found`,
      });
      return;
    }

    res.json(dream);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/dreams/:id - Update a dream entry
 */
router.put('/:id', validateUpdateDream, (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const dto: UpdateDreamDTO = req.body;
    const dream = updateDream(id, dto);

    if (!dream) {
      res.status(404).json({
        error: 'not_found',
        message: `Dream with id '${id}' not found`,
      });
      return;
    }

    res.json(dream);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/dreams/:id - Delete a dream entry
 */
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const deleted = deleteDream(id);

    if (!deleted) {
      res.status(404).json({
        error: 'not_found',
        message: `Dream with id '${id}' not found`,
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/dreams/:id/analyze - Trigger AI analysis for a dream
 * Analyzes symbols and emotions in the dream content
 */
router.post('/:id/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    // Check if dream exists first
    const dream = getDreamById(id);
    if (!dream) {
      res.status(404).json({
        error: 'not_found',
        message: `Dream with id '${id}' not found`,
      });
      return;
    }

    // Perform AI analysis
    const analysis = await analyzeDream(id);
    res.json(analysis);
  } catch (error) {
    // Handle AI service errors
    if (error instanceof Error) {
      if (error.message.includes('ZHIPU_API_KEY')) {
        res.status(503).json({
          error: 'ai_service_unavailable',
          message: 'AI service is not configured',
        });
        return;
      }
      if (error.message.includes('Zhipu API error') || error.message.includes('Zhipu Image API error')) {
        res.status(502).json({
          error: 'ai_service_error',
          message: 'AI service request failed',
        });
        return;
      }
    }
    next(error);
  }
});

/**
 * POST /api/dreams/:id/generate-creative - Generate creative content (story or poem)
 * Request body: { format: 'story' | 'poem' }
 */
router.post('/:id/generate-creative', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const format = req.body.format as CreativeFormat;

    // Validate format
    if (!format || !['story', 'poem'].includes(format)) {
      res.status(400).json({
        error: 'validation_error',
        message: "Invalid format. Must be 'story' or 'poem'",
      });
      return;
    }

    // Check if dream exists first
    const dream = getDreamById(id);
    if (!dream) {
      res.status(404).json({
        error: 'not_found',
        message: `Dream with id '${id}' not found`,
      });
      return;
    }

    // Generate creative content
    const content = await generateCreativeContent(id, format);
    res.json({ content, format });
  } catch (error) {
    // Handle AI service errors
    if (error instanceof Error) {
      if (error.message.includes('ZHIPU_API_KEY')) {
        res.status(503).json({
          error: 'ai_service_unavailable',
          message: 'AI service is not configured',
        });
        return;
      }
      if (error.message.includes('Zhipu API error')) {
        res.status(502).json({
          error: 'ai_service_error',
          message: 'AI service request failed',
        });
        return;
      }
    }
    next(error);
  }
});

/**
 * POST /api/dreams/:id/generate-image - Generate a representative image for a dream
 */
router.post('/:id/generate-image', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    // Check if dream exists first
    const dream = getDreamById(id);
    if (!dream) {
      res.status(404).json({
        error: 'not_found',
        message: `Dream with id '${id}' not found`,
      });
      return;
    }

    // Generate image
    const imageUrl = await generateDreamImage(id);
    res.json({ imageUrl });
  } catch (error) {
    // Handle AI service errors
    if (error instanceof Error) {
      if (error.message.includes('ZHIPU_API_KEY')) {
        res.status(503).json({
          error: 'ai_service_unavailable',
          message: 'AI service is not configured',
        });
        return;
      }
      if (error.message.includes('Zhipu Image API error')) {
        res.status(502).json({
          error: 'ai_service_error',
          message: 'Image generation service request failed',
        });
        return;
      }
    }
    next(error);
  }
});

export default router;
