import { afterAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const testDbPath = path.join(os.tmpdir(), `sales-agent-test-${Date.now()}-${Math.random()}.db`);
process.env.DATABASE_PATH = testDbPath;
process.env.ANTHROPIC_API_KEY = "test-key";

const { upsertLead, setQualification, listLeads, pipelineStats } = await import("../src/agent/crm.js");
const { closeDb } = await import("../src/db/database.js");

describe("crm", () => {
  afterAll(() => {
    closeDb();
    for (const suffix of ["", "-wal", "-shm"]) {
      fs.rmSync(`${testDbPath}${suffix}`, { force: true });
    }
  });

  it("creates a new lead", () => {
    const { lead, created } = upsertLead({ companyName: "Acme", email: "a@acme.com", source: "test" });
    expect(created).toBe(true);
    expect(lead.status).toBe("new");
    expect(lead.companyName).toBe("Acme");
  });

  it("dedupes leads by email instead of creating duplicates", () => {
    const first = upsertLead({ companyName: "Beta", email: "dupe@beta.com", source: "test" });
    const second = upsertLead({ companyName: "Beta Renamed", email: "dupe@beta.com", source: "test2" });
    expect(second.created).toBe(false);
    expect(second.lead.id).toBe(first.lead.id);
    expect(second.lead.companyName).toBe("Beta");
  });

  it("moves a lead to qualified/disqualified based on qualification result", () => {
    const { lead } = upsertLead({ companyName: "Gamma", email: "g@gamma.com", source: "test" });
    setQualification(lead.id, 82, true, "Strong ICP fit");

    const [updated] = listLeads({ status: "qualified" }).filter((l) => l.id === lead.id);
    expect(updated.qualificationScore).toBe(82);
    expect(updated.qualificationReason).toBe("Strong ICP fit");
    expect(updated.status).toBe("qualified");
  });

  it("reports pipeline stats across all statuses", () => {
    const stats = pipelineStats();
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(3);
    expect(stats.qualified).toBeGreaterThanOrEqual(1);
  });
});
