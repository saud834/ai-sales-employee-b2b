export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  VECTORIZE: VectorizeIndex;
  AI: Ai;

  EMBED_MODEL: string;
  EMBED_DIMENSIONS: string;
  CHAT_MODEL: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  GITHUB_STORAGE_DIR: string;
  MAX_FILE_SIZE_BYTES: string;
  CHUNK_MAX_TOKENS: string;
  CHUNK_OVERLAP_TOKENS: string;
  SEARCH_TOP_K: string;

  GITHUB_TOKEN: string;
  API_AUTH_TOKEN: string;
}

export type FileType = "pdf" | "xlsx" | "csv" | "docx" | "pptx" | "txt" | "md";

export type FileStatus = "uploading" | "processing" | "ready" | "failed";
export type StageStatus = "pending" | "done" | "failed";

export interface FileRecord {
  id: string;
  filename: string;
  mime_type: string;
  file_type: FileType;
  size_bytes: number;
  content_hash: string;
  storage_path: string;
  github_sha: string | null;
  status: FileStatus;
  extraction_status: StageStatus;
  indexing_status: StageStatus;
  token_count: number;
  chunk_count: number;
  error: string | null;
  uploaded_at: string;
  processed_at: string | null;
}

export interface ChunkRecord {
  id: string;
  file_id: string;
  chunk_index: number;
  heading: string | null;
  page_number: number | null;
  sheet_name: string | null;
  token_count: number;
  text: string;
}

export interface ExtractedSegment {
  text: string;
  heading?: string;
  page_number?: number;
  sheet_name?: string;
}

export interface ExtractionResult {
  segments: ExtractedSegment[];
  pageOrSheetCount: number;
}

export interface SearchHit {
  chunk: ChunkRecord;
  score: number;
  file: Pick<FileRecord, "id" | "filename" | "file_type">;
}
