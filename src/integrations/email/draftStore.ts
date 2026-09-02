import fs from "node:fs";
import path from "node:path";
import { config } from "../../config.js";
import type { EmailDraft, Lead } from "../../types.js";

/** Writes an email draft to disk instead of sending it — the safe default so the agent
 * never sends real email until SMTP is explicitly configured and OUTREACH_MODE=send. */
export function saveDraftToOutbox(lead: Lead, draft: EmailDraft): string {
  fs.mkdirSync(config.outreach.outboxDir, { recursive: true });

  const safeName = lead.companyName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const filename = `${Date.now()}-lead-${lead.id}-${safeName}.json`;
  const filePath = path.join(config.outreach.outboxDir, filename);

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        leadId: lead.id,
        company: lead.companyName,
        to: lead.email ?? null,
        subject: draft.subject,
        body: draft.body,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  return filePath;
}
