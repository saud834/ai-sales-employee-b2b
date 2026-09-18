import type { WebsiteSpec } from "@/lib/types";

export interface LeadContext {
  name: string;
  category: string;
  city: string;
  country?: string;
  whatsapp?: string;
  phone?: string;
  address?: string;
}

export interface WebsiteBrief {
  prompt: string;
  lead?: LeadContext;
}

export interface ModifyResult {
  spec: WebsiteSpec;
  summary: string;
}

/**
 * Abstraction over any AI backend that can plan and edit a WebsiteSpec.
 * Nothing outside lib/ai/* should know whether a call is served by
 * Anthropic, another provider, or the offline mock.
 */
export interface AIProvider {
  readonly name: string;
  planWebsite(brief: WebsiteBrief): Promise<WebsiteSpec>;
  modifyWebsite(spec: WebsiteSpec, instruction: string): Promise<ModifyResult>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}
