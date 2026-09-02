export type LeadStatus =
  | "new"
  | "qualifying"
  | "qualified"
  | "disqualified"
  | "contacted"
  | "replied"
  | "won"
  | "lost";

export interface LeadInput {
  companyName: string;
  contactName?: string;
  contactTitle?: string;
  email?: string;
  industry?: string;
  employeeCount?: number;
  website?: string;
  location?: string;
  notes?: string;
  source: string;
}

export interface Lead extends LeadInput {
  id: number;
  status: LeadStatus;
  qualificationScore: number | null;
  qualificationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: number;
  leadId: number;
  type: "sourced" | "qualified" | "disqualified" | "email_drafted" | "email_sent" | "status_change" | "note";
  detail: string;
  createdAt: string;
}

export interface QualificationResult {
  score: number;
  qualified: boolean;
  reason: string;
}

export interface EmailDraft {
  subject: string;
  body: string;
}

export interface AgentRunSummary {
  imported: number;
  qualified: number;
  disqualified: number;
  emailsDrafted: number;
  emailsSent: number;
  errors: string[];
}
