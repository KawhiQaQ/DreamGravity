/**
 * Database initialization and connection management
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CREATE_DREAMS_TABLE, CREATE_DREAM_ANALYSES_TABLE, CREATE_DREAM_REPORTS_TABLE, CREATE_CONSTELLATION_CARDS_TABLE, CREATE_DREAM_FOLLOWUPS_TABLE, CREATE_DREAM_PATTERNS_TABLE, CREATE_COLLECTIVE_DREAMS_TABLE, CREATE_DREAM_UNIVERSE_STORIES_TABLE, CREATE_WEEKLY_REPORTS_TABLE, CREATE_DREAM_IP_TABLE, CREATE_INDEXES } from './schema';

let db: Database.Database | null = null;

/**
 * Get the database file path
 */
function getDatabasePath(): string {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'dreams.db');
  return dbPath;
}

/**
 * Run database migrations
 */
function runMigrations(database: Database.Database): void {
  // Check if we need to migrate from dream_time to sleep_start_time/sleep_end_time
  const tableInfo = database.prepare("PRAGMA table_info(dreams)").all() as { name: string }[];
  const columnNames = tableInfo.map(col => col.name);
  
  if (columnNames.includes('dream_time') && !columnNames.includes('sleep_start_time')) {
    console.log('Running migration: dream_time -> sleep_start_time/sleep_end_time');
    
    // Add new columns
    database.exec('ALTER TABLE dreams ADD COLUMN sleep_start_time TEXT');
    database.exec('ALTER TABLE dreams ADD COLUMN sleep_end_time TEXT');
    
    // Migrate data: use dream_time as sleep_end_time (wake up time)
    database.exec('UPDATE dreams SET sleep_end_time = dream_time WHERE dream_time IS NOT NULL');
    
    console.log('Migration completed');
  }

  // Check if constellation_cards table needs prophecy column
  const cardTableInfo = database.prepare("PRAGMA table_info(constellation_cards)").all() as { name: string }[];
  const cardColumnNames = cardTableInfo.map(col => col.name);
  
  if (cardColumnNames.length > 0 && !cardColumnNames.includes('prophecy')) {
    console.log('Running migration: adding prophecy column to constellation_cards');
    database.exec('ALTER TABLE constellation_cards ADD COLUMN prophecy TEXT');
    console.log('Migration completed');
  }
}

/**
 * Initialize the database connection and create tables
 */
export function initDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = getDatabasePath();
  
  // Ensure the data directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(CREATE_DREAMS_TABLE);
  db.exec(CREATE_DREAM_ANALYSES_TABLE);
  db.exec(CREATE_DREAM_REPORTS_TABLE);
  db.exec(CREATE_CONSTELLATION_CARDS_TABLE);
  db.exec(CREATE_DREAM_FOLLOWUPS_TABLE);
  db.exec(CREATE_DREAM_PATTERNS_TABLE);
  db.exec(CREATE_COLLECTIVE_DREAMS_TABLE);
  db.exec(CREATE_DREAM_UNIVERSE_STORIES_TABLE);
  db.exec(CREATE_WEEKLY_REPORTS_TABLE);
  db.exec(CREATE_DREAM_IP_TABLE);

  // Create indexes
  for (const indexSql of CREATE_INDEXES) {
    db.exec(indexSql);
  }

  // Run migrations
  runMigrations(db);

  console.log(`Database initialized at: ${dbPath}`);
  return db;
}

/**
 * Get the database instance
 * Throws if database is not initialized
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Reset database for testing purposes
 * WARNING: This will delete all data
 */
export function resetDatabase(): void {
  const database = getDatabase();
  database.exec('DELETE FROM dream_analyses');
  database.exec('DELETE FROM dreams');
}

export { db };
