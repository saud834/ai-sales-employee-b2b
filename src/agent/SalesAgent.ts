import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { getActivities, listLeads, logActivity, pipelineStats, setQualification, setStatus, upsertLead } from "./crm.js";
import type { LeadSource } from "./leadSourcing.js";
import { qualifyLead } from "./qualification.js";
import { draftOutreachEmail } from "./outreach.js";
import { saveDraftToOutbox } from "../integrations/email/draftStore.js";
import { sendEmail } from "../integrations/email/smtpSender.js";
import type { AgentRunSummary, Lead } from "../types.js";

export interface RunOptions {
  /** Cap on how many newly-qualified leads receive outreach in this run. */
  maxOutreach?: number;
}

/**
 * SalesAgent orchestrates the full B2B sales motion:
 *   1. Source leads (from any LeadSource, e.g. CSV import)
 *   2. Qualify each new lead against the ICP via Claude
 *   3. Draft (and optionally send) personalized outreach for qualified leads
 *   4. Keep the CRM (SQLite) up to date with status + activity history
 */
export class SalesAgent {
  async importFrom(source: LeadSource): Promise<number> {
    logger.info(`Sourcing leads from "${source.name}"...`);
    const candidates = await source.fetchLeads();
    let created = 0;

    for (const candidate of candidates) {
      const { created: wasCreated } = upsertLead(candidate);
      if (wasCreated) created++;
    }

    logger.info(`Imported ${created} new lead(s) out of ${candidates.length} candidate(s) from "${source.name}".`);
    return created;
  }

  async qualifyPendingLeads(): Promise<{ qualified: Lead[]; disqualified: Lead[]; errors: string[] }> {
    const pending = listLeads({ status: "new" });
    const qualified: Lead[] = [];
    const disqualified: Lead[] = [];
    const errors: string[] = [];

    for (const lead of pending) {
      try {
        setStatus(lead.id, "qualifying", "Qualification in progress");
        const result = await qualifyLead(lead);
        setQualification(lead.id, result.score, result.qualified, result.reason);

        const updated = { ...lead, qualificationScore: result.score, qualificationReason: result.reason };
        if (result.qualified) {
          qualified.push(updated);
        } else {
          disqualified.push(updated);
        }
      } catch (err) {
        const msg = `Failed to qualify lead ${lead.id} (${lead.companyName}): ${(err as Error).message}`;
        logger.error(msg);
        errors.push(msg);
      }
    }

    return { qualified, disqualified, errors };
  }

  async runOutreachFor(leads: Lead[]): Promise<{ drafted: number; sent: number; errors: string[] }> {
    let drafted = 0;
    let sent = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      try {
        const draft = await draftOutreachEmail(lead);
        drafted++;

        if (config.outreach.mode === "send" && lead.email) {
          await sendEmail(lead, draft);
          setStatus(lead.id, "contacted", `Outreach email sent to ${lead.email}: "${draft.subject}"`);
          logActivity(lead.id, "email_sent", `Subject: ${draft.subject}`);
          sent++;
        } else {
          const filePath = saveDraftToOutbox(lead, draft);
          setStatus(lead.id, "contacted", `Outreach email drafted (not sent — draft mode): ${filePath}`);
          logActivity(lead.id, "email_drafted", `Subject: ${draft.subject} | Saved to ${filePath}`);
        }
      } catch (err) {
        const msg = `Failed to draft/send outreach for lead ${lead.id} (${lead.companyName}): ${(err as Error).message}`;
        logger.error(msg);
        errors.push(msg);
      }
    }

    return { drafted, sent, errors };
  }

  /** Runs one full cycle: import (optional) -> qualify -> outreach. */
  async run(source: LeadSource | null, options: RunOptions = {}): Promise<AgentRunSummary> {
    const summary: AgentRunSummary = { imported: 0, qualified: 0, disqualified: 0, emailsDrafted: 0, emailsSent: 0, errors: [] };

    if (source) {
      summary.imported = await this.importFrom(source);
    }

    const { qualified, disqualified, errors: qualifyErrors } = await this.qualifyPendingLeads();
    summary.qualified = qualified.length;
    summary.disqualified = disqualified.length;
    summary.errors.push(...qualifyErrors);

    const outreachTargets = options.maxOutreach ? qualified.slice(0, options.maxOutreach) : qualified;
    const { drafted, sent, errors: outreachErrors } = await this.runOutreachFor(outreachTargets);
    summary.emailsDrafted = drafted;
    summary.emailsSent = sent;
    summary.errors.push(...outreachErrors);

    return summary;
  }

  stats() {
    return pipelineStats();
  }

  history(leadId: number) {
    return getActivities(leadId);
  }
}
