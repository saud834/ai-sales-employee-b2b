import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";

export interface AssetRecord {
  id: string;
  projectId: string;
  url: string;
  filename: string;
  alt: string;
  createdAt: string;
}

interface AssetRow {
  id: string;
  project_id: string;
  url: string;
  filename: string;
  alt: string;
  created_at: string;
}

function rowToAsset(row: AssetRow): AssetRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    url: row.url,
    filename: row.filename,
    alt: row.alt,
    createdAt: row.created_at,
  };
}

export function addAsset(
  projectId: string,
  url: string,
  filename: string,
  alt: string
): AssetRecord {
  const asset: AssetRecord = {
    id: nanoid(12),
    projectId,
    url,
    filename,
    alt,
    createdAt: new Date().toISOString(),
  };
  getDb()
    .prepare(
      `INSERT INTO assets (id, project_id, url, filename, alt, created_at)
       VALUES (@id, @projectId, @url, @filename, @alt, @createdAt)`
    )
    .run(asset);
  return asset;
}

export function listAssets(projectId: string): AssetRecord[] {
  const rows = getDb()
    .prepare("SELECT * FROM assets WHERE project_id = ? ORDER BY created_at DESC")
    .all(projectId) as AssetRow[];
  return rows.map(rowToAsset);
}

export function deleteAsset(id: string): void {
  getDb().prepare("DELETE FROM assets WHERE id = ?").run(id);
}
