import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import type { Lead, LeadStatus } from "@/lib/types";

interface LeadRow {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  address: string | null;
  website: string | null;
  has_website: number;
  evidence: string;
  source_urls: string;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    city: row.city,
    country: row.country,
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    instagram: row.instagram ?? undefined,
    address: row.address ?? undefined,
    website: row.website,
    hasWebsite: Boolean(row.has_website),
    evidence: row.evidence,
    sourceUrls: JSON.parse(row.source_urls),
    notes: row.notes ?? undefined,
    status: row.status as LeadStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listLeads(): Lead[] {
  const rows = getDb()
    .prepare("SELECT * FROM leads ORDER BY created_at DESC")
    .all() as LeadRow[];
  return rows.map(rowToLead);
}

export function getLead(id: string): Lead | null {
  const row = getDb().prepare("SELECT * FROM leads WHERE id = ?").get(id) as
    | LeadRow
    | undefined;
  return row ? rowToLead(row) : null;
}

export interface CreateLeadInput {
  name: string;
  category: string;
  city: string;
  country?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  address?: string;
  website?: string | null;
  hasWebsite?: boolean;
  evidence?: string;
  sourceUrls?: string[];
  notes?: string;
  status?: LeadStatus;
}

export function createLead(input: CreateLeadInput): Lead {
  const now = new Date().toISOString();
  const lead: Lead = {
    id: nanoid(12),
    name: input.name,
    category: input.category,
    city: input.city,
    country: input.country ?? "Saudi Arabia",
    phone: input.phone,
    whatsapp: input.whatsapp,
    instagram: input.instagram,
    address: input.address,
    website: input.website ?? null,
    hasWebsite: input.hasWebsite ?? false,
    evidence: input.evidence ?? "",
    sourceUrls: input.sourceUrls ?? [],
    notes: input.notes,
    status: input.status ?? "new",
    createdAt: now,
    updatedAt: now,
  };
  getDb()
    .prepare(
      `INSERT INTO leads (id, name, category, city, country, phone, whatsapp, instagram, address, website, has_website, evidence, source_urls, notes, status, created_at, updated_at)
       VALUES (@id, @name, @category, @city, @country, @phone, @whatsapp, @instagram, @address, @website, @hasWebsite, @evidence, @sourceUrls, @notes, @status, @createdAt, @updatedAt)`
    )
    .run({
      id: lead.id,
      name: lead.name,
      category: lead.category,
      city: lead.city,
      country: lead.country,
      phone: lead.phone ?? null,
      whatsapp: lead.whatsapp ?? null,
      instagram: lead.instagram ?? null,
      address: lead.address ?? null,
      website: lead.website,
      hasWebsite: lead.hasWebsite ? 1 : 0,
      evidence: lead.evidence,
      sourceUrls: JSON.stringify(lead.sourceUrls),
      notes: lead.notes ?? null,
      status: lead.status,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    });
  return lead;
}

export function updateLead(id: string, patch: Partial<CreateLeadInput>): Lead | null {
  const existing = getLead(id);
  if (!existing) return null;
  const merged: Lead = {
    ...existing,
    ...patch,
    sourceUrls: patch.sourceUrls ?? existing.sourceUrls,
    updatedAt: new Date().toISOString(),
  } as Lead;
  getDb()
    .prepare(
      `UPDATE leads SET name=@name, category=@category, city=@city, country=@country, phone=@phone,
       whatsapp=@whatsapp, instagram=@instagram, address=@address, website=@website, has_website=@hasWebsite,
       evidence=@evidence, source_urls=@sourceUrls, notes=@notes, status=@status, updated_at=@updatedAt
       WHERE id=@id`
    )
    .run({
      id,
      name: merged.name,
      category: merged.category,
      city: merged.city,
      country: merged.country,
      phone: merged.phone ?? null,
      whatsapp: merged.whatsapp ?? null,
      instagram: merged.instagram ?? null,
      address: merged.address ?? null,
      website: merged.website ?? null,
      hasWebsite: merged.hasWebsite ? 1 : 0,
      evidence: merged.evidence,
      sourceUrls: JSON.stringify(merged.sourceUrls),
      notes: merged.notes ?? null,
      status: merged.status,
      updatedAt: merged.updatedAt,
    });
  return merged;
}

export function deleteLead(id: string): void {
  getDb().prepare("DELETE FROM leads WHERE id = ?").run(id);
}
