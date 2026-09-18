import type { AIProvider } from "@/lib/ai/provider";
import { MockProvider } from "@/lib/ai/mock-provider";
import { AnthropicProvider } from "@/lib/ai/anthropic-provider";

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  cached = process.env.ANTHROPIC_API_KEY ? new AnthropicProvider() : new MockProvider();
  return cached;
}

export type { AIProvider, WebsiteBrief, ModifyResult, LeadContext } from "@/lib/ai/provider";
