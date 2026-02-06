/**
 * 梦境IP角色 DAO
 * 处理梦境宇宙IP角色的数据库操作
 */
import { getDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';

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

interface DreamIPRow {
  id: string;
  weekly_report_id: string;
  name: string;
  title: string | null;
  personality: string | null;
  backstory: string | null;
  abilities: string | null;
  appearance: string | null;
  catchphrase: string | null;
  model_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export interface CreateIPCharacterInput {
  weeklyReportId: string;
  name: string;
  title?: string;
  personality?: string;
  backstory?: string;
  abilities?: string;
  appearance?: string;
  catchphrase?: string;
  modelUrl?: string;
  thumbnailUrl?: string;
}

/**
 * 创建IP角色
 */
export function createIPCharacter(input: CreateIPCharacterInput): DreamIPCharacter {
  const db = getDatabase();
  const id = uuidv4();
  
  console.log('[createIPCharacter] 输入参数:', JSON.stringify(input, null, 2));
  
  // 使用命名参数避免参数数量问题
  const stmt = db.prepare(`
    INSERT INTO dream_ip_characters 
    (id, weekly_report_id, name, title, personality, backstory, abilities, appearance, catchphrase, model_url, thumbnail_url)
    VALUES (@id, @weeklyReportId, @name, @title, @personality, @backstory, @abilities, @appearance, @catchphrase, @modelUrl, @thumbnailUrl)
  `);
  
  stmt.run({
    id,
    weeklyReportId: input.weeklyReportId,
    name: input.name,
    title: input.title || null,
    personality: input.personality || null,
    backstory: input.backstory || null,
    abilities: input.abilities || null,
    appearance: input.appearance || null,
    catchphrase: input.catchphrase || null,
    modelUrl: input.modelUrl || null,
    thumbnailUrl: input.thumbnailUrl || null
  });
  
  return getIPCharacterById(id)!;
}

/**
 * 获取单个IP角色
 */
export function getIPCharacterById(id: string): DreamIPCharacter | null {
  const db = getDatabase();
  const row = db.prepare(`SELECT * FROM dream_ip_characters WHERE id = ?`).get(id) as DreamIPRow | undefined;
  
  if (!row) return null;
  return mapRowToCharacter(row);
}

/**
 * 根据周报ID获取IP角色
 */
export function getIPCharacterByReportId(weeklyReportId: string): DreamIPCharacter | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT * FROM dream_ip_characters WHERE weekly_report_id = ?
  `).get(weeklyReportId) as DreamIPRow | undefined;
  
  if (!row) return null;
  return mapRowToCharacter(row);
}

/**
 * 获取所有IP角色（分页）
 */
export function getAllIPCharacters(page: number = 1, limit: number = 20): { characters: DreamIPCharacter[]; total: number } {
  const db = getDatabase();
  
  const { count: total } = db.prepare(`SELECT COUNT(*) as count FROM dream_ip_characters`).get() as { count: number };
  
  const offset = (page - 1) * limit;
  const rows = db.prepare(`
    SELECT * FROM dream_ip_characters ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset) as DreamIPRow[];
  
  return {
    characters: rows.map(mapRowToCharacter),
    total
  };
}

/**
 * 更新IP角色
 */
export function updateIPCharacter(id: string, updates: Partial<CreateIPCharacterInput>): DreamIPCharacter | null {
  const db = getDatabase();
  
  const fields: string[] = [];
  const values: (string | null)[] = [];
  
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title || null); }
  if (updates.personality !== undefined) { fields.push('personality = ?'); values.push(updates.personality || null); }
  if (updates.backstory !== undefined) { fields.push('backstory = ?'); values.push(updates.backstory || null); }
  if (updates.abilities !== undefined) { fields.push('abilities = ?'); values.push(updates.abilities || null); }
  if (updates.appearance !== undefined) { fields.push('appearance = ?'); values.push(updates.appearance || null); }
  if (updates.catchphrase !== undefined) { fields.push('catchphrase = ?'); values.push(updates.catchphrase || null); }
  if (updates.modelUrl !== undefined) { fields.push('model_url = ?'); values.push(updates.modelUrl || null); }
  if (updates.thumbnailUrl !== undefined) { fields.push('thumbnail_url = ?'); values.push(updates.thumbnailUrl || null); }
  
  if (fields.length === 0) return getIPCharacterById(id);
  
  values.push(id);
  db.prepare(`UPDATE dream_ip_characters SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  
  return getIPCharacterById(id);
}

/**
 * 删除IP角色
 */
export function deleteIPCharacter(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare(`DELETE FROM dream_ip_characters WHERE id = ?`).run(id);
  return result.changes > 0;
}

/**
 * 更新IP角色的图片URL
 */
export function updateIPCharacterModelUrl(id: string, modelUrl: string): void {
  const db = getDatabase();
  db.prepare(`UPDATE dream_ip_characters SET model_url = ? WHERE id = ?`).run(modelUrl, id);
}

function mapRowToCharacter(row: DreamIPRow): DreamIPCharacter {
  return {
    id: row.id,
    weeklyReportId: row.weekly_report_id,
    name: row.name,
    title: row.title,
    personality: row.personality,
    backstory: row.backstory,
    abilities: row.abilities,
    appearance: row.appearance,
    catchphrase: row.catchphrase,
    modelUrl: row.model_url,
    thumbnailUrl: row.thumbnail_url,
    createdAt: row.created_at
  };
}
