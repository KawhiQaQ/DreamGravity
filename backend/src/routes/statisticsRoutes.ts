/**
 * Statistics API Routes
 * Handles dream statistics and report generation endpoints
 */
import { Router, Request, Response, NextFunction } from 'express';
import {
  getDreamStatistics,
  generateDreamReport,
  getReports,
  getReportById,
  deleteReport,
  deleteReports,
} from '../services/statisticsService';

const router = Router();

/**
 * GET /api/statistics - Get dream statistics
 */
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const statistics = getDreamStatistics();
    res.json(statistics);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/statistics/reports - Get all saved reports
 */
router.get('/reports', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = getReports();
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/statistics/reports/:id - Get a single report by ID
 */
router.get('/reports/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const report = getReportById(id);
    if (!report) {
      res.status(404).json({ error: 'not_found', message: 'Report not found' });
      return;
    }
    res.json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/statistics/reports/:id - Delete a single report
 */
router.delete('/reports/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const deleted = deleteReport(id);
    if (!deleted) {
      res.status(404).json({ error: 'not_found', message: 'Report not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/statistics/reports/batch-delete - Delete multiple reports
 */
router.post('/reports/batch-delete', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'validation_error', message: 'ids must be a non-empty array' });
      return;
    }
    const result = deleteReports(ids);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/statistics/report - Generate dream report
 */
router.post('/report', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await generateDreamReport();
    res.json(report);
  } catch (error) {
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

export default router;
