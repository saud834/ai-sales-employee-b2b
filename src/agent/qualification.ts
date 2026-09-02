import { z } from "zod";
import { CLAUDE_MODEL, getClaudeClient } from "../integrations/claude.js";
import { config } from "../config.js";
import type { Lead, QualificationResult } from "../types.js";

const qualificationSchema = z.object({
  score: z.number().min(0).max(100),
  qualified: z.boolean(),
  reason: z.string(),
});

const QUALIFY_TOOL = {
  name: "submit_qualification",
  description: "Submit the lead qualification score and reasoning.",
  input_schema: {
    type: "object" as const,
    properties: {
      score: { type: "number", description: "Fit score from 0 (no fit) to 100 (perfect fit) against the ICP." },
      qualified: { type: "boolean", description: "Whether this lead clears the qualification bar." },
      reason: { type: "string", description: "One or two sentence justification referencing specific lead attributes." },
    },
    required: ["score", "qualified", "reason"],
  },
};

function leadSummary(lead: Lead): string {
  return [
    `Company: ${lead.companyName}`,
    lead.industry ? `Industry: ${lead.industry}` : null,
    lead.employeeCount ? `Employee count: ${lead.employeeCount}` : null,
    lead.location ? `Location: ${lead.location}` : null,
    lead.contactName ? `Contact: ${lead.contactName}${lead.contactTitle ? ` (${lead.contactTitle})` : ""}` : null,
    lead.website ? `Website: ${lead.website}` : null,
    lead.notes ? `Notes: ${lead.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Scores a single lead against the configured ICP using Claude, returning a 0-100 fit score. */
export async function qualifyLead(lead: Lead): Promise<QualificationResult> {
  const client = getClaudeClient();

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 500,
    system:
      "You are a B2B sales operations analyst. You score inbound/outbound leads against an Ideal Customer Profile (ICP) " +
      "so a sales team only spends outreach effort on leads worth pursuing. Be strict and realistic — most leads are not a perfect fit. " +
      `Threshold for "qualified" is a score of ${config.qualificationThreshold} or above.`,
    tools: [QUALIFY_TOOL],
    tool_choice: { type: "tool", name: "submit_qualification" },
    messages: [
      {
        role: "user",
        content:
          `Our Ideal Customer Profile:\n${config.icp.description}\n\n` +
          `Lead to evaluate:\n${leadSummary(lead)}\n\n` +
          "Score this lead's fit against the ICP and submit your qualification.",
      },
    ],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(`Claude did not return a qualification for lead ${lead.id}`);
  }

  const parsed = qualificationSchema.parse(toolUse.input);
  return parsed;
}
