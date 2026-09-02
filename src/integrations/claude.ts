import Anthropic from "@anthropic-ai/sdk";
import { assertAnthropicConfigured, config } from "../config.js";

let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  assertAnthropicConfigured();
  if (!client) {
    client = new Anthropic({ apiKey: config.anthropic.apiKey });
  }
  return client;
}

export const CLAUDE_MODEL = config.anthropic.model;
