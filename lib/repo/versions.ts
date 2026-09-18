import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import type { Version, WebsiteSpec } from "@/lib/types";

interface VersionRow {
  id: string;
  project_id: string;
  spec: string;
  label: string;
  created_at: string;
}

function rowToVersion(row: VersionRow): Version {
  return {
    id: row.id,
    projectId: row.project_id,
    spec: JSON.parse(row.spec),
    label: row.label,
    createdAt: row.created_at,
  };
}

export function createVersion(projectId: string, spec: WebsiteSpec, label: string): Version {
  const version: Version = {
    id: nanoid(12),
    projectId,
    spec,
    label,
    createdAt: new Date().toISOString(),
  };
  getDb()
    .prepare(
      `INSERT INTO versions (id, project_id, spec, label, created_at)
       VALUES (@id, @projectId, @spec, @label, @createdAt)`
    )
    .run({
      id: version.id,
      projectId: version.projectId,
      spec: JSON.stringify(version.spec),
      label: version.label,
      createdAt: version.createdAt,
    });
  return version;
}

export function listVersions(projectId: string): Version[] {
  const rows = getDb()
    .prepare("SELECT * FROM versions WHERE project_id = ? ORDER BY created_at DESC")
    .all(projectId) as VersionRow[];
  return rows.map(rowToVersion);
}

export function getVersion(id: string): Version | null {
  const row = getDb().prepare("SELECT * FROM versions WHERE id = ?").get(id) as
    | VersionRow
    | undefined;
  return row ? rowToVersion(row) : null;
}
