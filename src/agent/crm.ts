import { getDb } from "../db/database.js";
import type { Activity, Lead, LeadInput, LeadStatus } from "../types.js";

interface LeadRow {
  id: number;
  company_name: string;
  contact_name: string | null;
  contact_title: string | null;
  email: string | null;
  industry: string | null;
  employee_count: number | null;
  website: string | null;
  location: string | null;
  notes: string | null;
  source: string;
  status: LeadStatus;
  qualification_score: number | null;
  qualification_reason: string | null;
  created_at: string;
  updated_at: string;
}

function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name ?? undefined,
    contactTitle: row.contact_title ?? undefined,
    email: row.email ?? undefined,
    industry: row.industry ?? undefined,
    employeeCount: row.employee_count ?? undefined,
    website: row.website ?? undefined,
    location: row.location ?? undefined,
    notes: row.notes ?? undefined,
    source: row.source,
    status: row.status,
    qualificationScore: row.qualification_score,
    qualificationReason: row.qualification_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Inserts a lead, or returns the existing lead if the email already exists (dedupe by email). */
export function upsertLead(input: LeadInput): { lead: Lead; created: boolean } {
  const db = getDb();

  if (input.email) {
    const existing = db.prepare<[string], LeadRow>("SELECT * FROM leads WHERE email = ?").get(input.email);
    if (existing) {
      return { lead: rowToLead(existing), created: false };
    }
  }

  const stmt = db.prepare(`
    INSERT INTO leads (company_name, contact_name, contact_title, email, industry, employee_count, website, location, notes, source)
    VALUES (@companyName, @contactName, @contactTitle, @email, @industry, @employeeCount, @website, @location, @notes, @source)
  `);

  const result = stmt.run({
    companyName: input.companyName,
    contactName: input.contactName ?? null,
    contactTitle: input.contactTitle ?? null,
    email: input.email ?? null,
    industry: input.industry ?? null,
    employeeCount: input.employeeCount ?? null,
    website: input.website ?? null,
    location: input.location ?? null,
    notes: input.notes ?? null,
    source: input.source,
  });

  const lead = getLeadById(Number(result.lastInsertRowid));
  logActivity(lead.id, "sourced", `Lead sourced from ${input.source}`);
  return { lead, created: true };
}

export function getLeadById(id: number): Lead {
  const db = getDb();
  const row = db.prepare<[number], LeadRow>("SELECT * FROM leads WHERE id = ?").get(id);
  if (!row) throw new Error(`Lead ${id} not found`);
  return rowToLead(row);
}

export function listLeads(filter?: { status?: LeadStatus }): Lead[] {
  const db = getDb();
  const rows = filter?.status
    ? db.prepare<[LeadStatus], LeadRow>("SELECT * FROM leads WHERE status = ? ORDER BY id DESC").all(filter.status)
    : db.prepare<[], LeadRow>("SELECT * FROM leads ORDER BY id DESC").all();
  return rows.map(rowToLead);
}

export function setQualification(leadId: number, score: number, qualified: boolean, reason: string): void {
  const db = getDb();
  const status: LeadStatus = qualified ? "qualified" : "disqualified";
  db.prepare(
    `UPDATE leads SET qualification_score = ?, qualification_reason = ?, status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
  ).run(score, reason, status, leadId);
  logActivity(leadId, qualified ? "qualified" : "disqualified", `Score ${score}: ${reason}`);
}

export function setStatus(leadId: number, status: LeadStatus, detail?: string): void {
  const db = getDb();
  db.prepare(
    `UPDATE leads SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
  ).run(status, leadId);
  logActivity(leadId, "status_change", detail ?? `Status changed to ${status}`);
}

export function logActivity(leadId: number, type: Activity["type"], detail: string): void {
  const db = getDb();
  db.prepare("INSERT INTO activities (lead_id, type, detail) VALUES (?, ?, ?)").run(leadId, type, detail);
}

export function getActivities(leadId: number): Activity[] {
  const db = getDb();
  const rows = db
    .prepare<[number], { id: number; lead_id: number; type: Activity["type"]; detail: string; created_at: string }>(
      "SELECT * FROM activities WHERE lead_id = ? ORDER BY id ASC",
    )
    .all(leadId);
  return rows.map((r) => ({ id: r.id, leadId: r.lead_id, type: r.type, detail: r.detail, createdAt: r.created_at }));
}

export function pipelineStats(): Record<LeadStatus, number> {
  const db = getDb();
  const rows = db.prepare<[], { status: LeadStatus; count: number }>("SELECT status, COUNT(*) as count FROM leads GROUP BY status").all();
  const stats: Record<LeadStatus, number> = {
    new: 0,
    qualifying: 0,
    qualified: 0,
    disqualified: 0,
    contacted: 0,
    replied: 0,
    won: 0,
    lost: 0,
  };
  for (const row of rows) stats[row.status] = row.count;
  return stats;
}
