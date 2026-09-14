import type { Env } from "../types";
import type { Chunk } from "./chunk";

export interface CachedExtraction {
  fileType: string;
  chunks: Chunk[];
}

const keyFor = (hash: string) => `extracted:${hash}`;

/** Looks up a previously processed file by content hash, so re-uploading the same bytes never reprocesses. */
export async function getCachedExtraction(env: Env, contentHash: string): Promise<CachedExtraction | null> {
  const raw = await env.CACHE.get(keyFor(contentHash));
  return raw ? (JSON.parse(raw) as CachedExtraction) : null;
}

export async function setCachedExtraction(env: Env, contentHash: string, value: CachedExtraction): Promise<void> {
  await env.CACHE.put(keyFor(contentHash), JSON.stringify(value));
}

export async function deleteCachedExtraction(env: Env, contentHash: string): Promise<void> {
  await env.CACHE.delete(keyFor(contentHash));
}
