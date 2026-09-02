import { Command } from "commander";
import { getActivities, listLeads } from "../../agent/crm.js";
import type { LeadStatus } from "../../types.js";

export function registerListCommand(program: Command): void {
  program
    .command("leads")
    .description("List leads in the CRM")
    .option("--status <status>", "Filter by status (new, qualifying, qualified, disqualified, contacted, replied, won, lost)")
    .action((opts: { status?: LeadStatus }) => {
      const leads = listLeads(opts.status ? { status: opts.status } : undefined);
      if (leads.length === 0) {
        console.log("No leads found.");
        return;
      }
      for (const lead of leads) {
        const score = lead.qualificationScore !== null ? `score=${lead.qualificationScore}` : "score=-";
        console.log(
          `#${lead.id}\t${lead.status.padEnd(12)}\t${score}\t${lead.companyName}${lead.contactName ? ` (${lead.contactName})` : ""}${lead.email ? ` <${lead.email}>` : ""}`,
        );
      }
    });

  program
    .command("lead <id>")
    .description("Show full detail and activity history for a single lead")
    .action((id: string) => {
      const lead = listLeads().find((l) => l.id === Number(id));
      if (!lead) {
        console.log(`Lead ${id} not found.`);
        return;
      }
      console.log(JSON.stringify(lead, null, 2));
      console.log("\nActivity history:");
      for (const activity of getActivities(lead.id)) {
        console.log(`  [${activity.createdAt}] ${activity.type}: ${activity.detail}`);
      }
    });
}
