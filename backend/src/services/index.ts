/**
 * Services Module
 * Exports all service functions
 */

export {
  getAIService,
  createAIService,
  resetAIService,
  type AIService,
  type AIServiceConfig,
} from './ai';

export {
  analyzeDream,
  analyzeSymbolsOnly,
  analyzeEmotionsOnly,
  generateCreativeContent,
  generateDreamImage,
  getOrAnalyzeDream,
  type FullAnalysisResult,
} from './dreamAnalysisService';

export {
  getDreamStatistics,
  generateDreamReport,
  getReports,
  getReportById,
  deleteReport,
  deleteReports,
} from './statisticsService';

export {
  analyzeDreamPattern,
  getPatternSummary,
} from './patternService';

export {
  exportDreamsToPdf,
  getExportUrl,
  cleanupOldExports,
} from './pdfExportService';

export {
  downloadAndSaveImage,
  isLocalImagePath,
  deleteLocalImage,
} from './imageService';
