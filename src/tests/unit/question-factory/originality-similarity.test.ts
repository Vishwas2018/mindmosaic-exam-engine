import { describe, expect, it } from "vitest";

import {
  buildShingles,
  computeSimilarity,
  extractComparableText,
  jaccardSimilarity,
  normaliseComparableText,
  tokenise,
} from "@/features/question-factory/originality/similarity";

describe("normaliseComparableText — canonicalisation", () => {
  it("lower-cases, strips punctuation, and collapses whitespace", () => {
    expect(normaliseComparableText("What is 23 + 48?")).toBe("what is 23 48");
  });

  it("collapses repeated whitespace and trims", () => {
    expect(normaliseComparableText("  Hello   World  ")).toBe("hello world");
  });

  it("normalises Unicode NFKC — composed and decomposed accented forms canonicalise identically", () => {
    const composed = "Café".normalize("NFKC");
    const decomposed = "Café".normalize("NFD");
    expect(normaliseComparableText(decomposed)).toBe(normaliseComparableText(composed));
  });

  it("is deterministic across repeated calls", () => {
    const text = "The quick brown fox jumps over the lazy dog!";
    expect(normaliseComparableText(text)).toBe(normaliseComparableText(text));
  });
});

describe("tokenise", () => {
  it("splits normalised text on whitespace", () => {
    expect(tokenise("what is 23 48")).toEqual(["what", "is", "23", "48"]);
  });

  it("returns an empty array for empty input", () => {
    expect(tokenise("")).toEqual([]);
  });
});

describe("buildShingles — 3-token sliding window", () => {
  it("builds overlapping trigrams for 3+ tokens", () => {
    const shingles = buildShingles(["a", "b", "c", "d"]);
    expect(shingles).toEqual(new Set(["a b c", "b c d"]));
  });

  it("falls back to the whole joined text when fewer than 3 tokens are available", () => {
    expect(buildShingles(["a", "b"])).toEqual(new Set(["a b"]));
    expect(buildShingles(["a"])).toEqual(new Set(["a"]));
  });

  it("returns an empty set for zero tokens — the 'cannot compute' case", () => {
    expect(buildShingles([]).size).toBe(0);
  });
});

describe("jaccardSimilarity — pure set arithmetic, exact boundary values", () => {
  it("is 1.0 for identical sets", () => {
    const a = new Set(["x", "y", "z"]);
    expect(jaccardSimilarity(a, new Set(a))).toBe(1);
  });

  it("is 0 for disjoint sets", () => {
    expect(jaccardSimilarity(new Set(["a", "b"]), new Set(["c", "d"]))).toBe(0);
  });

  it("is 0 when either set is empty", () => {
    expect(jaccardSimilarity(new Set(), new Set(["a"]))).toBe(0);
    expect(jaccardSimilarity(new Set(["a"]), new Set())).toBe(0);
    expect(jaccardSimilarity(new Set(), new Set())).toBe(0);
  });

  it("hits the exact STRUCTURALLY_SIMILAR_SIMILARITY boundary (0.6 = 3/5)", () => {
    // |A ∩ B| = 3, |A ∪ B| = 5 -> 3/5 = 0.6 exactly.
    const a = new Set(["s1", "s2", "s3", "s4"]);
    const b = new Set(["s1", "s2", "s3", "s5"]);
    expect(jaccardSimilarity(a, b)).toBeCloseTo(0.6, 10);
  });

  it("hits the exact NEAR_DUPLICATE_SIMILARITY boundary (0.85 = 17/20)", () => {
    // |A ∩ B| = 17, |A ∪ B| = 20 -> 17/20 = 0.85 exactly.
    const shared = Array.from({ length: 17 }, (_, index) => `shared-${index}`);
    const a = new Set([...shared, "only-a-1", "only-a-2", "only-a-3"]);
    const b = new Set(shared);
    expect(jaccardSimilarity(a, b)).toBeCloseTo(0.85, 10);
  });

  it("is deterministic — repeated calls on equivalent sets produce the same score", () => {
    const a = new Set(["p", "q", "r"]);
    const b = new Set(["q", "r", "s"]);
    expect(jaccardSimilarity(a, b)).toBe(jaccardSimilarity(new Set(a), new Set(b)));
  });
});

describe("computeSimilarity — end-to-end text pipeline", () => {
  it("is 1.0 for identical text", () => {
    const text = "The quick brown fox jumps over the lazy dog.";
    expect(computeSimilarity(text, text)).toBe(1);
  });

  it("is 0 for completely disjoint text", () => {
    expect(computeSimilarity("alpha beta gamma delta", "epsilon zeta eta theta")).toBe(0);
  });

  it("is invariant to case and punctuation differences alone", () => {
    expect(computeSimilarity("What is 23 + 48?", "what is 23 48")).toBe(1);
  });

  it("is deterministic — same inputs always produce the same score", () => {
    const a = "Sam buys 2 apples and 1 banana at the market.";
    const b = "Sam buys 3 apples and 2 bananas at the market.";
    expect(computeSimilarity(a, b)).toBe(computeSimilarity(a, b));
  });
});

describe("extractComparableText", () => {
  it("concatenates prompt, stimulus body, and option texts, space-separated", () => {
    const text = extractComparableText({
      prompt: "What is the answer?",
      stimulus: { body: "A short passage." },
      options: [{ text: "Option A" }, { text: "Option B" }],
    });
    expect(text).toBe("What is the answer? A short passage. Option A Option B");
  });

  it("omits an absent stimulus and handles zero options", () => {
    const text = extractComparableText({ prompt: "What is 2 + 2?", options: [] });
    expect(text).toBe("What is 2 + 2?");
  });

  it("never includes explanation text — it is not part of the function's input shape", () => {
    const text = extractComparableText({ prompt: "Prompt only.", options: [] });
    expect(text).not.toMatch(/explanation/i);
  });
});
