import type { EmotionTag, ClarityRating, DreamEntry, DreamPreview, DreamAnalysis, DreamFollowup, DreamPattern, PatternType } from './dream';

/**
 * 创建梦境请求 DTO
 */
export interface CreateDreamDTO {
  content: string;
  dreamDate: string; // ISO date string
  sleepStartTime?: string;
  sleepEndTime?: string;
  emotionTag: EmotionTag;
  clarity: ClarityRating;
  isRecurring: boolean;
}

/**
 * 更新梦境请求 DTO
 */
export interface UpdateDreamDTO {
  content?: string;
  dreamDate?: string;
  sleepStartTime?: string;
  sleepEndTime?: string;
  emotionTag?: EmotionTag;
  clarity?: ClarityRating;
  isRecurring?: boolean;
}

/**
 * 梦境筛选参数
 */
export interface DreamFilters {
  dateRange?: {
    start: string; // ISO date string
    end: string;
  };
  emotions?: EmotionTag[];
  clarityMin?: ClarityRating;
  clarityMax?: ClarityRating;
}

/**
 * 分页查询参数
 */
export interface QueryParams extends DreamFilters {
  page?: number;
  limit?: number;
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * API 错误响应
 */
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, string>;
}

/**
 * API 成功响应
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * 梦境列表响应
 */
export type DreamListResponse = PaginatedResult<DreamPreview>;

/**
 * 梦境详情响应
 */
export type DreamDetailResponse = DreamEntry;

/**
 * 梦境解析响应
 */
export type AnalysisResponse = DreamAnalysis;

/**
 * 图片生成响应
 */
export interface ImageGenerationResponse {
  imageUrl: string;
}

/**
 * 创意生成类型
 */
export type CreativeFormat = 'story' | 'poem';

/**
 * 创意生成请求
 */
export interface GenerateCreativeDTO {
  format: CreativeFormat;
}

/**
 * 创意生成响应
 */
export interface CreativeResponse {
  content: string;
  format: CreativeFormat;
}

/**
 * 梦境主题统计
 */
export interface ThemeStatistics {
  theme: string;
  count: number;
  percentage: number;
}

/**
 * 人物统计
 */
export interface CharacterStatistics {
  character: string;
  count: number;
  percentage: number;
}

/**
 * 情绪分布统计
 */
export interface EmotionDistribution {
  emotion: string;
  label: string;
  count: number;
  percentage: number;
}

/**
 * 常见梦境主题对比数据
 */
export interface CommonThemeComparison {
  theme: string;
  userPercentage: number;
  averagePercentage: number;
  description: string;
}

/**
 * 梦境统计分析结果
 */
export interface DreamStatistics {
  totalDreams: number;
  analyzedDreams: number;
  recurringDreams: number;
  averageClarity: number;
  themes: ThemeStatistics[];
  characters: CharacterStatistics[];
  emotionDistribution: EmotionDistribution[];
  dateRange: {
    start: string;
    end: string;
  };
}

/**
 * 梦境报告
 */
export interface DreamReport {
  id: string;
  generatedAt: string;
  statistics: DreamStatistics;
  themeComparison: CommonThemeComparison[];
  insights: string;
  recommendations: string;
}


/**
 * 梦境元素类型
 */
export type DreamElementType = 'person' | 'place' | 'object' | 'action';

/**
 * 梦境元素节点
 */
export interface DreamElementNode {
  id: string;
  name: string;
  type: DreamElementType;
  count: number;        // 出现次数
  dreamIds: string[];   // 出现在哪些梦境中
}

/**
 * 元素关联边
 */
export interface DreamElementLink {
  source: string;       // 源节点ID
  target: string;       // 目标节点ID
  weight: number;       // 关联强度（共同出现次数）
  dreamIds: string[];   // 共同出现的梦境ID
}

/**
 * 梦境元素图谱数据
 */
export interface DreamElementGraph {
  nodes: DreamElementNode[];
  links: DreamElementLink[];
  totalDreams: number;
  totalElements: number;
  dreamDates?: Record<string, string>;  // dreamId -> ISO date string
}

