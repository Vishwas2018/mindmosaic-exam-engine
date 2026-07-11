import { describe, expect, it } from "vitest";

import {
  hashContent,
  hashJson,
  normaliseNewlines,
  normalisePathSeparators,
  stableStringify,
} from "@/features/question-factory/provenance";

const FIXED_TEXT_LF = "Hello MindMosaic\nSecond line\n";
const FIXED_TEXT_CRLF = "Hello MindMosaic\r\nSecond line\r\n";
const FIXED_TEXT_CR = "Hello MindMosaic\rSecond line\r";

// Golden vectors: computed once with the algorithm below and pinned here as
// a regression guard. If these ever change, every stored contentHash in
// provenance records silently invalidates - that must be a deliberate,
// reviewed decision, not an accidental refactor.
const GOLDEN_LF_HASH = "18540b298b3dbb128d8093f0f9bd020e8734871f44e34c0bdcb7fbfab12b66d8";
const GOLDEN_EMPTY_HASH = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const GOLDEN_JSON_HASH = "c0f5a125be13845a6eaf40de7c7e4ebf010702637890fa10dab5a3b2ed350998";

describe("content hashing golden vectors", () => {
  it("hashes a fixed LF string to the pinned digest", () => {
    expect(hashContent(FIXED_TEXT_LF)).toBe(GOLDEN_LF_HASH);
  });

  it("hashes the empty string to the pinned digest", () => {
    expect(hashContent("")).toBe(GOLDEN_EMPTY_HASH);
  });

  it("hashes a fixed object to the pinned digest regardless of key order", () => {
    const objA = { b: 2, a: 1, c: { y: 2, x: 1 } };
    const objB = { a: 1, c: { x: 1, y: 2 }, b: 2 };
    expect(hashJson(objA)).toBe(GOLDEN_JSON_HASH);
    expect(hashJson(objB)).toBe(GOLDEN_JSON_HASH);
  });
});

describe("Windows determinism: newline normalisation", () => {
  it("hashes LF, CRLF and CR line endings of the same content identically", () => {
    const lf = hashContent(FIXED_TEXT_LF);
    const crlf = hashContent(FIXED_TEXT_CRLF);
    const cr = hashContent(FIXED_TEXT_CR);
    expect(crlf).toBe(lf);
    expect(cr).toBe(lf);
  });

  it("normaliseNewlines converts CRLF and CR to LF", () => {
    expect(normaliseNewlines("a\r\nb\rc\n")).toBe("a\nb\nc\n");
  });

  it("does not alter content that is already LF-only", () => {
    expect(normaliseNewlines(FIXED_TEXT_LF)).toBe(FIXED_TEXT_LF);
  });
});

describe("path separator normalisation", () => {
  it("converts backslashes to forward slashes", () => {
    expect(normalisePathSeparators("content\\question-factory\\staged\\x.json")).toBe(
      "content/question-factory/staged/x.json",
    );
  });

  it("leaves forward-slash paths unchanged", () => {
    expect(normalisePathSeparators("content/question-factory/staged/x.json")).toBe(
      "content/question-factory/staged/x.json",
    );
  });
});

describe("stable JSON key ordering", () => {
  it("produces identical output for objects with different key insertion order", () => {
    const objA = { z: 1, a: { d: 4, b: 2 }, m: [3, 1, 2] };
    const objB = { a: { b: 2, d: 4 }, m: [3, 1, 2], z: 1 };
    expect(stableStringify(objA)).toBe(stableStringify(objB));
  });

  it("does not sort array element order, only object keys", () => {
    expect(stableStringify([3, 1, 2])).toBe("[3,1,2]");
  });

  it("two JSON-equal objects with different key order hash identically", () => {
    const objA = { first: "x", second: "y" };
    const objB = { second: "y", first: "x" };
    expect(hashJson(objA)).toBe(hashJson(objB));
  });

  it("two JSON-different objects hash differently", () => {
    expect(hashJson({ a: 1 })).not.toBe(hashJson({ a: 2 }));
  });
});
