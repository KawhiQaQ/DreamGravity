/**
 * Dream Followup API Routes
 * Handles REST API endpoints for dream followups (reality correlations)
 */
import { Router, Request, Response, NextFunction } from 'express';
import { getDreamById } from '../dao/dreamDao';
import {
  createFollowup,
  getFollowupsByDreamId,
  getFollowupById,
  updateFollowup,
  deleteFollowup,
} from '../dao/followupDao';
import { analyzeDreamPattern } from '../services/patternService';
import type { CreateFollowupDTO } from '../../../shared/types/api';

const router = Router();

/**
 * POST /api/dreams/:dreamId/followups - Add a followup to a dream
 */
router.post('/:dreamId/followups', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dreamId = req.params.dreamId as string;
    const dto: CreateFollowupDTO = req.body;

    // Validate dream exists
    const dream = getDreamById(dreamId);
    if (!dream) {
      res.status(404).json({
        error: 'not_found',
        message: `Dream with id '${dreamId}' not found`,
      });
      return;
    }

    // Validate request body
    if (!dto.content || typeof dto.content !== 'string') {
      res.status(400).json({
        error: 'validation_error',
        message: 'content is required and must be a string',
      });
      return;
    }

    if (typeof dto.cameTrue !== 'boolean') {
      res.status(400).json({
        error: 'validation_error',
        message: 'cameTrue is required and must be a boolean',
      });
      return;
    }

    if (!dto.followupDate) {
      res.status(400).json({
        error: 'validation_error',
        message: 'followupDate is required',
      });
      return;
    }

    const followup = createFollowup(dreamId, dto);

    // If the followup indicates the dream came true, trigger pattern analysis
    if (dto.cameTrue) {
      try {
        await analyzeDreamPattern(dreamId);
      } catch (error) {
        // Pattern analysis failure shouldn't fail the followup creation
        console.error('Pattern analysis failed:', error);
      }
    }

    res.status(201).json(followup);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dreams/:dreamId/followups - Get all followups for a dream
 */
router.get('/:dreamId/followups', (req: Request, res: Response, next: NextFunction) => {
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

    const followups = getFollowupsByDreamId(dreamId);
    res.json(followups);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/followups/:id - Update a followup
 */
router.put('/followups/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const dto: Partial<CreateFollowupDTO> = req.body;

    const existing = getFollowupById(id);
    if (!existing) {
      res.status(404).json({
        error: 'not_found',
        message: `Followup with id '${id}' not found`,
      });
      return;
    }

    const followup = updateFollowup(id, dto);

    // If cameTrue changed to true, trigger pattern analysis
    if (dto.cameTrue === true && !existing.cameTrue) {
      try {
        await analyzeDreamPattern(existing.dreamId);
      } catch (error) {
        console.error('Pattern analysis failed:', error);
      }
    }

    res.json(followup);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/followups/:id - Delete a followup
 */
router.delete('/followups/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const deleted = deleteFollowup(id);
    if (!deleted) {
      res.status(404).json({
        error: 'not_found',
        message: `Followup with id '${id}' not found`,
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