/**
 * 星座卡片节点
 */
export interface ConstellationNode {
  x: number;
  y: number;
  name: string;
  type: DreamElementType;
  size: number;
}

/**
 * 星座卡片连线
 */
export interface ConstellationLink {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * 星座卡片数据
 */
export interface ConstellationCard {
  id: string;
  name: string;
  description: string;
  prophecy: string;
  nodes: ConstellationNode[];
  links: ConstellationLink[];
  totalDreams: number;
  totalElements: number;
  topElements: { name: string; type: DreamElementType; count: number }[];
  createdAt: string;
}


/**
 * 创建梦境后续关联请求 DTO
 */
export interface CreateFollowupDTO {
  content: string;
  cameTrue: boolean;
  followupDate: string; // ISO date string
}

/**
 * 梦境后续关联响应
 */
export type FollowupResponse = DreamFollowup;

/**
 * 梦境模式识别响应
 */
export type PatternResponse = DreamPattern;

/**
 * 梦境模式分析请求
 */
export interface AnalyzePatternDTO {
  patternType?: PatternType;
}

/**
 * PDF导出请求参数
 */
export interface ExportPdfDTO {
  dreamIds?: string[];
  includeAnalysis?: boolean;
  includeFollowups?: boolean;
  includePatterns?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * PDF导出响应
 */
export interface ExportPdfResponse {
  pdfUrl: string;
  filename: string;
}


/**
 * 集体潜意识池 - 匿名梦境
 */
export interface CollectiveDream {
  id: string;
  originalDreamId: string | null;
  content: string;
  emotionTag: string;
  clarity: number;
  sharedAt: string;
  viewCount: number;
}

/**
 * 梦境宇宙故事
 */
export interface DreamUniverseStory {
  id: string;
  title: string;
  storyContent: string;
  sourceDreamIds: string[];
  createdAt: string;
}

/**
 * 集体梦境列表响应
 */
export interface CollectiveDreamsResponse {
  dreams: CollectiveDream[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 梦境宇宙故事列表响应
 */
export interface DreamUniverseStoriesResponse {
  stories: DreamUniverseStory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 生成梦境宇宙故事请求
 */
export interface GenerateUniverseStoryDTO {
  dreamIds: string[];
}


/**
 * 模型生成状态
 */
export type ModelStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 周报
 */
export interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  dreamCount: number;
  summary: string;
  totemName: string;
  totemDescription: string;
  modelPrompt: string | null;
  modelUrl: string | null;
  modelStatus: ModelStatus;
  tripoTaskId: string | null;
  createdAt: string;
}

/**
 * 周报列表响应
 */
export interface WeeklyReportsResponse {
  reports: WeeklyReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 生成周报请求
 */
export interface GenerateWeeklyReportDTO {
  weekStart?: string;
  weekEnd?: string;
}

/**
 * 周日期范围
 */
export interface WeekRange {
  weekStart: string;
  weekEnd: string;
}

/**
 * 周信息（包含已生成和待生成的周）
 */
export interface WeekInfo {
  weekStart: string;
  weekEnd: string;
  status: 'pending' | 'generated' | 'incomplete';
  dreamCount: number;
  daysWithDreams: number;
  missingDays: string[];
  report?: WeeklyReportWithIP;
}

/**
 * 周列表响应
 */
export interface WeeksListResponse {
  weeks: WeekInfo[];
}


/**
 * 梦境IP角色
 */
export interface DreamIPCharacter {
  id: string;
  weeklyReportId: string;
  name: string;
  title: string | null;
  personality: string | null;
  backstory: string | null;
  abilities: string | null;
  appearance: string | null;
  catchphrase: string | null;
  modelUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

/**
 * 周报详情（包含IP角色）
 */
export interface WeeklyReportWithIP extends WeeklyReport {
  ipCharacter: DreamIPCharacter | null;
}

/**
 * 梦境宇宙响应
 */
export interface DreamUniverseResponse {
  characters: DreamIPCharacter[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
