import type { ChunkRecord, Env, FileRecord } from "../types";
import { sha256Hex, newId } from "./hash";
import { detectFileType, extractByType } from "./extract";
import { chunkSegments } from "./chunk";
import { estimateTokens } from "./tokens";
import { putFile, deleteFile as deleteGithubFile } from "./github";
import { insertFile, updateFile, getFileByHash, insertChunks, getChunksByFile, deleteFileRow } from "./db";
import { indexChunks, deleteFileVectors } from "./vectorstore";
import { getCachedExtraction, setCachedExtraction } from "./cache";

export class ValidationError extends Error {}

export interface UploadResult {
  file: FileRecord;
  deduped: boolean;
}

export async function processUpload(
  env: Env,
  filename: string,
  mimeType: string,
  bytes: ArrayBuffer
): Promise<UploadResult> {
  const maxSize = Number(env.MAX_FILE_SIZE_BYTES);
  if (bytes.byteLength === 0) throw new ValidationError("Uploaded file is empty");
  if (bytes.byteLength > maxSize) {
    throw new ValidationError(`File exceeds the ${Math.round(maxSize / 1024 / 1024)}MB limit`);
  }

  const fileType = detectFileType(filename, mimeType);
  if (!fileType) {
    throw new ValidationError(
      `Unsupported file type for "${filename}". Supported: pdf, xlsx, csv, docx, pptx, txt, md`
    );
  }

  const contentHash = await sha256Hex(bytes);

  // Dedup: identical bytes already processed -> skip storage write, extraction, chunking, embedding.
  const existing = await getFileByHash(env, contentHash);
  if (existing) {
    return { file: existing, deduped: true };
  }

  const id = newId("file");
  const storagePath = `${id}/${filename}`;
  const now = new Date().toISOString();

  const file: FileRecord = {
    id,
    filename,
    mime_type: mimeType,
    file_type: fileType,
    size_bytes: bytes.byteLength,
    content_hash: contentHash,
    storage_path: storagePath,
    github_sha: null,
    status: "processing",
    extraction_status: "pending",
    indexing_status: "pending",
    token_count: 0,
    chunk_count: 0,
    error: null,
    uploaded_at: now,
    processed_at: null,
  };
  await insertFile(env, file);

  try {
    const githubSha = await putFile(env, storagePath, bytes, `Add ${filename} (${id})`);
    await updateFile(env, id, { github_sha: githubSha });

    // Content hash matched a prior extraction (e.g. re-upload of a byte-identical file that was
    // previously deleted): the raw bytes were re-fetched into GitHub above, but the CPU-heavy
    // extraction + chunking step is skipped entirely by reusing the cached chunk text. Embedding
    // still runs, since the old vectors were removed along with the deleted file.
    const cached = await getCachedExtraction(env, contentHash);
    const chunks = cached ? cached.chunks : await (async () => {
      const extraction = await extractByType(fileType, bytes);
      return chunkSegments(extraction.segments, Number(env.CHUNK_MAX_TOKENS), Number(env.CHUNK_OVERLAP_TOKENS));
    })();
    await updateFile(env, id, { extraction_status: "done" });

    const chunkRecords: ChunkRecord[] = chunks.map((c, i) => ({
      id: newId("chunk"),
      file_id: id,
      chunk_index: i,
      heading: c.heading,
      page_number: c.page_number,
      sheet_name: c.sheet_name,
      token_count: c.token_count,
      text: c.text,
    }));

    await insertChunks(env, chunkRecords);
    await indexChunks(env, id, chunkRecords);
    await updateFile(env, id, { indexing_status: "done" });

    const tokenCount = chunkRecords.reduce((sum, c) => sum + c.token_count, 0);
    const chunkCount = chunkRecords.length;

    if (!cached) {
      await setCachedExtraction(env, contentHash, { fileType, chunks });
    }

    await updateFile(env, id, {
      status: "ready",
      token_count: tokenCount,
      chunk_count: chunkCount,
      processed_at: new Date().toISOString(),
    });

    const finalFile = { ...file, github_sha: githubSha, status: "ready" as const, extraction_status: "done" as const, indexing_status: "done" as const, token_count: tokenCount, chunk_count: chunkCount };
    return { file: finalFile, deduped: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateFile(env, id, { status: "failed", error: message });
    throw err;
  }
}

export async function deleteFileCompletely(env: Env, fileId: string, file: FileRecord): Promise<void> {
  const chunks = await getChunksByFile(env, fileId);
  await deleteFileVectors(env, chunks.map((c) => c.id));
  if (file.github_sha) {
    await deleteGithubFile(env, file.storage_path, file.github_sha, `Delete ${file.filename} (${fileId})`);
  }
  await deleteFileRow(env, fileId);
}

export { estimateTokens };
