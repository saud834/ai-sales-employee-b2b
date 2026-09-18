import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import type { Project, WebsiteSpec } from "@/lib/types";
import { createVersion } from "@/lib/repo/versions";

interface ProjectRow {
  id: string;
  name: string;
  lead_id: string | null;
  spec: string;
  created_at: string;
  updated_at: string;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    leadId: row.lead_id,
    spec: JSON.parse(row.spec),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listProjects(): Project[] {
  const rows = getDb()
    .prepare("SELECT * FROM projects ORDER BY updated_at DESC")
    .all() as ProjectRow[];
  return rows.map(rowToProject);
}

export function getProject(id: string): Project | null {
  const row = getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | ProjectRow
    | undefined;
  return row ? rowToProject(row) : null;
}

export function createProject(name: string, spec: WebsiteSpec, leadId?: string | null): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: nanoid(12),
    name,
    leadId: leadId ?? null,
    spec,
    createdAt: now,
    updatedAt: now,
  };
  getDb()
    .prepare(
      `INSERT INTO projects (id, name, lead_id, spec, created_at, updated_at)
       VALUES (@id, @name, @leadId, @spec, @createdAt, @updatedAt)`
    )
    .run({
      id: project.id,
      name: project.name,
      leadId: project.leadId,
      spec: JSON.stringify(project.spec),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  createVersion(project.id, spec, "Initial generation");
  return project;
}

export function renameProject(id: string, name: string): Project | null {
  const existing = getProject(id);
  if (!existing) return null;
  const updatedAt = new Date().toISOString();
  getDb()
    .prepare("UPDATE projects SET name = ?, updated_at = ? WHERE id = ?")
    .run(name, updatedAt, id);
  return { ...existing, name, updatedAt };
}

export function updateProjectSpec(
  id: string,
  spec: WebsiteSpec,
  versionLabel?: string
): Project | null {
  const existing = getProject(id);
  if (!existing) return null;
  if (versionLabel) {
    // Snapshot the state BEFORE this change so it can be restored.
    createVersion(id, existing.spec, versionLabel);
  }
  const updatedAt = new Date().toISOString();
  getDb()
    .prepare("UPDATE projects SET spec = ?, updated_at = ? WHERE id = ?")
    .run(JSON.stringify(spec), updatedAt, id);
  return { ...existing, spec, updatedAt };
}

export function duplicateProject(id: string, newName?: string): Project | null {
  const existing = getProject(id);
  if (!existing) return null;
  return createProject(newName ?? `${existing.name} (copy)`, existing.spec, existing.leadId);
}

export function deleteProject(id: string): void {
  getDb().prepare("DELETE FROM projects WHERE id = ?").run(id);
}
