import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATABASE_PATH = process.env.DATABASE_PATH || "./data/app.db";

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function createConnection() {
  ensureDir(DATABASE_PATH);
  const db = new Database(DATABASE_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      phone TEXT,
      whatsapp TEXT,
      instagram TEXT,
      address TEXT,
      website TEXT,
      has_website INTEGER NOT NULL DEFAULT 0,
      evidence TEXT NOT NULL DEFAULT '',
      source_urls TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
      spec TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      spec TEXT NOT NULL,
      label TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      filename TEXT NOT NULL,
      alt TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_versions_project ON versions(project_id);
    CREATE INDEX IF NOT EXISTS idx_chat_project ON chat_messages(project_id);
    CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project_id);
    CREATE INDEX IF NOT EXISTS idx_projects_lead ON projects(lead_id);
  `);

  // Additive migration for databases created before the `address` column existed.
  const leadColumns = db.prepare("PRAGMA table_info(leads)").all() as { name: string }[];
  if (!leadColumns.some((c) => c.name === "address")) {
    db.exec("ALTER TABLE leads ADD COLUMN address TEXT");
  }
}

export function getDb(): Database.Database {
  if (!global.__db) {
    global.__db = createConnection();
  }
  return global.__db;
}
