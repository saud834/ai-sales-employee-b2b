import type { ExtractedSegment } from "../types";
import { estimateTokens } from "./tokens";

export interface Chunk {
  text: string;
  heading: string | null;
  page_number: number | null;
  sheet_name: string | null;
  token_count: number;
}

const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[A-Z0-9"'(])|\n{2,}/g;

/**
 * Packs extracted segments into token-budgeted chunks without splitting mid-sentence,
 * carrying a small overlap forward so retrieval doesn't lose context at chunk boundaries.
 * Segment boundaries (page/sheet/heading changes) always start a new chunk so citations
 * stay accurate.
 */
export function chunkSegments(
  segments: ExtractedSegment[],
  maxTokens: number,
  overlapTokens: number
): Chunk[] {
  const chunks: Chunk[] = [];

  for (const segment of segments) {
    const sentences = segment.text
      .split(SENTENCE_SPLIT)
      .map((s) => s.trim())
      .filter(Boolean);

    let current: string[] = [];
    let currentTokens = 0;

    const flush = () => {
      if (current.length === 0) return;
      chunks.push({
        text: current.join(" "),
        heading: segment.heading ?? null,
        page_number: segment.page_number ?? null,
        sheet_name: segment.sheet_name ?? null,
        token_count: currentTokens,
      });
      current = [];
      currentTokens = 0;
    };

    for (const sentence of sentences) {
      const sentenceTokens = estimateTokens(sentence);

      if (sentenceTokens > maxTokens) {
        // Single oversized sentence/line (e.g. a huge table row): hard-split by characters.
        flush();
        const approxCharsPerChunk = maxTokens * 4;
        for (let i = 0; i < sentence.length; i += approxCharsPerChunk) {
          const piece = sentence.slice(i, i + approxCharsPerChunk);
          chunks.push({
            text: piece,
            heading: segment.heading ?? null,
            page_number: segment.page_number ?? null,
            sheet_name: segment.sheet_name ?? null,
            token_count: estimateTokens(piece),
          });
        }
        continue;
      }

      if (currentTokens + sentenceTokens > maxTokens) {
        flush();
        // carry overlap forward from the tail of the previous chunk
        const prev = chunks[chunks.length - 1];
        if (prev && overlapTokens > 0) {
          const overlapChars = overlapTokens * 4;
          const tail = prev.text.slice(-overlapChars);
          if (tail) {
            current.push(tail);
            currentTokens += estimateTokens(tail);
          }
        }
      }

      current.push(sentence);
      currentTokens += sentenceTokens;
    }

    flush();
  }

  return chunks;
}
