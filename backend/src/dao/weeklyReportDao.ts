/**
 * 周报 DAO
 * 处理梦境周报的数据库操作
 */
import { getDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';

export type ModelStatus = 'pending' | 'processing' | 'completed' | 'failed';

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

interface WeeklyReportRow {
  id: string;
  week_start: string;
  week_end: string;
  dream_count: number;
  summary: string;
  totem_name: string;
  totem_description: string;
  model_prompt: string | null;
  model_url: string | null;
  model_status: string;
  tripo_task_id: string | null;
  created_at: string;
}

/**
 * 创建周报
 */
export function createWeeklyReport(
  weekStart: string,
  weekEnd: string,
  dreamCount: number,
  summary: string,
  totemName: string,
  totemDescription: string,
  modelPrompt?: string
): WeeklyReport {
  const db = getDatabase();
  const id = uuidv4();
  
  const stmt = db.prepare(`
    INSERT INTO weekly_reports (id, week_start, week_end, dream_count, summary, totem_name, totem_description, model_prompt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, weekStart, weekEnd, dreamCount, summary, totemName, totemDescription, modelPrompt || null);
  
  return getWeeklyReportById(id)!;
}

/**
 * 获取单个周报
 */
export function getWeeklyReportById(id: string): WeeklyReport | null {
  const db = getDatabase();
  const row = db.prepare(`SELECT * FROM weekly_reports WHERE id = ?`).get(id) as WeeklyReportRow | undefined;
  
  if (!row) return null;
  return mapRowToReport(row);
}

/**
 * 根据周获取周报
 */
export function getWeeklyReportByWeek(weekStart: string, weekEnd: string): WeeklyReport | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT * FROM weekly_reports WHERE week_start = ? AND week_end = ?
  `).get(weekStart, weekEnd) as WeeklyReportRow | undefined;
  
  if (!row) return null;
  return mapRowToReport(row);
}

/**
 * 获取所有周报（分页）
 */
export function getWeeklyReports(page: number = 1, limit: number = 10): { reports: WeeklyReport[]; total: number } {
  const db = getDatabase();
  
  const { count: total } = db.prepare(`SELECT COUNT(*) as count FROM weekly_reports`).get() as { count: number };
  
  const offset = (page - 1) * limit;
  const rows = db.prepare(`
    SELECT * FROM weekly_reports ORDER BY week_start DESC LIMIT ? OFFSET ?
  `).all(limit, offset) as WeeklyReportRow[];
  
  return {
    reports: rows.map(mapRowToReport),
    total
  };
}

/**
 * 更新模型状态
 */
export function updateModelStatus(id: string, status: ModelStatus, tripoTaskId?: string): void {
  const db = getDatabase();
  
  if (tripoTaskId) {
    db.prepare(`
      UPDATE weekly_reports SET model_status = ?, tripo_task_id = ? WHERE id = ?
    `).run(status, tripoTaskId, id);
  } else {
    db.prepare(`
      UPDATE weekly_reports SET model_status = ? WHERE id = ?
    `).run(status, id);
  }
}

/**
 * 更新模型URL
 */
export function updateModelUrl(id: string, modelUrl: string): void {
  const db = getDatabase();
  db.prepare(`
    UPDATE weekly_reports SET model_url = ?, model_status = 'completed' WHERE id = ?
  `).run(modelUrl, id);
}

/**
 * 获取待处理的模型任务
 */
export function getPendingModelTasks(): WeeklyReport[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM weekly_reports WHERE model_status = 'processing' AND tripo_task_id IS NOT NULL
  `).all() as WeeklyReportRow[];
  
  return rows.map(mapRowToReport);
}

/**
 * 删除周报
 */
export function deleteWeeklyReport(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare(`DELETE FROM weekly_reports WHERE id = ?`).run(id);
  return result.changes > 0;
}

function mapRowToReport(row: WeeklyReportRow): WeeklyReport {
  return {
    id: row.id,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    dreamCount: row.dream_count,
    summary: row.summary,
    totemName: row.totem_name,
    totemDescription: row.totem_description,
    modelPrompt: row.model_prompt,
    modelUrl: row.model_url,
    modelStatus: row.model_status as ModelStatus,
    tripoTaskId: row.tripo_task_id,
    createdAt: row.created_at
  };
}
