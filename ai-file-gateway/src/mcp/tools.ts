import type { Env } from "../types";
import { processUpload, deleteFileCompletely, ValidationError } from "../lib/pipeline";
import { getFileById, listFiles, getFileByHash } from "../lib/db";
import { searchFiles, askFiles } from "../lib/rag";
import { summarizeFile } from "../lib/summarize";
import { translateFile } from "../lib/translate";
import { compareFiles } from "../lib/compare";
import { getFile as getGithubFile } from "../lib/github";
import { base64ToBytes } from "../lib/github";

export interface McpToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (env: Env, args: Record<string, unknown>) => Promise<unknown>;
}

function fileSummary(f: Awaited<ReturnType<typeof getFileById>>) {
  if (!f) return null;
  return {
    id: f.id,
    filename: f.filename,
    file_type: f.file_type,
    size_bytes: f.size_bytes,
    status: f.status,
    extraction_status: f.extraction_status,
    indexing_status: f.indexing_status,
    token_count: f.token_count,
    chunk_count: f.chunk_count,
    uploaded_at: f.uploaded_at,
  };
}

async function requireFile(env: Env, fileId: string) {
  const file = await getFileById(env, fileId);
  if (!file) throw new ValidationError(`No file with id "${fileId}"`);
  return file;
}

export const tools: McpToolDef[] = [
  {
    name: "upload_file",
    description:
      "Upload a file (pdf, xlsx, csv, docx, pptx, txt, md) for processing: stores the original in the GitHub " +
      "storage repo, extracts text/structure, chunks it, embeds chunks into Vectorize, and caches everything so " +
      "re-uploading identical bytes never reprocesses.",
    inputSchema: {
      type: "object",
      properties: {
        filename: { type: "string" },
        content_base64: { type: "string", description: "Raw file bytes, base64-encoded" },
        mime_type: { type: "string" },
      },
      required: ["filename", "content_base64"],
    },
    handler: async (env, args) => {
      const filename = String(args.filename);
      const mimeType = args.mime_type ? String(args.mime_type) : "application/octet-stream";
      const bytes = base64ToBytes(String(args.content_base64));
      const result = await processUpload(env, filename, mimeType, bytes);
      return { ...fileSummary(result.file), deduped: result.deduped };
    },
  },
  {
    name: "list_files",
    description: "List uploaded files with their processing status, token count, and chunk count.",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number" }, offset: { type: "number" } },
    },
    handler: async (env, args) => {
      const files = await listFiles(env, Number(args.limit ?? 50), Number(args.offset ?? 0));
      return files.map(fileSummary);
    },
  },
  {
    name: "get_file",
    description: "Get metadata for a single file by id.",
    inputSchema: { type: "object", properties: { file_id: { type: "string" } }, required: ["file_id"] },
    handler: async (env, args) => fileSummary(await requireFile(env, String(args.file_id))),
  },
  {
    name: "read_file",
    description: "Fetch the raw original file bytes (base64) from GitHub storage by file id.",
    inputSchema: { type: "object", properties: { file_id: { type: "string" } }, required: ["file_id"] },
    handler: async (env, args) => {
      const file = await requireFile(env, String(args.file_id));
      const bytes = await getGithubFile(env, file.storage_path);
      const b64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
      return { filename: file.filename, mime_type: file.mime_type, content_base64: b64 };
    },
  },
  {
    name: "search_files",
    description:
      "Semantic search across all files (or one file when file_id is given). Returns only the relevant chunks " +
      "with source references — never whole files.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, file_id: { type: "string" }, top_k: { type: "number" } },
      required: ["query"],
    },
    handler: async (env, args) => {
      const hits = await searchFiles(env, String(args.query), args.file_id ? String(args.file_id) : undefined, args.top_k ? Number(args.top_k) : undefined);
      return hits.map((h) => ({
        file: h.file.filename,
        file_id: h.file.id,
        page_number: h.chunk.page_number,
        sheet_name: h.chunk.sheet_name,
        heading: h.chunk.heading,
        score: h.score,
        text: h.chunk.text,
      }));
    },
  },
  {
    name: "ask_files",
    description:
      "Ask a natural-language question answered from your files via RAG: retrieves only relevant chunks and " +
      "sends minimal context to the model, with source citations.",
    inputSchema: {
      type: "object",
      properties: { question: { type: "string" }, file_id: { type: "string" } },
      required: ["question"],
    },
    handler: async (env, args) => askFiles(env, String(args.question), args.file_id ? String(args.file_id) : undefined),
  },
  {
    name: "summarize_file",
    description: "Summarize a file using map-reduce over its chunks (never sends the whole file to the model).",
    inputSchema: { type: "object", properties: { file_id: { type: "string" } }, required: ["file_id"] },
    handler: async (env, args) => ({ summary: await summarizeFile(env, await requireFile(env, String(args.file_id))) }),
  },
  {
    name: "translate_file",
    description:
      "Translate a file chunk-by-chunk into target_language, preserving structure, numbers, names, URLs, and " +
      "formulas untouched.",
    inputSchema: {
      type: "object",
      properties: { file_id: { type: "string" }, target_language: { type: "string" } },
      required: ["file_id", "target_language"],
    },
    handler: async (env, args) => translateFile(env, await requireFile(env, String(args.file_id)), String(args.target_language)),
  },
  {
    name: "compare_files",
    description: "Compare two files by their summaries and (optionally) chunks relevant to a specific focus.",
    inputSchema: {
      type: "object",
      properties: { file_id_a: { type: "string" }, file_id_b: { type: "string" }, focus: { type: "string" } },
      required: ["file_id_a", "file_id_b"],
    },
    handler: async (env, args) => {
      const [a, b] = await Promise.all([requireFile(env, String(args.file_id_a)), requireFile(env, String(args.file_id_b))]);
      return { comparison: await compareFiles(env, a, b, args.focus ? String(args.focus) : undefined) };
    },
  },
  {
    name: "delete_file",
    description: "Delete a file: removes its vectors, chunk rows, D1 metadata, and the original from GitHub storage.",
    inputSchema: { type: "object", properties: { file_id: { type: "string" } }, required: ["file_id"] },
    handler: async (env, args) => {
      const file = await requireFile(env, String(args.file_id));
      await deleteFileCompletely(env, file.id, file);
      return { deleted: true, file_id: file.id };
    },
  },
];

export async function findDuplicateByHash(env: Env, hash: string) {
  return getFileByHash(env, hash);
}
