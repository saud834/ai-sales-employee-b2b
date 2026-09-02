import { parse } from "csv-parse/sync";
import fs from "node:fs";
import type { LeadInput } from "../types.js";

/**
 * A LeadSource produces candidate leads for the agent to ingest.
 * Implement this interface to plug in a real provider (Apollo.io, Clearbit,
 * Hunter.io, LinkedIn Sales Navigator exports, a CRM export, etc.) — the
 * rest of the agent (qualification, outreach, CRM) doesn't need to change.
 */
export interface LeadSource {
  name: string;
  fetchLeads(): Promise<LeadInput[]>;
}

/** Reads leads from a CSV file. Expected columns (header row, order-independent):
 * companyName, contactName, contactTitle, email, industry, employeeCount, website, location, notes
 */
export class CsvLeadSource implements LeadSource {
  name = "csv";

  constructor(private filePath: string) {}

  async fetchLeads(): Promise<LeadInput[]> {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`CSV file not found: ${this.filePath}`);
    }
    const raw = fs.readFileSync(this.filePath, "utf-8");
    const records: Record<string, string>[] = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records
      .filter((r) => r.companyName && r.companyName.trim().length > 0)
      .map((r) => ({
        companyName: r.companyName,
        contactName: r.contactName || undefined,
        contactTitle: r.contactTitle || undefined,
        email: r.email || undefined,
        industry: r.industry || undefined,
        employeeCount: r.employeeCount ? Number(r.employeeCount) : undefined,
        website: r.website || undefined,
        location: r.location || undefined,
        notes: r.notes || undefined,
        source: `csv:${this.filePath}`,
      }));
  }
}

/** A static in-memory source, useful for tests and for feeding leads programmatically. */
export class StaticLeadSource implements LeadSource {
  name = "static";
  constructor(private leads: LeadInput[]) {}
  async fetchLeads(): Promise<LeadInput[]> {
    return this.leads;
  }
}
