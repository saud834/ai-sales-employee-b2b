import type { Env, FileRecord } from "../types";
import { chat } from "./embeddings";
import { summarizeFile } from "./summarize";
import { semanticSearch } from "./vectorstore";

/**
 * Compares two files by condensing each to a summary plus the chunks most relevant to the
 * comparison focus (if given), rather than sending either file's full text to the LLM.
 */
export async function compareFiles(env: Env, fileA: FileRecord, fileB: FileRecord, focus?: string): Promise<string> {
  const [summaryA, summaryB] = await Promise.all([summarizeFile(env, fileA), summarizeFile(env, fileB)]);

  let extraContext = "";
  if (focus) {
    const [hitsA, hitsB] = await Promise.all([
      semanticSearch(env, focus, { fileId: fileA.id, topK: 4 }),
      semanticSearch(env, focus, { fileId: fileB.id, topK: 4 }),
    ]);
    const format = (hits: typeof hitsA) => hits.map((h) => h.chunk.text).join("\n\n");
    extraContext =
      `\n\nRelevant excerpts from ${fileA.filename} regarding "${focus}":\n${format(hitsA)}` +
      `\n\nRelevant excerpts from ${fileB.filename} regarding "${focus}":\n${format(hitsB)}`;
  }

  const prompt =
    `Document A: ${fileA.filename}\nSummary: ${summaryA}\n\n` +
    `Document B: ${fileB.filename}\nSummary: ${summaryB}` +
    extraContext;

  return chat(env, [
    {
      role: "system",
      content:
        "Compare the two documents below. Highlight key similarities, differences, and any notable additions, " +
        "omissions, or contradictions." + (focus ? ` Focus specifically on: ${focus}.` : ""),
    },
    { role: "user", content: prompt },
  ], 700);
}
