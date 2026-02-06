/**
 * Dream Data Access Object (DAO)
 * Handles all database operations for dreams
 */
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import type {
  DreamEntry,
  DreamPreview,
  EmotionTag,
  ClarityRating,
  DreamAnalysis,
  SymbolAnalysis,
  EmotionAnalysis,
  DreamFollowup,
  DreamPattern,
} from '../../../shared/types/dream';
import type { CreateDreamDTO, UpdateDreamDTO, QueryParams, PaginatedResult } from '../../../shared/types/api';

// Lazy imports to avoid circular dependency issues
let _getFollowupsByDreamId: ((dreamId: string) => DreamFollowup[]) | null = null;
let _getPatternsByDreamId: ((dreamId: string) => DreamPattern[]) | null = null;

function getFollowupsByDreamIdLazy(dreamId: string): DreamFollowup[] {
  if (!_getFollowupsByDreamId) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _getFollowupsByDreamId = require('./followupDao').getFollowupsByDreamId;
  }
  return _getFollowupsByDreamId!(dreamId);
}

function getPatternsByDreamIdLazy(dreamId: string): DreamPattern[] {
  if (!_getPatternsByDreamId) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _getPatternsByDreamId = require('./patternDao').getPatternsByDreamId;
  }
  return _getPatternsByDreamId!(dreamId);
}

/**
 * Database row type for dreams table
 */
