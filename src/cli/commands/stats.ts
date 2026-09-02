import { Command } from "commander";
import { pipelineStats } from "../../agent/crm.js";

export function registerStatsCommand(program: Command): void {
  program
    .command("stats")
    .description("Show pipeline stats (lead count by status)")
    .action(() => {
      const stats = pipelineStats();
      console.log("Pipeline:");
      for (const [status, count] of Object.entries(stats)) {
        console.log(`  ${status.padEnd(12)} ${count}`);
      }
    });
}
