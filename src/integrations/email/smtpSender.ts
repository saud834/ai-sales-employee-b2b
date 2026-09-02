import nodemailer, { type Transporter } from "nodemailer";
import { config } from "../../config.js";
import type { EmailDraft, Lead } from "../../types.js";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass || !config.smtp.fromEmail) {
    throw new Error(
      "SMTP is not fully configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM_EMAIL in .env, or leave OUTREACH_MODE=draft.",
    );
  }

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });

  return transporter;
}

export async function sendEmail(lead: Lead, draft: EmailDraft): Promise<void> {
  if (!lead.email) {
    throw new Error(`Lead ${lead.id} (${lead.companyName}) has no email address on file`);
  }

  const mailer = getTransporter();
  await mailer.sendMail({
    from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
    to: lead.email,
    subject: draft.subject,
    text: draft.body,
  });
}
