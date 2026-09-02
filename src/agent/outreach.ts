import { z } from "zod";
import { CLAUDE_MODEL, getClaudeClient } from "../integrations/claude.js";
import { config } from "../config.js";
import type { EmailDraft, Lead } from "../types.js";

const draftSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

const DRAFT_TOOL = {
  name: "submit_email_draft",
  description: "Submit the drafted outreach email.",
  input_schema: {
    type: "object" as const,
    properties: {
      subject: { type: "string", description: "A short, specific, non-spammy subject line." },
      body: {
        type: "string",
        description: "The full email body, plain text, 3-6 short paragraphs, personalized to the lead, ending with a clear low-friction call to action.",
      },
    },
    required: ["subject", "body"],
  },
};

/** Generates a personalized first-touch outreach email for a qualified lead. */
export async function draftOutreachEmail(lead: Lead): Promise<EmailDraft> {
  const client = getClaudeClient();

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 700,
    system:
      `You are an SDR (sales development rep) at ${config.icp.companyName} writing first-touch cold outreach emails. ` +
      "Tone: warm, concise, human, specific to the recipient — never generic or salesy. No em dashes, no exclamation-mark stacking, " +
      "no buzzwords like 'synergy' or 'game-changer'. Reference something concrete about the company. Keep it under 150 words. " +
      "End with a single, easy next step (e.g. a short call or a reply).",
    tools: [DRAFT_TOOL],
    tool_choice: { type: "tool", name: "submit_email_draft" },
    messages: [
      {
        role: "user",
        content:
          `What we sell:\n${config.icp.productPitch}\n\n` +
          `Lead to write to:\n` +
          `Company: ${lead.companyName}\n` +
          (lead.contactName ? `Contact: ${lead.contactName}${lead.contactTitle ? ` (${lead.contactTitle})` : ""}\n` : "") +
          (lead.industry ? `Industry: ${lead.industry}\n` : "") +
          (lead.employeeCount ? `Employee count: ${lead.employeeCount}\n` : "") +
          (lead.notes ? `Notes: ${lead.notes}\n` : "") +
          (lead.qualificationReason ? `Why this lead is a fit: ${lead.qualificationReason}\n` : "") +
          "\nDraft the first-touch outreach email.",
      },
    ],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(`Claude did not return an email draft for lead ${lead.id}`);
  }

  return draftSchema.parse(toolUse.input);
}
