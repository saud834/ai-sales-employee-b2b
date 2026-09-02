import "dotenv/config";
import path from "node:path";

function required(name: string, value: string | undefined, fallback?: string): string {
  if (value && value.trim().length > 0) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

export const config = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    model: process.env.CLAUDE_MODEL ?? "claude-sonnet-5",
  },
  database: {
    path: path.resolve(process.cwd(), process.env.DATABASE_PATH ?? "./data/sales-agent.db"),
  },
  outreach: {
    mode: (process.env.OUTREACH_MODE === "send" ? "send" : "draft") as "draft" | "send",
    outboxDir: path.resolve(process.cwd(), "data/outbox"),
  },
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    fromName: process.env.SMTP_FROM_NAME ?? "Sales Team",
    fromEmail: process.env.SMTP_FROM_EMAIL ?? "",
  },
  icp: {
    description: required(
      "ICP_DESCRIPTION",
      process.env.ICP_DESCRIPTION,
      "B2B companies that could benefit from our product.",
    ),
    companyName: process.env.COMPANY_NAME ?? "Our Company",
    productPitch: process.env.PRODUCT_PITCH ?? "We help B2B teams sell more efficiently.",
  },
  qualificationThreshold: Number(process.env.QUALIFICATION_THRESHOLD ?? 60),
};

export function assertAnthropicConfigured(): void {
  if (!config.anthropic.apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key before running qualification or outreach.",
    );
  }
}
