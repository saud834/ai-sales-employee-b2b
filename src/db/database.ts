import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { SCHEMA_SQL } from "./schema.js";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dir = path.dirname(config.database.path);
  fs.mkdirSync(dir, { recursive: true });

  db = new Database(config.database.path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
