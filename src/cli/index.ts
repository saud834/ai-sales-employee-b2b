#!/usr/bin/env node
import { Command } from "commander";
import { registerImportCommand } from "./commands/importLeads.js";
import { registerRunCommand } from "./commands/run.js";
import { registerListCommand } from "./commands/listLeads.js";
import { registerStatsCommand } from "./commands/stats.js";

const program = new Command();

program
  .name("sales-agent")
  .description("AI Sales Employee — autonomous B2B lead generation, qualification, outreach and CRM automation")
  .version("0.1.0");

registerImportCommand(program);
registerRunCommand(program);
registerListCommand(program);
registerStatsCommand(program);

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
