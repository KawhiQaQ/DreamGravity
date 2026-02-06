/**
 * SQLite Database Schema
 * Defines the table structure for dreams and dream_analyses
 */

export const CREATE_DREAMS_TABLE = `
CREATE TABLE IF NOT EXISTS dreams (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  dream_date DATE NOT NULL,
  sleep_start_time TEXT,
  sleep_end_time TEXT,
  emotion_tag TEXT NOT NULL,
  clarity INTEGER NOT NULL CHECK (clarity >= 1 AND clarity <= 5),
  is_recurring BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

export const CREATE_DREAM_ANALYSES_TABLE = `
CREATE TABLE IF NOT EXISTS dream_analyses (
  id TEXT PRIMARY KEY,
  dream_id TEXT NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
  symbol_analysis TEXT NOT NULL,
  emotion_analysis TEXT NOT NULL,
  generated_story TEXT,
  generated_poem TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

export const CREATE_DREAM_REPORTS_TABLE = `
CREATE TABLE IF NOT EXISTS dream_reports (
  id TEXT PRIMARY KEY,
  statistics TEXT NOT NULL,
  theme_comparison TEXT NOT NULL,
  insights TEXT NOT NULL,
  recommendations TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

export const CREATE_CONSTELLATION_CARDS_TABLE = `
CREATE TABLE IF NOT EXISTS constellation_cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  prophecy TEXT,
  nodes TEXT NOT NULL,
  links TEXT NOT NULL,
  total_dreams INTEGER NOT NULL,
  total_elements INTEGER NOT NULL,
  top_elements TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

export const CREATE_DREAM_FOLLOWUPS_TABLE = `
CREATE TABLE IF NOT EXISTS dream_followups (
  id TEXT PRIMARY KEY,
  dream_id TEXT NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  came_true BOOLEAN DEFAULT FALSE,
  followup_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

export const CREATE_DREAM_PATTERNS_TABLE = `
CREATE TABLE IF NOT EXISTS dream_patterns (
  id TEXT PRIMARY KEY,
  dream_id TEXT NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  stress_source TEXT,
  pattern_description TEXT NOT NULL,
  confidence REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

// 集体潜意识池表 - 存储匿名分享的梦境
export const CREATE_COLLECTIVE_DREAMS_TABLE = `
CREATE TABLE IF NOT EXISTS collective_dreams (
  id TEXT PRIMARY KEY,
  original_dream_id TEXT REFERENCES dreams(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  emotion_tag TEXT NOT NULL,
  clarity INTEGER NOT NULL,
  shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  view_count INTEGER DEFAULT 0
)`;

// 梦境宇宙故事表 - 存储串联生成的故事
export const CREATE_DREAM_UNIVERSE_STORIES_TABLE = `
CREATE TABLE IF NOT EXISTS dream_universe_stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  story_content TEXT NOT NULL,
  source_dream_ids TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

// 梦境周报表 - 存储每周的梦境总结和3D模型
export const CREATE_WEEKLY_REPORTS_TABLE = `
CREATE TABLE IF NOT EXISTS weekly_reports (
  id TEXT PRIMARY KEY,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  dream_count INTEGER NOT NULL,
  summary TEXT NOT NULL,
  totem_name TEXT NOT NULL,
  totem_description TEXT NOT NULL,
  model_prompt TEXT,
  model_url TEXT,
  model_status TEXT DEFAULT 'pending',
  tripo_task_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(week_start, week_end)
)`;

// 梦境IP角色表 - 存储用户的梦境宇宙IP角色
export const CREATE_DREAM_IP_TABLE = `
CREATE TABLE IF NOT EXISTS dream_ip_characters (
  id TEXT PRIMARY KEY,
  weekly_report_id TEXT NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  personality TEXT,
  backstory TEXT,
  abilities TEXT,
  appearance TEXT,
  catchphrase TEXT,
  model_url TEXT,
  thumbnail_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

// Indexes for optimized queries
export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_dreams_date ON dreams(dream_date)',
  'CREATE INDEX IF NOT EXISTS idx_dreams_emotion ON dreams(emotion_tag)',
  'CREATE INDEX IF NOT EXISTS idx_dreams_clarity ON dreams(clarity)',
  'CREATE INDEX IF NOT EXISTS idx_dream_analyses_dream_id ON dream_analyses(dream_id)',
  'CREATE INDEX IF NOT EXISTS idx_dream_reports_created_at ON dream_reports(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_constellation_cards_created_at ON constellation_cards(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_dream_followups_dream_id ON dream_followups(dream_id)',
  'CREATE INDEX IF NOT EXISTS idx_dream_patterns_dream_id ON dream_patterns(dream_id)',
  'CREATE INDEX IF NOT EXISTS idx_collective_dreams_shared_at ON collective_dreams(shared_at)',
  'CREATE INDEX IF NOT EXISTS idx_collective_dreams_emotion ON collective_dreams(emotion_tag)',
  'CREATE INDEX IF NOT EXISTS idx_dream_universe_stories_created_at ON dream_universe_stories(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON weekly_reports(week_start, week_end)',
  'CREATE INDEX IF NOT EXISTS idx_dream_ip_characters_report ON dream_ip_characters(weekly_report_id)',
];
