import { describe, expect, it } from "vitest";
import { estimateTokens } from "../src/lib/tokens";

describe("estimateTokens", () => {
  it("returns 0 for empty input", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("   ")).toBe(0);
  });

  it("scales roughly with length", () => {
    expect(estimateTokens("a")).toBe(1);
    expect(estimateTokens("a".repeat(400))).toBe(100);
  });
});
