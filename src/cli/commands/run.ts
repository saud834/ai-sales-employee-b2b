import { Command } from "commander";
import cron from "node-cron";
import { SalesAgent } from "../../agent/SalesAgent.js";
import { CsvLeadSource } from "../../agent/leadSourcing.js";
import { logger } from "../../utils/logger.js";

export function registerRunCommand(program: Command): void {
  program
    .command("run")
    .description("Run one full agent cycle: qualify new leads, then draft/send outreach for qualified ones")
    .option("--import <csvFile>", "Also import leads from a CSV file before qualifying")
    .option("--max-outreach <n>", "Cap how many leads receive outreach this run", (v) => Number(v))
    .option("--schedule <cronExpr>", 'Run repeatedly on a cron schedule instead of once (e.g. "0 * * * *" for hourly)')
    .action(async (opts: { import?: string; maxOutreach?: number; schedule?: string }) => {
      const agent = new SalesAgent();
      const source = opts.import ? new CsvLeadSource(opts.import) : null;

      const runOnce = async () => {
        logger.info("Starting agent run...");
        const summary = await agent.run(source, { maxOutreach: opts.maxOutreach });
        logger.info(
          `Run complete. Imported=${summary.imported} Qualified=${summary.qualified} Disqualified=${summary.disqualified} ` +
            `EmailsDrafted=${summary.emailsDrafted} EmailsSent=${summary.emailsSent} Errors=${summary.errors.length}`,
        );
        if (summary.errors.length > 0) {
          summary.errors.forEach((e) => logger.warn(e));
        }
      };

      if (opts.schedule) {
        if (!cron.validate(opts.schedule)) {
          throw new Error(`Invalid cron expression: ${opts.schedule}`);
        }
        logger.info(`Scheduling agent to run on cron "${opts.schedule}". Press Ctrl+C to stop.`);
        await runOnce();
        cron.schedule(opts.schedule, () => {
          runOnce().catch((err) => logger.error("Scheduled run failed:", err));
        });
      } else {
        await runOnce();
      }
    });
}
