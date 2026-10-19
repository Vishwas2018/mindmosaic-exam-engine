import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { checkScholarshipExternalResponse, type DeclaredItem } from "@/features/question-factory/review/scholarship-external-packet";
import { requeueQuarantinedForExternalReview } from "@/features/question-factory/review/requeue-for-review";
import type { FactoryRepository } from "@/features/question-factory/storage";

const dir = path.join(process.cwd(), "docs/reviews/scholarship-2026-10-18/external-review");
const manifest = JSON.parse(readFileSync(path.join(dir, "packet-manifest.json"), "utf8")) as { packetSha256: string; items: { id: string }[] };
const declared: DeclaredItem[] = ["verbal-reasoning", "reading"].flatMap((name) =>
  (JSON.parse(readFileSync(path.join(process.cwd(), `content/scholarship-drafts/scholarship-y6-${name}-draft.json`), "utf8")).questions as {
    id: string; answerKey: { optionId: string }; metadata: { difficulty: string };
  }[]).map((q) => ({ id: q.id, key: q.answerKey.optionId, difficulty: q.metadata.difficulty })),
);

function response(overrides: Record<string, unknown> = {}, mutate?: (items: Record<string, unknown>[]) => void) {
  const items = declared.map((d) => ({
    id: d.id, myAnswer: d.key, reasoning: "worked from the text", singleDefensibleAnswer: true, issues: "",
    difficulty: d.difficulty, verdict: "PASS", fix: "",
  }));
  mutate?.(items);
  return {
    reviewer: { provider: "openai", model: "fixture-model-for-test", date: "2026-10-19", freshSession: true, packetSha256: manifest.packetSha256 },
    items, ...overrides,
  };
}

describe("external packet response check", () => {
  it("covers exactly the 80 verbal and reading items", () => {
    expect(manifest.items).toHaveLength(80);
    expect(new Set(manifest.items.map((i) => i.id))).toEqual(new Set(declared.map((d) => d.id)));
  });

  it("accepts a complete different-provider response and summarises agreement", () => {
    const report = checkScholarshipExternalResponse(response(), manifest, declared);
    expect(report.problems).toEqual([]);
    expect(report.valid).toBe(true);
    expect(report.summary?.agreeWithKey).toBe(80);
  });

  it("reports disagreements, ambiguity, revise verdicts and differing difficulty without hiding them", () => {
    const report = checkScholarshipExternalResponse(response({}, (items) => {
      items[0].myAnswer = "none";
      items[1].singleDefensibleAnswer = false;
      items[2].verdict = "REVISE";
      items[3].difficulty = items[3].difficulty === "easy" ? "challenging" : "easy";
    }), manifest, declared);
    expect(report.valid).toBe(true);
    expect(report.summary?.disagree).toEqual([declared[0].id]);
    expect(report.summary?.notSingleAnswer).toEqual([declared[1].id]);
    expect(report.summary?.revise).toEqual([declared[2].id]);
    expect(report.summary?.difficultyDiffers.map((d) => d.id)).toEqual([declared[3].id]);
  });

  it("rejects the generator's own provider however it is spelled", () => {
    for (const reviewer of [
      { provider: "anthropic", model: "x" }, { provider: "Anthropic", model: "claude-opus-5-5" }, { provider: "openai", model: "Claude Opus 5.5" },
    ]) {
      const base = response();
      const report = checkScholarshipExternalResponse({ ...base, reviewer: { ...base.reviewer, ...reviewer } }, manifest, declared);
      expect(report.valid, JSON.stringify(reviewer)).toBe(false);
      expect(report.problems.join(" ")).toMatch(/different provider/);
    }
  });

  it("rejects a review of different content, a stale packet hash, missing, extra and duplicate items", () => {
    const base = response();
    expect(checkScholarshipExternalResponse({ ...base, reviewer: { ...base.reviewer, packetSha256: "0".repeat(64) } }, manifest, declared).problems.join(" ")).toMatch(/packetSha256/);
    expect(checkScholarshipExternalResponse(response({}, (i) => { i.pop(); }), manifest, declared).valid).toBe(false);
    expect(checkScholarshipExternalResponse(response({}, (i) => { i.push({ ...i[0] }); }), manifest, declared).problems.join(" ")).toMatch(/more than once/);
    expect(checkScholarshipExternalResponse(response({}, (i) => { i[0].id = "scholarship-y6-vr-999"; }), manifest, declared).problems.join(" ")).toMatch(/not in the packet|missing/);
  });

  it("rejects a response that does not claim a fresh session or has an unknown field", () => {
    const base = response();
    expect(checkScholarshipExternalResponse({ ...base, reviewer: { ...base.reviewer, freshSession: false } }, manifest, declared).valid).toBe(false);
    expect(checkScholarshipExternalResponse({ ...base, extra: 1 }, manifest, declared).valid).toBe(false);
    expect(checkScholarshipExternalResponse("not json", manifest, declared).valid).toBe(false);
  });
});

describe("requeue of quarantined judgement candidates", () => {
  function repo(record: unknown, moveOk = true) {
    const moves: [string, string, string][] = [];
    const repository = {
      read: async (compartment: string) => (compartment === "quarantined" ? record : undefined),
      move: async (id: string, from: string, to: string) => { moves.push([id, from, to]); return moveOk ? { ok: true } : { ok: false, message: "locked" }; },
    } as unknown as FactoryRepository;
    return { repository, moves };
  }

  it("moves only a quarantined candidate that is still at correctness_check_passed", async () => {
    const { repository, moves } = repo({ state: "correctness_check_passed" });
    expect(await requeueQuarantinedForExternalReview("scholarship-y6-vr-001", repository)).toEqual({ outcome: "requeued", candidateId: "scholarship-y6-vr-001" });
    expect(moves).toEqual([["scholarship-y6-vr-001", "quarantined", "review-queue"]]);
  });

  it("refuses anything else and moves nothing", async () => {
    for (const record of [undefined, { state: "rejected" }, { state: "needs_revision" }, { state: "semantic_review_passed" }]) {
      const { repository, moves } = repo(record);
      expect((await requeueQuarantinedForExternalReview("scholarship-y6-vr-001", repository)).outcome).toBe("refused");
      expect(moves).toEqual([]);
    }
    expect((await requeueQuarantinedForExternalReview("scholarship-y6-vr-001", repo({ state: "correctness_check_passed" }, false).repository)).outcome).toBe("refused");
  });
});
