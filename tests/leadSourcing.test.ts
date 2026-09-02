import { afterAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CsvLeadSource } from "../src/agent/leadSourcing.js";

describe("CsvLeadSource", () => {
  const file = path.join(os.tmpdir(), `leads-test-${Date.now()}.csv`);
  fs.writeFileSync(
    file,
    "companyName,email,employeeCount,notes\n" + 'Acme,a@acme.com,50,"Growing fast, hiring reps"\n' + ',skip@x.com,10,should be skipped\n',
  );

  afterAll(() => fs.rmSync(file, { force: true }));

  it("parses CSV rows into LeadInput objects", async () => {
    const source = new CsvLeadSource(file);
    const leads = await source.fetchLeads();
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      companyName: "Acme",
      email: "a@acme.com",
      employeeCount: 50,
      notes: "Growing fast, hiring reps",
    });
    expect(leads[0].source).toBe(`csv:${file}`);
  });

  it("skips rows without a company name", async () => {
    const source = new CsvLeadSource(file);
    const leads = await source.fetchLeads();
    expect(leads.find((l) => l.email === "skip@x.com")).toBeUndefined();
  });

  it("throws a clear error when the file does not exist", async () => {
    const source = new CsvLeadSource("/nonexistent/path.csv");
    await expect(source.fetchLeads()).rejects.toThrow(/not found/);
  });
});
