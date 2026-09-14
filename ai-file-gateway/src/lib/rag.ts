import type { Env, SearchHit } from "../types";
import { semanticSearch } from "./vectorstore";
import { chat } from "./embeddings";

function citation(hit: SearchHit): string {
  const loc = hit.chunk.sheet_name
    ? `sheet "${hit.chunk.sheet_name}"`
    : hit.chunk.page_number
    ? `p.${hit.chunk.page_number}`
    : `chunk ${hit.chunk.chunk_index}`;
  return `[${hit.file.filename} — ${loc}]`;
}

function buildContext(hits: SearchHit[]): string {
  return hits.map((h) => `${citation(h)}\n${h.chunk.text}`).join("\n\n---\n\n");
}

export interface AskResult {
  answer: string;
  sources: { file: string; fileId: string; location: string; score: number }[];
}

export async function askFiles(env: Env, question: string, fileId?: string): Promise<AskResult> {
  const hits = await semanticSearch(env, question, { fileId });

  if (hits.length === 0) {
    return { answer: "No relevant content was found in your files for this question.", sources: [] };
  }

  const context = buildContext(hits);
  const answer = await chat(env, [
    {
      role: "system",
      content:
        "You answer questions using ONLY the provided document excerpts. Cite sources inline using the bracketed " +
        "labels exactly as given, e.g. [file.pdf — p.3]. If the excerpts don't contain the answer, say so plainly.",
    },
    { role: "user", content: `Excerpts:\n\n${context}\n\nQuestion: ${question}` },
  ]);

  return {
    answer,
    sources: hits.map((h) => ({
      file: h.file.filename,
      fileId: h.file.id,
      location: citation(h).replace(/^\[|\]$/g, "").split(" — ")[1],
      score: h.score,
    })),
  };
}

export async function searchFiles(env: Env, query: string, fileId?: string, topK?: number): Promise<SearchHit[]> {
  return semanticSearch(env, query, { fileId, topK });
}
