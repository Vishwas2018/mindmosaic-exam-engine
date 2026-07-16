import { describe, expect, it } from "vitest";

import { mintRevisionCandidateId } from "@/features/question-factory/revision";

describe("mintRevisionCandidateId", () => {
  it("is deterministic: identical inputs always mint the same id", () => {
    const params = { parentCandidateId: "man-parent1", revisionRequestId: "rev-req-1", revisedContentHash: "hash-abc" };
    const first = mintRevisionCandidateId(params);
    const second = mintRevisionCandidateId(params);
    expect(first).toBe(second);
  });

  it("uses the 'rev-' prefix, distinct from gen-/ing-/man-", () => {
    const id = mintRevisionCandidateId({ parentCandidateId: "man-parent1", revisionRequestId: "rev-req-1", revisedContentHash: "hash-abc" });
    expect(id.startsWith("rev-")).toBe(true);
  });

  it("mints a distinct id for a distinct revisionRequestId against the same parent and content", () => {
    const a = mintRevisionCandidateId({ parentCandidateId: "man-parent1", revisionRequestId: "rev-req-1", revisedContentHash: "hash-abc" });
    const b = mintRevisionCandidateId({ parentCandidateId: "man-parent1", revisionRequestId: "rev-req-2", revisedContentHash: "hash-abc" });
    expect(a).not.toBe(b);
  });

  it("mints a distinct id for a distinct parentCandidateId", () => {
    const a = mintRevisionCandidateId({ parentCandidateId: "man-parent1", revisionRequestId: "rev-req-1", revisedContentHash: "hash-abc" });
    const b = mintRevisionCandidateId({ parentCandidateId: "man-parent2", revisionRequestId: "rev-req-1", revisedContentHash: "hash-abc" });
    expect(a).not.toBe(b);
  });

  it("mints a distinct id for distinct content", () => {
    const a = mintRevisionCandidateId({ parentCandidateId: "man-parent1", revisionRequestId: "rev-req-1", revisedContentHash: "hash-abc" });
    const b = mintRevisionCandidateId({ parentCandidateId: "man-parent1", revisionRequestId: "rev-req-1", revisedContentHash: "hash-def" });
    expect(a).not.toBe(b);
  });
});
