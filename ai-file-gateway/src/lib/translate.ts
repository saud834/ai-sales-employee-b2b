import type { Env } from "../types";
import { chat } from "./embeddings";
import { getChunksByFile } from "./db";
import type { FileRecord } from "../types";

/**
 * Masks content that must survive translation unchanged — URLs, emails, numbers (incl. units/%),
 * spreadsheet formulas, and inline code — with placeholders, so neither the model's judgement nor
 * its language drift can alter them. Restored verbatim after translation.
 */
const MASK_PATTERNS: RegExp[] = [
  /\bhttps?:\/\/[^\s)]+/gi, // URLs
  /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/gi, // emails
  /^=.+$/gm, // spreadsheet formulas (whole-cell)
  /`[^`]+`/g, // inline code
  /\b\d+(?:[.,]\d+)?%?\b/g, // numbers, decimals, percentages
];

function maskProtectedSpans(text: string): { masked: string; restore: Map<string, string> } {
  const restore = new Map<string, string>();
  let masked = text;
  let counter = 0;

  for (const pattern of MASK_PATTERNS) {
    masked = masked.replace(pattern, (match) => {
      // U+E000 is in the Unicode Private Use Area — never appears in real documents, and (unlike
      // a NUL byte) survives JSON/text transport untouched.
      const token = `${counter++}`;
      restore.set(token, match);
      return token;
    });
  }
  return { masked, restore };
}

function unmask(text: string, restore: Map<string, string>): string {
  let out = text;
  for (const [token, original] of restore) {
    out = out.split(token).join(original);
  }
  return out;
}

async function translateChunkText(env: Env, text: string, targetLanguage: string): Promise<string> {
  const { masked, restore } = maskProtectedSpans(text);

  const translated = await chat(
    env,
    [
      {
        role: "system",
        content:
          `Translate the user's text into ${targetLanguage}. Preserve document structure (headings, lists, ` +
          "line breaks, table formatting) exactly. Do not translate or alter tokens that look like " +
          "<number> placeholders, proper names, or technical terms — copy them through unchanged. " +
          "Return only the translated text, no commentary.",
      },
      { role: "user", content: masked },
    ],
    1000
  );

  return unmask(translated, restore);
}

export interface TranslateResult {
  file: Pick<FileRecord, "id" | "filename">;
  targetLanguage: string;
  segments: { heading: string | null; page_number: number | null; sheet_name: string | null; original: string; translated: string }[];
}

/** Translates a file chunk-by-chunk (never the whole document in one LLM call) preserving structure per chunk. */
export async function translateFile(env: Env, file: FileRecord, targetLanguage: string): Promise<TranslateResult> {
  const chunks = await getChunksByFile(env, file.id);

  const segments = [];
  for (const chunk of chunks) {
    const translated = await translateChunkText(env, chunk.text, targetLanguage);
    segments.push({
      heading: chunk.heading,
      page_number: chunk.page_number,
      sheet_name: chunk.sheet_name,
      original: chunk.text,
      translated,
    });
  }

  return { file: { id: file.id, filename: file.filename }, targetLanguage, segments };
}
