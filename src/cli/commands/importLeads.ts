import { Command } from "commander";
import { SalesAgent } from "../../agent/SalesAgent.js";
import { CsvLeadSource } from "../../agent/leadSourcing.js";
import { logger } from "../../utils/logger.js";

export function registerImportCommand(program: Command): void {
  program
    .command("import <csvFile>")
    .description("Import leads from a CSV file into the CRM (status: new)")
    .action(async (csvFile: string) => {
      const agent = new SalesAgent();
      const created = await agent.importFrom(new CsvLeadSource(csvFile));
      logger.info(`Done. ${created} new lead(s) added.`);
    });
}
