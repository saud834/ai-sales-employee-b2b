import { describe, expect, it, vi } from "vitest";
import type { Lead } from "../src/types.js";

vi.mock("../src/integrations/claude.js", () => ({
  getClaudeClient: () => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "tool_use",
            name: "submit_email_draft",
            input: { subject: "Quick question about Acme's shipping ops", body: "Hi Dana, ..." },
          },
        ],
      }),
    },
  }),
  CLAUDE_MODEL: "claude-test",
}));

const { draftOutreachEmail } = await import("../src/agent/outreach.js");

const baseLead: Lead = {
  id: 1,
  companyName: "Acme",
  contactName: "Dana Whitfield",
  source: "test",
  status: "qualified",
  qualificationScore: 85,
  qualificationReason: "Strong fit",
  createdAt: "",
  updatedAt: "",
};

describe("draftOutreachEmail", () => {
  it("parses Claude's structured tool_use response into an EmailDraft", async () => {
    const draft = await draftOutreachEmail(baseLead);
    expect(draft.subject).toBe("Quick question about Acme's shipping ops");
    expect(draft.body).toContain("Dana");
  });
});
