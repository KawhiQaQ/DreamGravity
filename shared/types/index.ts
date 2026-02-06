/**
 * 共享类型导出
 * 统一导出所有梦境记录系统的类型定义
 */

// 梦境相关类型
export type {
  EmotionTag,
  ClarityRating,
  SymbolElementType,
  SymbolElement,
  SymbolAnalysis,
  EmotionAnalysis,
  DreamAnalysis,
  DreamEntry,
  DreamPreview,
  DreamFollowup,
  DreamPattern,
  PatternType,
} from './dream';

export { 
  EmotionTagLabels,
  EMOTION_TAGS,
  CLARITY_MIN,
  CLARITY_MAX,
} from './dream';

// API 相关类型
export type {
  CreateDreamDTO,
  UpdateDreamDTO,
  DreamFilters,
  QueryParams,
  PaginatedResult,
  ApiError,
  ApiResponse,
  DreamListResponse,
  DreamDetailResponse,
  AnalysisResponse,
  ImageGenerationResponse,
  CreativeFormat,
  GenerateCreativeDTO,
  CreativeResponse,
  ThemeStatistics,
  CharacterStatistics,
  EmotionDistribution,
  CommonThemeComparison,
  DreamStatistics,
  DreamReport,
  CreateFollowupDTO,
  FollowupResponse,
  PatternResponse,
  AnalyzePatternDTO,
  ExportPdfDTO,
  ExportPdfResponse,
  CollectiveDream,
  DreamUniverseStory,
  CollectiveDreamsResponse,
  DreamUniverseStoriesResponse,
  GenerateUniverseStoryDTO,
  ModelStatus,
  WeeklyReport,
  WeeklyReportsResponse,
  GenerateWeeklyReportDTO,
  WeekRange,
  WeekInfo,
  WeeksListResponse,
  DreamIPCharacter,
  WeeklyReportWithIP,
  DreamUniverseResponse,
} from './api';

// 潜意识回响类型
export type {
  EchoDisplayMode,
  DreamFragment,
} from './echo';
