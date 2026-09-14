-- AI File Gateway: D1 schema
-- Reuses the existing database `ai-file-gateway-db` (db40020d-64a3-41b7-838f-366958231dce)

CREATE TABLE IF NOT EXISTS files (
  id              TEXT PRIMARY KEY,
  filename        TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  file_type       TEXT NOT NULL,               -- pdf | xlsx | csv | docx | pptx | txt | md
  size_bytes      INTEGER NOT NULL,
  content_hash    TEXT NOT NULL,                -- sha256 of raw bytes, used for dedup/caching
  storage_path    TEXT NOT NULL,                -- path in the GitHub storage repo
  github_sha      TEXT,                         -- blob sha of the stored file (for updates/deletes)
  status          TEXT NOT NULL DEFAULT 'uploading', -- uploading | processing | ready | failed
  extraction_status TEXT NOT NULL DEFAULT 'pending',  -- pending | done | failed
  indexing_status   TEXT NOT NULL DEFAULT 'pending',  -- pending | done | failed
  token_count     INTEGER NOT NULL DEFAULT 0,
  chunk_count     INTEGER NOT NULL DEFAULT 0,
  error           TEXT,
  uploaded_at     TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_files_hash ON files(content_hash);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);

CREATE TABLE IF NOT EXISTS chunks (
  id            TEXT PRIMARY KEY,               -- also the Vectorize vector id
  file_id       TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  chunk_index   INTEGER NOT NULL,
  heading       TEXT,
  page_number   INTEGER,
  sheet_name    TEXT,
  token_count   INTEGER NOT NULL,
  text          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chunks_file ON chunks(file_id);
