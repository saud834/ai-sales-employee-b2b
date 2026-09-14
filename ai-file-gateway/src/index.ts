import { Hono } from "hono";
import type { Env } from "./types";
import { isAuthorized } from "./auth";
import { processUpload, deleteFileCompletely, ValidationError } from "./lib/pipeline";
import { getFileById, listFiles } from "./lib/db";
import { searchFiles, askFiles } from "./lib/rag";
import { summarizeFile } from "./lib/summarize";
import { translateFile } from "./lib/translate";
import { compareFiles } from "./lib/compare";
import { handleMcpRequest } from "./mcp/server";

const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) => c.json({ ok: true, service: "ai-file-gateway" }));

app.use("*", async (c, next) => {
  if (c.req.path === "/health") return next();
  if (!isAuthorized(c.req.raw, c.env)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});

function fileView(f: NonNullable<Awaited<ReturnType<typeof getFileById>>>) {
  return {
    id: f.id,
    filename: f.filename,
    file_type: f.file_type,
    mime_type: f.mime_type,
    size_bytes: f.size_bytes,
    status: f.status,
    extraction_status: f.extraction_status,
    indexing_status: f.indexing_status,
    token_count: f.token_count,
    chunk_count: f.chunk_count,
    error: f.error,
    uploaded_at: f.uploaded_at,
    processed_at: f.processed_at,
  };
}

app.onError((err, c) => {
  if (err instanceof ValidationError) return c.json({ error: err.message }, 400);
  console.error(err);
  return c.json({ error: "Internal error" }, 500);
});

app.post("/upload", async (c) => {
  const form = await c.req.formData();
  const entry = form.get("file");
  if (!entry || typeof entry === "string") return c.json({ error: "multipart field 'file' is required" }, 400);
  const file = entry as unknown as File;

  const bytes = await file.arrayBuffer();
  const result = await processUpload(c.env, file.name, file.type || "application/octet-stream", bytes);
  return c.json({ ...fileView(result.file), deduped: result.deduped }, result.deduped ? 200 : 201);
});

app.get("/files", async (c) => {
  const limit = Number(c.req.query("limit") ?? 50);
  const offset = Number(c.req.query("offset") ?? 0);
  const files = await listFiles(c.env, limit, offset);
  return c.json({ files: files.map(fileView) });
});

app.get("/files/:id", async (c) => {
  const file = await getFileById(c.env, c.req.param("id"));
  if (!file) return c.json({ error: "Not found" }, 404);
  return c.json(fileView(file));
});

app.delete("/files/:id", async (c) => {
  const file = await getFileById(c.env, c.req.param("id"));
  if (!file) return c.json({ error: "Not found" }, 404);
  await deleteFileCompletely(c.env, file.id, file);
  return c.json({ deleted: true, file_id: file.id });
});

app.post("/search", async (c) => {
  const body = await c.req.json<{ query: string; file_id?: string; top_k?: number }>();
  if (!body.query) return c.json({ error: "'query' is required" }, 400);
  const hits = await searchFiles(c.env, body.query, body.file_id, body.top_k);
  return c.json({
    results: hits.map((h) => ({
      file_id: h.file.id,
      filename: h.file.filename,
      score: h.score,
      page_number: h.chunk.page_number,
      sheet_name: h.chunk.sheet_name,
      heading: h.chunk.heading,
      text: h.chunk.text,
    })),
  });
});

app.post("/ask", async (c) => {
  const body = await c.req.json<{ question: string; file_id?: string }>();
  if (!body.question) return c.json({ error: "'question' is required" }, 400);
  return c.json(await askFiles(c.env, body.question, body.file_id));
});

app.post("/summarize", async (c) => {
  const body = await c.req.json<{ file_id: string }>();
  const file = await getFileById(c.env, body.file_id);
  if (!file) return c.json({ error: "Not found" }, 404);
  return c.json({ file_id: file.id, summary: await summarizeFile(c.env, file) });
});

app.post("/translate", async (c) => {
  const body = await c.req.json<{ file_id: string; target_language: string }>();
  if (!body.target_language) return c.json({ error: "'target_language' is required" }, 400);
  const file = await getFileById(c.env, body.file_id);
  if (!file) return c.json({ error: "Not found" }, 404);
  return c.json(await translateFile(c.env, file, body.target_language));
});

app.post("/compare", async (c) => {
  const body = await c.req.json<{ file_id_a: string; file_id_b: string; focus?: string }>();
  const [a, b] = await Promise.all([getFileById(c.env, body.file_id_a), getFileById(c.env, body.file_id_b)]);
  if (!a || !b) return c.json({ error: "Not found" }, 404);
  return c.json({ comparison: await compareFiles(c.env, a, b, body.focus) });
});

app.post("/mcp", async (c) => handleMcpRequest(c.req.raw, c.env));
app.get("/mcp", (c) => c.json({ error: "MCP endpoint requires POST with a JSON-RPC body" }, 405));

export default app;
