import type { ChunkRecord, Env, SearchHit } from "../types";
import { embedBatch, embedOne } from "./embeddings";
import { getChunksByIds } from "./db";

export async function indexChunks(env: Env, fileId: string, chunks: ChunkRecord[]): Promise<void> {
  if (chunks.length === 0) return;
  const vectors = await embedBatch(
    env,
    chunks.map((c) => c.text)
  );

  const records = chunks.map((c, i) => ({
    id: c.id,
    values: vectors[i],
    metadata: { fileId },
  }));

  for (let i = 0; i < records.length; i += 100) {
    await env.VECTORIZE.upsert(records.slice(i, i + 100));
  }
}

export async function deleteFileVectors(env: Env, chunkIds: string[]): Promise<void> {
  if (chunkIds.length === 0) return;
  for (let i = 0; i < chunkIds.length; i += 500) {
    await env.VECTORIZE.deleteByIds(chunkIds.slice(i, i + 500));
  }
}

export interface SemanticSearchOptions {
  fileId?: string;
  topK?: number;
}

export async function semanticSearch(env: Env, query: string, opts: SemanticSearchOptions = {}): Promise<SearchHit[]> {
  const topK = opts.topK ?? Number(env.SEARCH_TOP_K);
  const queryVector = await embedOne(env, query);

  const matches = await env.VECTORIZE.query(queryVector, {
    topK,
    filter: opts.fileId ? { fileId: opts.fileId } : undefined,
    returnMetadata: "none",
  });

  const ids = matches.matches.map((m) => m.id);
  const chunks = await getChunksByIds(env, ids);
  const chunkById = new Map(chunks.map((c) => [c.id, c]));

  const fileIds = [...new Set(chunks.map((c) => c.file_id))];
  const fileRows = fileIds.length
    ? (
        await env.DB.prepare(
          `SELECT id, filename, file_type FROM files WHERE id IN (${fileIds.map(() => "?").join(",")})`
        )
          .bind(...fileIds)
          .all<{ id: string; filename: string; file_type: string }>()
      ).results ?? []
    : [];
  const fileById = new Map(fileRows.map((f) => [f.id, f]));

  const hits: SearchHit[] = [];
  for (const match of matches.matches) {
    const chunk = chunkById.get(match.id);
    if (!chunk) continue;
    const file = fileById.get(chunk.file_id);
    if (!file) continue;
    hits.push({
      chunk,
      score: match.score,
      file: { id: file.id, filename: file.filename, file_type: file.file_type as never },
    });
  }
  return hits;
}