interface DreamRow {
  id: string;
  content: string;
  dream_date: string;
  sleep_start_time: string | null;
  sleep_end_time: string | null;
  emotion_tag: string;
  clarity: number;
  is_recurring: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type for dream_analyses table
 */
interface AnalysisRow {
  id: string;
  dream_id: string;
  symbol_analysis: string;
  emotion_analysis: string;
  generated_story: string | null;
  generated_poem: string | null;
  created_at: string;
}

/**
 * Convert database row to DreamEntry
 */
function rowToDreamEntry(row: DreamRow, analysis?: AnalysisRow, followups?: DreamFollowup[], patterns?: DreamPattern[]): DreamEntry {
  return {
    id: row.id,
    content: row.content,
    dreamDate: new Date(row.dream_date),
    sleepStartTime: row.sleep_start_time || undefined,
    sleepEndTime: row.sleep_end_time || undefined,
    emotionTag: row.emotion_tag as EmotionTag,
    clarity: row.clarity as ClarityRating,
    isRecurring: Boolean(row.is_recurring),
    imageUrl: row.image_url || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    analysis: analysis ? rowToAnalysis(analysis) : undefined,
    followups: followups && followups.length > 0 ? followups : undefined,
    patterns: patterns && patterns.length > 0 ? patterns : undefined,
  };
}

/**
 * Convert database row to DreamPreview
 */
function rowToDreamPreview(row: DreamRow & { has_analysis: number; has_followup: number }): DreamPreview {
  return {
    id: row.id,
    content: row.content,
    dreamDate: new Date(row.dream_date),
    sleepStartTime: row.sleep_start_time || undefined,
    sleepEndTime: row.sleep_end_time || undefined,
    emotionTag: row.emotion_tag as EmotionTag,
    clarity: row.clarity as ClarityRating,
    isRecurring: Boolean(row.is_recurring),
    hasAnalysis: Boolean(row.has_analysis),
    hasImage: Boolean(row.image_url),
    hasFollowup: Boolean(row.has_followup),
    imageUrl: row.image_url || undefined,
  };
}

/**
 * Convert database row to DreamAnalysis
 */
function rowToAnalysis(row: AnalysisRow): DreamAnalysis {
  return {
    id: row.id,
    dreamId: row.dream_id,
    symbolAnalysis: JSON.parse(row.symbol_analysis) as SymbolAnalysis,
    emotionAnalysis: JSON.parse(row.emotion_analysis) as EmotionAnalysis,
    generatedStory: row.generated_story || undefined,
    generatedPoem: row.generated_poem || undefined,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Create a new dream entry
 */
export function createDream(dto: CreateDreamDTO): DreamEntry {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO dreams (id, content, dream_date, sleep_start_time, sleep_end_time, emotion_tag, clarity, is_recurring, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    dto.content,
    dto.dreamDate,
    dto.sleepStartTime || null,
    dto.sleepEndTime || null,
    dto.emotionTag,
    dto.clarity,
    dto.isRecurring ? 1 : 0,
    now,
    now
  );

  return getDreamById(id)!;
}

/**
 * Get a dream by ID with optional analysis
 */
export function getDreamById(id: string): DreamEntry | null {
  const db = getDatabase();

  const dreamStmt = db.prepare('SELECT * FROM dreams WHERE id = ?');
  const dreamRow = dreamStmt.get(id) as DreamRow | undefined;

  if (!dreamRow) {
    return null;
  }

  const analysisStmt = db.prepare('SELECT * FROM dream_analyses WHERE dream_id = ?');
  const analysisRow = analysisStmt.get(id) as AnalysisRow | undefined;

  // Try to get followups and patterns, but don't fail if tables don't exist
  let followups: DreamFollowup[] = [];
  let patterns: DreamPattern[] = [];
  
  try {
    followups = getFollowupsByDreamIdLazy(id);
  } catch {
    // Table might not exist yet
  }
  
  try {
    patterns = getPatternsByDreamIdLazy(id);
  } catch {
    // Table might not exist yet
  }

  return rowToDreamEntry(dreamRow, analysisRow, followups, patterns);
}

/**
 * Get paginated list of dreams with filtering
 */
export function getDreams(params: QueryParams = {}): PaginatedResult<DreamPreview> {
  const db = getDatabase();
  const { page = 1, limit = 10, dateRange, emotions, clarityMin, clarityMax } = params;

  // Build WHERE clause
  const conditions: string[] = [];
  const queryParams: (string | number)[] = [];

  if (dateRange?.start) {
    conditions.push('dream_date >= ?');
    queryParams.push(dateRange.start);
  }

  if (dateRange?.end) {
    conditions.push('dream_date <= ?');
    queryParams.push(dateRange.end);
  }

  if (emotions && emotions.length > 0) {
    const placeholders = emotions.map(() => '?').join(', ');
    conditions.push(`emotion_tag IN (${placeholders})`);
    queryParams.push(...emotions);
  }

  if (clarityMin !== undefined) {
    conditions.push('clarity >= ?');
    queryParams.push(clarityMin);
  }

  if (clarityMax !== undefined) {
    conditions.push('clarity <= ?');
    queryParams.push(clarityMax);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM dreams ${whereClause}`);
  const countResult = countStmt.get(...queryParams) as { count: number };
  const total = countResult.count;

  // Calculate pagination
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);

  // Get paginated results with analysis flag
  const dataStmt = db.prepare(`
    SELECT d.*, 
           CASE WHEN da.id IS NOT NULL THEN 1 ELSE 0 END as has_analysis,
           0 as has_followup
    FROM dreams d
    LEFT JOIN dream_analyses da ON d.id = da.dream_id
    ${whereClause}
    ORDER BY d.dream_date DESC, d.created_at DESC
    LIMIT ? OFFSET ?
  `);

  const rows = dataStmt.all(...queryParams, limit, offset) as (DreamRow & { has_analysis: number; has_followup: number })[];
  const data = rows.map(rowToDreamPreview);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Update a dream entry
 */
export function updateDream(id: string, dto: UpdateDreamDTO): DreamEntry | null {
  const db = getDatabase();

  // Check if dream exists
  const existing = getDreamById(id);
  if (!existing) {
    return null;
  }

  // Build UPDATE clause dynamically
  const updates: string[] = [];
  const updateParams: (string | number)[] = [];

  if (dto.content !== undefined) {
    updates.push('content = ?');
    updateParams.push(dto.content);
  }

  if (dto.dreamDate !== undefined) {
    updates.push('dream_date = ?');
    updateParams.push(dto.dreamDate);
  }

  if (dto.sleepStartTime !== undefined) {
    updates.push('sleep_start_time = ?');
    updateParams.push(dto.sleepStartTime);
  }

  if (dto.sleepEndTime !== undefined) {
    updates.push('sleep_end_time = ?');
    updateParams.push(dto.sleepEndTime);
  }

  if (dto.emotionTag !== undefined) {
    updates.push('emotion_tag = ?');
    updateParams.push(dto.emotionTag);
  }

  if (dto.clarity !== undefined) {
    updates.push('clarity = ?');
    updateParams.push(dto.clarity);
  }

  if (dto.isRecurring !== undefined) {
    updates.push('is_recurring = ?');
    updateParams.push(dto.isRecurring ? 1 : 0);
  }

  if (updates.length === 0) {
    return existing;
  }

  // Always update the updated_at timestamp
  updates.push('updated_at = ?');
  updateParams.push(new Date().toISOString());

  const stmt = db.prepare(`UPDATE dreams SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...updateParams, id);

  return getDreamById(id);
}

/**
 * Delete a dream entry
 */
export function deleteDream(id: string): boolean {
  const db = getDatabase();

  const stmt = db.prepare('DELETE FROM dreams WHERE id = ?');
  const result = stmt.run(id);

  return result.changes > 0;
}

/**
 * Update dream's image URL
 */
export function updateDreamImageUrl(id: string, imageUrl: string): DreamEntry | null {
  const db = getDatabase();

  const stmt = db.prepare('UPDATE dreams SET image_url = ?, updated_at = ? WHERE id = ?');
  stmt.run(imageUrl, new Date().toISOString(), id);

  return getDreamById(id);
}

/**
 * Save dream analysis
 */
export function saveDreamAnalysis(
  dreamId: string,
  symbolAnalysis: SymbolAnalysis,
  emotionAnalysis: EmotionAnalysis,
  generatedStory?: string,
  generatedPoem?: string
): DreamAnalysis | null {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  // Check if dream exists
  const dream = getDreamById(dreamId);
  if (!dream) {
    return null;
  }

  // Delete existing analysis if any
  const deleteStmt = db.prepare('DELETE FROM dream_analyses WHERE dream_id = ?');
  deleteStmt.run(dreamId);

  // Insert new analysis
  const stmt = db.prepare(`
    INSERT INTO dream_analyses (id, dream_id, symbol_analysis, emotion_analysis, generated_story, generated_poem, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    dreamId,
    JSON.stringify(symbolAnalysis),
    JSON.stringify(emotionAnalysis),
    generatedStory || null,
    generatedPoem || null,
    now
  );

  const analysisStmt = db.prepare('SELECT * FROM dream_analyses WHERE id = ?');
  const row = analysisStmt.get(id) as AnalysisRow;

  return rowToAnalysis(row);
}

/**
 * Update only the generated story for a dream analysis
 */
export function updateGeneratedStory(dreamId: string, story: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE dream_analyses SET generated_story = ? WHERE dream_id = ?');
  const result = stmt.run(story, dreamId);
  return result.changes > 0;
}

/**
 * Update only the generated poem for a dream analysis
 */
export function updateGeneratedPoem(dreamId: string, poem: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE dream_analyses SET generated_poem = ? WHERE dream_id = ?');
  const result = stmt.run(poem, dreamId);
  return result.changes > 0;
}

/**
 * Get dreams by date (for calendar view)
 */
export function getDreamsByMonth(year: number, month: number): DreamPreview[] {
  const db = getDatabase();

  // Month is 1-indexed
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const stmt = db.prepare(`
    SELECT d.*, 
           CASE WHEN da.id IS NOT NULL THEN 1 ELSE 0 END as has_analysis,
           0 as has_followup
    FROM dreams d
    LEFT JOIN dream_analyses da ON d.id = da.dream_id
    WHERE d.dream_date >= ? AND d.dream_date < ?
    ORDER BY d.dream_date ASC
  `);

  const rows = stmt.all(startDate, endDate) as (DreamRow & { has_analysis: number; has_followup: number })[];
  return rows.map(rowToDreamPreview);
}

/**
 * Get the earliest dream date
 */
export function getEarliestDreamDate(): string | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT MIN(dream_date) as earliest FROM dreams');
  const result = stmt.get() as { earliest: string | null };
  return result.earliest;
}


/**
 * Get a random dream fragment for Subconscious Echo component
 */
export function getRandomDreamFragment(): { id: string; content: string; dreamDate: string; emotionTag: string } | null {
  const db = getDatabase();
  
  // Get a random dream
  const stmt = db.prepare(`
    SELECT id, content, dream_date, emotion_tag 
    FROM dreams 
    ORDER BY RANDOM() 
    LIMIT 1
  `);
  
  const row = stmt.get() as { id: string; content: string; dream_date: string; emotion_tag: string } | undefined;
  
  if (!row) {
    return null;
  }
  
  return {
    id: row.id,
    content: row.content,
    dreamDate: row.dream_date,
    emotionTag: row.emotion_tag,
  };
}
