/**
 * Cheap, dependency-free token estimator (~4 chars/token, English-text average).
 * This is an approximation, not a real tokenizer — good enough for chunk sizing,
 * budgeting LLM context, and the token_count metadata surfaced to callers.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const normalized = text.trim();
  if (!normalized) return 0;
  return Math.max(1, Math.ceil(normalized.length / 4));
}
