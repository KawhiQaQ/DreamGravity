/**
 * Export API Routes
 * Handles PDF export endpoints
 */
import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { exportDreamsToPdf, getExportUrl, cleanupOldExports } from '../services/pdfExportService';
import { exportReportToPdf, getReportExportUrl } from '../services/reportPdfService';
import { exportDreamDetailToPdf, getDreamDetailExportUrl } from '../services/dreamDetailPdfService';
import { exportConstellationCardToImage, getConstellationCardExportUrl } from '../services/constellationCardExportService';
import type { ExportPdfDTO, DreamReport, ConstellationCard } from '../../../shared/types/api';
import type { DreamEntry } from '../../../shared/types/dream';

const router = Router();
const EXPORT_DIR = path.join(process.cwd(), 'data', 'exports');

/**
 * POST /api/exports/pdf - Export dreams to PDF
 */
router.post('/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options: ExportPdfDTO = req.body || {};

    // Clean up old exports first
    cleanupOldExports();

    const { filename } = await exportDreamsToPdf(options);
    const pdfUrl = getExportUrl(filename);

    res.json({
      pdfUrl,
      filename,
    });
  } catch (error) {
    if (error instanceof Error && error.message === '没有找到可导出的梦境记录') {
      res.status(404).json({
        error: 'not_found',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/exports/report - Export dream report to PDF (使用 Puppeteer 渲染)
 */
router.post('/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report: DreamReport = req.body;

    if (!report || !report.id || !report.statistics) {
      res.status(400).json({
        error: 'invalid_request',
        message: '请提供有效的报告数据',
      });
      return;
    }

    // Clean up old exports first
    cleanupOldExports();

    const { filename } = await exportReportToPdf(report);
    const pdfUrl = getReportExportUrl(filename);

    res.json({
      pdfUrl,
      filename,
    });
  } catch (error) {
    console.error('Export report PDF error:', error);
    next(error);
  }
});

/**
 * POST /api/exports/dream - Export dream detail to PDF (使用 Puppeteer 渲染)
 */
router.post('/dream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dream: DreamEntry = req.body;

    if (!dream || !dream.id || !dream.content) {
      res.status(400).json({
        error: 'invalid_request',
        message: '请提供有效的梦境数据',
      });
      return;
    }

    // Clean up old exports first
    cleanupOldExports();

    const { filename } = await exportDreamDetailToPdf(dream);
    const pdfUrl = getDreamDetailExportUrl(filename);

    res.json({
      pdfUrl,
      filename,
    });
  } catch (error) {
    console.error('Export dream detail PDF error:', error);
    next(error);
  }
});

/**
 * POST /api/exports/constellation - Export constellation card to image (使用 Puppeteer 渲染)
 */
router.post('/constellation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const card: ConstellationCard = req.body;

    if (!card || !card.id || !card.name || !card.nodes) {
      res.status(400).json({
        error: 'invalid_request',
        message: '请提供有效的星座卡片数据',
      });
      return;
    }

    // Clean up old exports first
    cleanupOldExports();

    const { filename } = await exportConstellationCardToImage(card);
    const imageUrl = getConstellationCardExportUrl(filename);

    res.json({
      imageUrl,
      filename,
    });
  } catch (error) {
    console.error('Export constellation card error:', error);
    next(error);
  }
});

/**
 * GET /api/exports/:filename - Download exported file (PDF or image)
 */
router.get('/:filename', (req: Request, res: Response, next: NextFunction) => {
  try {
    const filename = req.params.filename as string;

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      res.status(400).json({
        error: 'invalid_filename',
        message: 'Invalid filename',
      });
      return;
    }

    const filePath = path.join(EXPORT_DIR, filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        error: 'not_found',
        message: 'Export file not found',
      });
      return;
    }

    // 根据文件扩展名设置 Content-Type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

export default router;
