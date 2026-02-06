/**
 * 集体潜意识池 DAO
 * 处理匿名梦境分享和梦境宇宙故事的数据库操作
 */
import { getDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';

export interface CollectiveDream {
  id: string;
  originalDreamId: string | null;
  content: string;
  emotionTag: string;
  clarity: number;
  sharedAt: string;
  viewCount: number;
}

export interface DreamUniverseStory {
  id: string;
  title: string;
  storyContent: string;
  sourceDreamIds: string[];
  createdAt: string;
}

interface CollectiveDreamRow {
  id: string;
  original_dream_id: string | null;
  content: string;
  emotion_tag: string;
  clarity: number;
  shared_at: string;
  view_count: number;
}

interface DreamUniverseStoryRow {
  id: string;
  title: string;
  story_content: string;
  source_dream_ids: string;
  created_at: string;
}

/**
 * 分享梦境到集体潜意识池
 */
export function shareDreamToPool(
  originalDreamId: string,
  content: string,
  emotionTag: string,
  clarity: number
): CollectiveDream {
  const db = getDatabase();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO collective_dreams (id, original_dream_id, content, emotion_tag, clarity)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, originalDreamId, content, emotionTag, clarity);
  
  return getCollectiveDreamById(id)!;
}

/**
 * 获取单个集体梦境
 */
export function getCollectiveDreamById(id: string): CollectiveDream | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT * FROM collective_dreams WHERE id = ?
  `).get(id) as CollectiveDreamRow | undefined;
  
  if (!row) return null;
  
  return mapRowToCollectiveDream(row);
}

/**
 * 获取集体潜意识池中的所有梦境（分页）
 */
export function getCollectiveDreams(
  page: number = 1,
  limit: number = 20,
  emotionFilter?: string
): { dreams: CollectiveDream[]; total: number } {
  const db = getDatabase();
  
  let whereClause = '';
  const params: (string | number)[] = [];
  
  if (emotionFilter) {
    whereClause = 'WHERE emotion_tag = ?';
    params.push(emotionFilter);
  }
  
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM collective_dreams ${whereClause}`);
  const { count: total } = countStmt.get(...params) as { count: number };
  
  const offset = (page - 1) * limit;
  params.push(limit, offset);
  
  const stmt = db.prepare(`
    SELECT * FROM collective_dreams 
    ${whereClause}
    ORDER BY shared_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const rows = stmt.all(...params) as CollectiveDreamRow[];
  
  return {
    dreams: rows.map(mapRowToCollectiveDream),
    total
  };
}

/**
 * 增加梦境浏览次数
 */
export function incrementViewCount(id: string): void {
  const db = getDatabase();
  db.prepare(`
    UPDATE collective_dreams SET view_count = view_count + 1 WHERE id = ?
  `).run(id);
}

/**
 * 检查梦境是否已分享
 */
export function isDreamShared(originalDreamId: string): boolean {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT id FROM collective_dreams WHERE original_dream_id = ?
  `).get(originalDreamId);
  
  return !!row;
}

/**
 * 保存梦境宇宙故事
 */
export function saveDreamUniverseStory(
  title: string,
  storyContent: string,
  sourceDreamIds: string[]
): DreamUniverseStory {
  const db = getDatabase();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO dream_universe_stories (id, title, story_content, source_dream_ids)
    VALUES (?, ?, ?, ?)
  `);
  
  stmt.run(id, title, storyContent, JSON.stringify(sourceDreamIds));
  
  return getDreamUniverseStoryById(id)!;
}

/**
 * 获取单个梦境宇宙故事
 */
export function getDreamUniverseStoryById(id: string): DreamUniverseStory | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT * FROM dream_universe_stories WHERE id = ?
  `).get(id) as DreamUniverseStoryRow | undefined;
  
  if (!row) return null;
  
  return mapRowToStory(row);
}

/**
 * 获取所有梦境宇宙故事（分页）
 */
export function getDreamUniverseStories(
  page: number = 1,
  limit: number = 10
): { stories: DreamUniverseStory[]; total: number } {
  const db = getDatabase();
  
  const { count: total } = db.prepare(`SELECT COUNT(*) as count FROM dream_universe_stories`).get() as { count: number };
  
  const offset = (page - 1) * limit;
  const rows = db.prepare(`
    SELECT * FROM dream_universe_stories 
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as DreamUniverseStoryRow[];
  
  return {
    stories: rows.map(mapRowToStory),
    total
  };
}

/**
 * 根据ID列表获取多个集体梦境
 */
export function getCollectiveDreamsByIds(ids: string[]): CollectiveDream[] {
  if (ids.length === 0) return [];
  
  const db = getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT * FROM collective_dreams WHERE id IN (${placeholders})
  `).all(...ids) as CollectiveDreamRow[];
  
  return rows.map(mapRowToCollectiveDream);
}

/**
 * 根据原始梦境ID获取集体梦境
 */
export function getCollectiveDreamByOriginalId(originalDreamId: string): CollectiveDream | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT * FROM collective_dreams WHERE original_dream_id = ?
  `).get(originalDreamId) as CollectiveDreamRow | undefined;
  
  if (!row) return null;
  return mapRowToCollectiveDream(row);
}

/**
 * 删除集体梦境（取消分享）
 */
export function deleteCollectiveDream(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare(`DELETE FROM collective_dreams WHERE id = ?`).run(id);
  return result.changes > 0;
}

/**
 * 根据原始梦境ID删除集体梦境
 */
export function deleteCollectiveDreamByOriginalId(originalDreamId: string): boolean {
  const db = getDatabase();
  const result = db.prepare(`DELETE FROM collective_dreams WHERE original_dream_id = ?`).run(originalDreamId);
  return result.changes > 0;
}

function mapRowToCollectiveDream(row: CollectiveDreamRow): CollectiveDream {
  return {
    id: row.id,
    originalDreamId: row.original_dream_id,
    content: row.content,
    emotionTag: row.emotion_tag,
    clarity: row.clarity,
    sharedAt: row.shared_at,
    viewCount: row.view_count
  };
}

function mapRowToStory(row: DreamUniverseStoryRow): DreamUniverseStory {
  return {
    id: row.id,
    title: row.title,
    storyContent: row.story_content,
    sourceDreamIds: JSON.parse(row.source_dream_ids),
    createdAt: row.created_at
  };
}
