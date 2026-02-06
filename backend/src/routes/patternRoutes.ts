/**
 * Dream Pattern API Routes
 * Handles REST API endpoints for dream pattern recognition
 */
import { Router, Request, Response, NextFunction } from 'express';
import { getDreamById } from '../dao/dreamDao';
import { getPatternsByDreamId } from '../dao/patternDao';
import { analyzeDreamPattern, getPatternSummary } from '../services/patternService';

const router = Router();

/**
 * POST /api/dreams/:dreamId/patterns/analyze - Analyze patterns for a dream
 */
router.post('/:dreamId/patterns/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dreamId = req.params.dreamId as string;

    // Validate dream exists
    const dream = getDreamById(dreamId);
    if (!dream) {
      res.status(404).json({
        error: 'not_found',
        message: `Dream with id '${dreamId}' not found`,
      });
      return;
    }

    const patterns = await analyzeDreamPattern(dreamId);
    res.json(patterns);
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
    }
    next(error);
  }
});

/**
 * GET /api/dreams/:dreamId/patterns - Get patterns for a dream
 */
router.get('/:dreamId/patterns', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dreamId = req.params.dreamId as string;

    // Validate dream exists
    const dream = getDreamById(dreamId);
    if (!dream) {
      res.status(404).json({
        error: 'not_found',
        message: `Dream with id '${dreamId}' not found`,
      });
      return;
    }

    const patterns = getPatternsByDreamId(dreamId);
    res.json(patterns);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/patterns/summary - Get pattern summary across all dreams
 */
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await getPatternSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

export default router;
