import { describe, expect, it } from "vitest";
import { chunkSegments } from "../src/lib/chunk";
import { estimateTokens } from "../src/lib/tokens";

describe("chunkSegments", () => {
  it("keeps chunks within the token budget", () => {
    const longText = Array.from({ length: 50 }, (_, i) => `This is sentence number ${i}.`).join(" ");
    const chunks = chunkSegments([{ text: longText }], 50, 10);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.token_count).toBeLessThanOrEqual(50 + 10); // allow small overlap slop
    }
  });

  it("carries heading/page/sheet metadata onto every chunk from that segment", () => {
    const chunks = chunkSegments([{ text: "Some content here.", heading: "Intro", page_number: 3 }], 400, 0);
    expect(chunks[0].heading).toBe("Intro");
    expect(chunks[0].page_number).toBe(3);
  });

  it("starts a new chunk at segment boundaries instead of merging across pages", () => {
    const chunks = chunkSegments(
      [
        { text: "First page content.", page_number: 1 },
        { text: "Second page content.", page_number: 2 },
      ],
      400,
      0
    );
    expect(chunks).toHaveLength(2);
    expect(chunks[0].page_number).toBe(1);
    expect(chunks[1].page_number).toBe(2);
  });

  it("hard-splits a single sentence that exceeds the token budget on its own", () => {
    const huge = "x".repeat(2000);
    const chunks = chunkSegments([{ text: huge }], 50, 0);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(estimateTokens(chunk.text)).toBeLessThanOrEqual(50);
    }
  });
});
