import type { Env, FileRecord } from "../types";
import { chat } from "./embeddings";
import { getChunksByFile } from "./db";
import { estimateTokens } from "./tokens";

const SUMMARY_INPUT_TOKEN_BUDGET = 3000;

/**
 * Map-reduce summarization: batches chunks up to a token budget, summarizes each batch, then
 * (if more than one batch was needed) summarizes the summaries. Keeps LLM input bounded regardless
 * of document size instead of ever sending the whole file.
 */
export async function summarizeFile(env: Env, file: FileRecord): Promise<string> {
  const chunks = await getChunksByFile(env, file.id);
  if (chunks.length === 0) return "This file has no extracted content to summarize.";

  const batches: string[][] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const chunk of chunks) {
    if (currentTokens + chunk.token_count > SUMMARY_INPUT_TOKEN_BUDGET && current.length > 0) {
      batches.push(current);
      current = [];
      currentTokens = 0;
    }
    current.push(chunk.text);
    currentTokens += chunk.token_count;
  }
  if (current.length > 0) batches.push(current);

  const partialSummaries: string[] = [];
  for (const batch of batches) {
    const summary = await chat(env, [
      { role: "system", content: "Summarize the following document excerpt concisely, preserving key facts, figures, and names." },
      { role: "user", content: batch.join("\n\n") },
    ], 400);
    partialSummaries.push(summary);
  }

  if (partialSummaries.length === 1) return partialSummaries[0];

  const combined = partialSummaries.join("\n\n");
  if (estimateTokens(combined) <= SUMMARY_INPUT_TOKEN_BUDGET) {
    return chat(env, [
      { role: "system", content: `Combine these section summaries of "${file.filename}" into one coherent summary.` },
      { role: "user", content: combined },
    ], 500);
  }

  // Extremely large file: recurse once more over the partial summaries themselves.
  return summarizeTextBatches(env, partialSummaries, file.filename);
}

async function summarizeTextBatches(env: Env, texts: string[], filename: string): Promise<string> {
  const batches: string[][] = [];
  let current: string[] = [];
  let currentTokens = 0;
  for (const text of texts) {
    const t = estimateTokens(text);
    if (currentTokens + t > SUMMARY_INPUT_TOKEN_BUDGET && current.length > 0) {
      batches.push(current);
      current = [];
      currentTokens = 0;
    }
    current.push(text);
    currentTokens += t;
  }
  if (current.length > 0) batches.push(current);

  const summaries = await Promise.all(
    batches.map((b) =>
      chat(env, [
        { role: "system", content: `Combine these section summaries of "${filename}" into one coherent summary.` },
        { role: "user", content: b.join("\n\n") },
      ], 500)
    )
  );
  return summaries.join("\n\n");
}
