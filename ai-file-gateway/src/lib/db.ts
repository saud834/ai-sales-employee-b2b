import type { ChunkRecord, Env, FileRecord } from "../types";

export async function insertFile(env: Env, file: FileRecord): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO files (id, filename, mime_type, file_type, size_bytes, content_hash, storage_path,
       github_sha, status, extraction_status, indexing_status, token_count, chunk_count, error, uploaded_at, processed_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
    .bind(
      file.id,
      file.filename,
      file.mime_type,
      file.file_type,
      file.size_bytes,
      file.content_hash,
      file.storage_path,
      file.github_sha,
      file.status,
      file.extraction_status,
      file.indexing_status,
      file.token_count,
      file.chunk_count,
      file.error,
      file.uploaded_at,
      file.processed_at
    )
    .run();
}

export async function updateFile(env: Env, id: string, patch: Partial<FileRecord>): Promise<void> {
  const fields = Object.keys(patch);
  if (fields.length === 0) return;
  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((f) => (patch as Record<string, unknown>)[f]);
  await env.DB.prepare(`UPDATE files SET ${setClause} WHERE id = ?`)
    .bind(...values, id)
    .run();
}

export async function getFileById(env: Env, id: string): Promise<FileRecord | null> {
  const row = await env.DB.prepare(`SELECT * FROM files WHERE id = ?`).bind(id).first<FileRecord>();
  return row ?? null;
}

export async function getFileByHash(env: Env, contentHash: string): Promise<FileRecord | null> {
  const row = await env.DB.prepare(`SELECT * FROM files WHERE content_hash = ? AND status = 'ready' ORDER BY uploaded_at DESC LIMIT 1`)
    .bind(contentHash)
    .first<FileRecord>();
  return row ?? null;
}

export async function listFiles(env: Env, limit = 50, offset = 0): Promise<FileRecord[]> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM files ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all<FileRecord>();
  return results ?? [];
}

export async function deleteFileRow(env: Env, id: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM chunks WHERE file_id = ?`).bind(id).run();
  await env.DB.prepare(`DELETE FROM files WHERE id = ?`).bind(id).run();
}

export async function insertChunks(env: Env, chunks: ChunkRecord[]): Promise<void> {
  const stmt = env.DB.prepare(
    `INSERT INTO chunks (id, file_id, chunk_index, heading, page_number, sheet_name, token_count, text)
     VALUES (?,?,?,?,?,?,?,?)`
  );
  const batch = chunks.map((c) =>
    stmt.bind(c.id, c.file_id, c.chunk_index, c.heading, c.page_number, c.sheet_name, c.token_count, c.text)
  );
  // D1 batch caps around 100 statements per call in practice; chunk the batch defensively.
  for (let i = 0; i < batch.length; i += 90) {
    await env.DB.batch(batch.slice(i, i + 90));
  }
}

export async function getChunksByIds(env: Env, ids: string[]): Promise<ChunkRecord[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  const { results } = await env.DB.prepare(`SELECT * FROM chunks WHERE id IN (${placeholders})`)
    .bind(...ids)
    .all<ChunkRecord>();
  return results ?? [];
}

export async function getChunksByFile(env: Env, fileId: string): Promise<ChunkRecord[]> {
  const { results } = await env.DB.prepare(`SELECT * FROM chunks WHERE file_id = ? ORDER BY chunk_index ASC`)
    .bind(fileId)
    .all<ChunkRecord>();
  return results ?? [];
}
