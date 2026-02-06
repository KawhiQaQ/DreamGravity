/**
 * Dream Pattern Data Access Object (DAO)
 * Handles database operations for dream patterns
 */
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import type { DreamPattern, PatternType } from '../../../shared/types/dream';

/**
 * Database row type for dream_patterns table
 */
interface PatternRow {
  id: string;
  dream_id: string;
  pattern_type: string;
  stress_source: string | null;
  pattern_description: string;
  confidence: number;
  created_at: string;
}

/**
 * Convert database row to DreamPattern
 */
function rowToPattern(row: PatternRow): DreamPattern {
  return {
    id: row.id,
    dreamId: row.dream_id,
    patternType: row.pattern_type as PatternType,
    stressSource: row.stress_source || undefined,
    patternDescription: row.pattern_description,
    confidence: row.confidence,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Save a pattern for a dream
 */
export function savePattern(
  dreamId: string,
  patternType: PatternType,
  patternDescription: string,
  confidence: number,
  stressSource?: string
): DreamPattern {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO dream_patterns (id, dream_id, pattern_type, stress_source, pattern_description, confidence, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, dreamId, patternType, stressSource || null, patternDescription, confidence, now);

  return getPatternById(id)!;
}

/**
 * Get a pattern by ID
 */
export function getPatternById(id: string): DreamPattern | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM dream_patterns WHERE id = ?');
  const row = stmt.get(id) as PatternRow | undefined;
  return row ? rowToPattern(row) : null;
}

/**
 * Get all patterns for a dream
 */
export function getPatternsByDreamId(dreamId: string): DreamPattern[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM dream_patterns WHERE dream_id = ? ORDER BY created_at DESC');
  const rows = stmt.all(dreamId) as PatternRow[];
  return rows.map(rowToPattern);
}

/**
 * Get patterns by type
 */
export function getPatternsByType(patternType: PatternType): DreamPattern[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM dream_patterns WHERE pattern_type = ? ORDER BY created_at DESC');
  const rows = stmt.all(patternType) as PatternRow[];
  return rows.map(rowToPattern);
}

/**
 * Delete patterns for a dream
 */
export function deletePatternsByDreamId(dreamId: string): number {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM dream_patterns WHERE dream_id = ?');
  const result = stmt.run(dreamId);
  return result.changes;
}

/**
 * Get stress source statistics
 */
export function getStressSourceStats(): { stressSource: string; count: number }[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT stress_source, COUNT(*) as count 
    FROM dream_patterns 
    WHERE stress_source IS NOT NULL 
    GROUP BY stress_source 
    ORDER BY count DESC
  `);
  const rows = stmt.all() as { stress_source: string; count: number }[];
  return rows.map(row => ({
    stressSource: row.stress_source,
    count: row.count,
  }));
}

/**
 * Get pattern type distribution
 */
export function getPatternTypeDistribution(): { patternType: PatternType; count: number }[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT pattern_type, COUNT(*) as count 
    FROM dream_patterns 
    GROUP BY pattern_type 
    ORDER BY count DESC
  `);
  const rows = stmt.all() as { pattern_type: string; count: number }[];
  return rows.map(row => ({
    patternType: row.pattern_type as PatternType,
    count: row.count,
  }));
}
