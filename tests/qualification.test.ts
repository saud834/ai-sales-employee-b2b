import { describe, expect, it, vi } from "vitest";
import type { Lead } from "../src/types.js";

vi.mock("../src/integrations/claude.js", () => ({
  getClaudeClient: () => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "tool_use", name: "submit_qualification", input: { score: 85, qualified: true, reason: "Strong ICP fit" } }],
      }),
    },
  }),
  CLAUDE_MODEL: "claude-test",
}));

const { qualifyLead } = await import("../src/agent/qualification.js");

const baseLead: Lead = {
  id: 1,
  companyName: "Acme",
  source: "test",
  status: "new",
  qualificationScore: null,
  qualificationReason: null,
  createdAt: "",
  updatedAt: "",
};

describe("qualifyLead", () => {
  it("parses Claude's structured tool_use response into a QualificationResult", async () => {
    const result = await qualifyLead(baseLead);
    expect(result).toEqual({ score: 85, qualified: true, reason: "Strong ICP fit" });
  });
});
