/**
 * Dream Followup Data Access Object (DAO)
 * Handles database operations for dream followups
 */
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import type { DreamFollowup } from '../../../shared/types/dream';
import type { CreateFollowupDTO } from '../../../shared/types/api';

/**
 * Database row type for dream_followups table
 */
interface FollowupRow {
  id: string;
  dream_id: string;
  content: string;
  came_true: number;
  followup_date: string;
  created_at: string;
}

/**
 * Convert database row to DreamFollowup
 */
function rowToFollowup(row: FollowupRow): DreamFollowup {
  return {
    id: row.id,
    dreamId: row.dream_id,
    content: row.content,
    cameTrue: Boolean(row.came_true),
    followupDate: new Date(row.followup_date),
    createdAt: new Date(row.created_at),
  };
}

/**
 * Create a new followup for a dream
 */
export function createFollowup(dreamId: string, dto: CreateFollowupDTO): DreamFollowup {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO dream_followups (id, dream_id, content, came_true, followup_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, dreamId, dto.content, dto.cameTrue ? 1 : 0, dto.followupDate, now);

  return getFollowupById(id)!;
}

/**
 * Get a followup by ID
 */
export function getFollowupById(id: string): DreamFollowup | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM dream_followups WHERE id = ?');
  const row = stmt.get(id) as FollowupRow | undefined;
  return row ? rowToFollowup(row) : null;
}

/**
 * Get all followups for a dream
 */
export function getFollowupsByDreamId(dreamId: string): DreamFollowup[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM dream_followups WHERE dream_id = ? ORDER BY followup_date DESC');
  const rows = stmt.all(dreamId) as FollowupRow[];
  return rows.map(rowToFollowup);
}

/**
 * Update a followup
 */
export function updateFollowup(id: string, dto: Partial<CreateFollowupDTO>): DreamFollowup | null {
  const db = getDatabase();
  const existing = getFollowupById(id);
  if (!existing) return null;

  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (dto.content !== undefined) {
    updates.push('content = ?');
    params.push(dto.content);
  }
  if (dto.cameTrue !== undefined) {
    updates.push('came_true = ?');
    params.push(dto.cameTrue ? 1 : 0);
  }
  if (dto.followupDate !== undefined) {
    updates.push('followup_date = ?');
    params.push(dto.followupDate);
  }

  if (updates.length === 0) return existing;

  const stmt = db.prepare(`UPDATE dream_followups SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...params, id);

  return getFollowupById(id);
}

/**
 * Delete a followup
 */
export function deleteFollowup(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM dream_followups WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Get dreams with followups that came true
 */
export function getDreamsWithTrueFollowups(): { dreamId: string; followupCount: number }[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT dream_id, COUNT(*) as followup_count 
    FROM dream_followups 
    WHERE came_true = 1 
    GROUP BY dream_id
  `);
  const rows = stmt.all() as { dream_id: string; followup_count: number }[];
  return rows.map(row => ({
    dreamId: row.dream_id,
    followupCount: row.followup_count,
  }));
}
