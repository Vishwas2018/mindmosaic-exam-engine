import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { factoryPublishedQuestions } from "@/content/questions/generated";
import { publishedExamBank } from "@/content/questions/practice-bank";
import { questionBank } from "@/content/questions/question-bank";
import {
  ANSWER_BEARING_FIELDS,
  buildProjectionPlan,
  contentHashOf,
  findAnswerLeaks,
  itemIdOf,
  loadPublishedManifests,
  projectQuestion,
  type ProjectionPlan,
} from "@/features/content-projection";
import { publicationProvenanceSchema, runtimeContentVersionSchema } from "@/schemas/platform";
import type { Question } from "@/schemas/question.schema";

/**
 * Phase 1 exit gate, source side (spec §21 Phase 1, §9; ADR-002/003).
 *
 * The projection has two halves: build the rows, and write them. This file
 * proves the first half exhaustively against the REAL 1,293-item bank and the
 * REAL 288 manifests, with no database anywhere — so the part of the exit gate
 * that is a statement about content is verified in `npm test` on every commit,
 * not only when a Postgres happens to be running.
 *
 * The database half (`tests/rls/runtime-content.test.ts` plus
 * `scripts/shadow-compare-runtime-content.mts --live`) proves the rows land and
 * that no learner role can reach the answer table. Both are needed; neither
 * substitutes for the other.
 */

/* Fixed so a re-run cannot churn `published_at` on 1,005 curated rows. */
const CURATED_PUBLISHED_AT = "2026-08-12T00:00:00.000Z";

let cached: ProjectionPlan | undefined;

async function plan(): Promise<ProjectionPlan> {
  if (cached) return cached;
  const { manifests, rejected } = await loadPublishedManifests();
  expect(rejected, "no manifest may fail the factory's own review-evidence rules").toEqual([]);
  cached = buildProjectionPlan({
    questions: publishedExamBank,
    manifests,
    factoryQuestionIds: new Set(factoryPublishedQuestions.map((question) => question.id)),
    curatedPublishedAt: CURATED_PUBLISHED_AT,
  });
  return cached;
}

describe("projection plan — the exit-gate counts", () => {
  it("projects every published item exactly once, with no problems", async () => {
    const result = await plan();
    /* Reported first: a count assertion that fails without saying why is the
       least useful failure this suite can produce. */
    expect(result.problems).toEqual([]);
    expect(result.counts.total).toBe(publishedExamBank.length);
    expect(result.counts.total).toBe(1293);
    expect(result.counts.curated).toBe(1005);
    expect(result.counts.factory).toBe(288);
  });

  it("splits the two pools exactly as the banks do", async () => {
    const result = await plan();
    const curatedIds = new Set(questionBank.map((question) => question.id));
    const factoryIds = new Set(factoryPublishedQuestions.map((question) => question.id));

    for (const item of result.items) {
      const expected = factoryIds.has(item.itemCode)
        ? "factory_manifest"
        : "curated_git_authored";
      expect(item.provenanceClass, item.itemCode).toBe(expected);
      if (expected === "curated_git_authored") {
        expect(curatedIds.has(item.itemCode), item.itemCode).toBe(true);
      }
    }
  });

  it("ties provenance_class and manifest id together in both directions", async () => {
    const result = await plan();
    for (const item of result.items) {
      if (item.provenanceClass === "factory_manifest") {
        /* ADR-002 Amendment A2 — the same rule the database check constraint
           `item_versions_manifest_matches_provenance` enforces. Asserted here
           too so a plan that could never insert fails in the fast suite. */
        expect(item.publicationManifestId, item.itemCode).not.toBeNull();
      } else {
        expect(item.publicationManifestId, item.itemCode).toBeNull();
      }
    }
  });

  it("claims every manifest and invents none", async () => {
    const result = await plan();
    const claimed = result.items
      .map((item) => item.publicationManifestId)
      .filter((id): id is string => id !== null);
    expect(new Set(claimed).size).toBe(claimed.length);
    expect(claimed.length).toBe(result.manifests.length);
    expect(result.manifests.length).toBe(288);
  });
});

describe("content hashes", () => {
  it("gives all 1,293 items a distinct hash", async () => {
    const result = await plan();
    const hashes = new Set(result.items.map((item) => item.contentHash));
    expect(hashes.size).toBe(result.items.length);
  });

  it("recomputes identically from the bank — the shadow-compare's basis", async () => {
    const result = await plan();
    const byCode = new Map(result.items.map((item) => [item.itemCode, item]));
    for (const question of publishedExamBank) {
      expect(byCode.get(question.id)?.contentHash, question.id).toBe(contentHashOf(question));
    }
  });

  it("changes when learner-visible content changes", async () => {
    const [question] = publishedExamBank;
    const edited = { ...question, prompt: `${question.prompt} ` } as Question;
    expect(contentHashOf(edited)).not.toBe(contentHashOf(question));
  });

  it("is stable under key reordering", () => {
    const [question] = publishedExamBank;
    const reordered = Object.fromEntries(
      Object.entries(question as unknown as Record<string, unknown>).reverse(),
    ) as unknown as Question;
    expect(contentHashOf(reordered)).toBe(contentHashOf(question));
  });

  it("derives a stable, valid item id from the item code", async () => {
    const result = await plan();
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    for (const item of result.items) {
      expect(item.itemId, item.itemCode).toMatch(uuid);
      expect(itemIdOf(item.itemCode)).toBe(item.itemId);
    }
    expect(new Set(result.items.map((item) => item.itemId)).size).toBe(result.items.length);
  });
});

describe("candidate/answer separation (§9.3)", () => {
  it("leaks no answer material into any candidate row", async () => {
    const result = await plan();
    const offenders: string[] = [];
    for (const item of result.items) {
      const leaks = findAnswerLeaks(item.candidate);
      if (leaks.length > 0) offenders.push(`${item.itemCode}: ${leaks.join(", ")}`);
      /* The top-level shape too — `.strict()` covers it, but an explicit
         assertion names the failure rather than reporting a parse error. */
      for (const field of ANSWER_BEARING_FIELDS) {
        expect(item.candidate, item.itemCode).not.toHaveProperty(field);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("carries the answer key and private explanation into the answer half", async () => {
    const result = await plan();
    const byCode = new Map(result.items.map((item) => [item.itemCode, item]));
    for (const question of publishedExamBank) {
      const item = byCode.get(question.id);
      expect(item?.answer.answerKey, question.id).toEqual(question.answerKey);
      expect(item?.answer.privateExplanation, question.id).toBe(question.explanation ?? null);
    }
  });

  it("detects a leak that .strict() cannot see", () => {
    /* `candidateContent` is a `z.record` by necessity — interaction shapes vary
       by question type — so a nested answer key would pass the schema. This is
       what `findAnswerLeaks` exists for. */
    const leaks = findAnswerLeaks({
      questionType: "multiple_choice",
      answerKind: "single_option",
      minWords: null,
      maxWords: null,
      prompt: "p",
      candidateContent: { interaction: { type: "dropdown", answerKey: "a" } },
      visuals: [],
      accessibility: { altTextProvided: true, answerableFromAccessibleRepresentation: true },
      estimatedTimeSeconds: 30,
      authoredDifficulty: "easy",
      marksAvailable: 1,
      locale: "en-AU",
      contentSchemaVersion: 1,
    });
    expect(leaks).toEqual(["candidateContent.interaction.answerKey"]);
  });
});

describe("stimulus deduplication (§9.4)", () => {
  it("collapses shared passages to one version each", async () => {
    const result = await plan();
    expect(result.counts.withStimulus).toBe(237);
    expect(result.counts.distinctStimuli).toBe(85);
    /* The saving is the point: 237 embedded copies become 85 rows. */
    expect(result.counts.distinctStimuli).toBeLessThan(result.counts.withStimulus);
  });

  it("gives each distinct passage exactly one code and one hash", async () => {
    const result = await plan();
    expect(new Set(result.stimuli.map((s) => s.contentHash)).size).toBe(result.stimuli.length);
    expect(new Set(result.stimuli.map((s) => s.stimulusCode)).size).toBe(result.stimuli.length);
    expect(new Set(result.stimuli.map((s) => s.stimulusId)).size).toBe(result.stimuli.length);
  });

  it("pins every stimulus-bearing item to a stimulus that exists", async () => {
    const result = await plan();
    const ids = new Set(result.stimuli.map((s) => s.stimulusId));
    for (const item of result.items) {
      if (item.stimulus) {
        expect(item.stimulusId, item.itemCode).not.toBeNull();
        expect(ids.has(item.stimulusId as string), item.itemCode).toBe(true);
      } else {
        expect(item.stimulusId, item.itemCode).toBeNull();
      }
    }
  });

  it("records who shares each passage, and shares at least one widely", async () => {
    const result = await plan();
    const shared = result.stimuli.filter((s) => s.usedBy.length > 1);
    expect(shared.length).toBe(54);
    expect(Math.max(...result.stimuli.map((s) => s.usedBy.length))).toBe(15);
    const totalUses = result.stimuli.reduce((sum, s) => sum + s.usedBy.length, 0);
    expect(totalUses).toBe(result.counts.withStimulus);
  });
});

describe("the platform contract", () => {
  it("validates every projected item against runtime-content-version.schema", async () => {
    const result = await plan();
    for (const item of result.items) {
      /* `projectQuestion` already parses; re-parsing the stored contract proves
         the object that would be written is the object that was validated. */
      expect(runtimeContentVersionSchema.safeParse(item.contract).success, item.itemCode).toBe(
        true,
      );
    }
  });

  it("records honestly that no manifest carries a verifiable chain", async () => {
    const result = await plan();
    const kinds = new Map<string, number>();
    for (const manifest of result.manifests) {
      kinds.set(manifest.reviewEvidenceKind, (kinds.get(manifest.reviewEvidenceKind) ?? 0) + 1);
    }

    /*
     * Every manifest is schemaVersion 1 and NONE carries a reviewRecords chain,
     * so verifyReviewChain cannot run on any of them. 62 have evidence rescued
     * from ingest artefacts (self-declaring verifiability: "none"); the other
     * 226 have none at all and say so.
     *
     * The 62 independently reproduces the figure publication/manifest-schema.ts
     * records from the 2026-07-30 audit — a useful cross-check that this loader
     * reads these files the way the factory does.
     *
     * Pinned rather than asserted loosely so that publishing the first v2
     * manifest shows up here as a deliberate change instead of drifting past.
     */
    expect(kinds.get("verified_chain") ?? 0).toBe(0);
    expect(kinds.get("recovered_unverifiable")).toBe(62);
    expect(kinds.get("none")).toBe(226);
    expect(result.manifests.every((m) => m.manifestSchemaVersion === 1)).toBe(true);
    /* Absent on every manifest — which is why the contract makes it optional
       rather than forcing the projection to invent one. */
    expect(result.manifests.every((m) => m.correctnessBasis === undefined)).toBe(true);
  });

  it("refuses a curated provenance that claims a manifest", () => {
    /* ADR-002 Amendment A2, at the contract level: the discriminated union is
       what makes "curated, no manifest by design" and "factory, manifest
       missing" different objects rather than one shape with a null. Asserted
       against the schema directly, because `projectQuestion` builds provenance
       itself and so cannot be handed a malformed one. */
    expect(
      publicationProvenanceSchema.safeParse({
        provenanceClass: "curated_git_authored",
        governedBy: "scripts/validate-question-bank.mts",
        publishedAt: CURATED_PUBLISHED_AT,
        manifestId: "man-should-not-be-here",
      }).success,
    ).toBe(false);

    expect(
      publicationProvenanceSchema.safeParse({
        provenanceClass: "factory_manifest",
        manifestId: "man-0001",
        manifestSchemaVersion: 1,
        factoryCandidateState: "published",
        reviewEvidenceKind: "recovered_unverifiable",
        publishedAt: CURATED_PUBLISHED_AT,
      }).success,
    ).toBe(true);

    /* Only `published` may project (spec §9.7, ADR-002 §4). */
    expect(
      publicationProvenanceSchema.safeParse({
        provenanceClass: "factory_manifest",
        manifestId: "man-0001",
        manifestSchemaVersion: 1,
        factoryCandidateState: "staged",
        reviewEvidenceKind: "recovered_unverifiable",
        publishedAt: CURATED_PUBLISHED_AT,
      }).success,
    ).toBe(false);
  });

  it("builds a curated provenance with no manifest for a curated question", () => {
    const [question] = questionBank;
    const projected = projectQuestion(question, {
      itemId: itemIdOf(question.id),
      source: { provenanceClass: "curated_git_authored", publishedAt: CURATED_PUBLISHED_AT },
    });
    expect(projected.publicationManifestId).toBeNull();
    expect(projected.contract.provenance).toEqual({
      provenanceClass: "curated_git_authored",
      governedBy: "scripts/validate-question-bank.mts",
      publishedAt: CURATED_PUBLISHED_AT,
    });
    expect(projected.contract.scopes[0]?.region).toBe("global");
  });
});

describe("revision provenance round-trips verbatim (Gate A item A12)", () => {
  /* external review #4: load-manifests.ts used to floor every manifest's
     revision to at least 1 before it ever reached the plan, silently
     rewriting the 195 manifests that record revision 0 for a first
     publication. This proves the split holds: publication_manifests.revision
     (source_revision, verbatim, 0 included) is a different value from
     item_versions.revision (runtime_revision, 1-based by contract), and
     fixing the second must never mean corrupting the first again. */
  it("preserves manifest revision 0 for exactly the 195 manifests that record it", async () => {
    const { manifests } = await loadPublishedManifests();
    const revisionZero = manifests.filter((manifest) => manifest.revision === 0);
    expect(revisionZero.length).toBe(195);
    expect(manifests.every((manifest) => Number.isInteger(manifest.revision))).toBe(true);
  });

  it("floors item_versions.revision to 1 for those same 195 items, without touching the manifest", async () => {
    const result = await plan();
    const byManifestId = new Map(result.manifests.map((manifest) => [manifest.id, manifest]));
    const revisionZeroManifestIds = new Set(
      result.manifests.filter((manifest) => manifest.revision === 0).map((manifest) => manifest.id),
    );
    expect(revisionZeroManifestIds.size).toBe(195);

    const projectedFromRevisionZero = result.items.filter(
      (item) => item.publicationManifestId !== null && revisionZeroManifestIds.has(item.publicationManifestId),
    );
    expect(projectedFromRevisionZero.length).toBe(195);
    for (const item of projectedFromRevisionZero) {
      /* The runtime row is 1-based (the contract requires it)... */
      expect(item.revision, item.itemCode).toBe(1);
      /* ...while the manifest this item cites is untouched at 0. */
      expect(byManifestId.get(item.publicationManifestId as string)?.revision, item.itemCode).toBe(0);
    }
  });

  it("preserves reviewBoundRevision 0 inside review evidence for exactly the 33 bindings that record it", async () => {
    const { manifests } = await loadPublishedManifests();
    const boundToRevisionZero = manifests.filter((manifest) =>
      (manifest.reviewEvidence as readonly { reviewBoundRevision?: unknown }[]).some(
        (entry) => entry.reviewBoundRevision === 0,
      ),
    );
    expect(boundToRevisionZero.length).toBe(33);
  });
});

describe("the plan refuses to write when the source is wrong", () => {
  const base = {
    manifests: [],
    factoryQuestionIds: new Set<string>(),
    curatedPublishedAt: CURATED_PUBLISHED_AT,
  };

  it("reports a duplicate item code rather than projecting it twice", () => {
    const [question] = questionBank;
    const result = buildProjectionPlan({ ...base, questions: [question, question] });
    expect(result.counts.total).toBe(1);
    expect(result.problems.join()).toContain("duplicate item code");
  });

  it("reports a factory question with no manifest", () => {
    const [question] = questionBank;
    const result = buildProjectionPlan({
      ...base,
      questions: [question],
      factoryQuestionIds: new Set([question.id]),
    });
    expect(result.counts.total).toBe(0);
    expect(result.problems.join()).toContain("no published manifest");
  });

  it("reports a manifest that projects nothing", async () => {
    const { manifests } = await loadPublishedManifests();
    const result = buildProjectionPlan({ ...base, questions: [], manifests: [manifests[0]] });
    expect(result.problems.join()).toContain("projects nothing");
  });

  it("reports a content-hash collision instead of dropping a row silently", () => {
    const [question] = questionBank;
    /* The same content published under two codes. Because the hash excludes
       the id, these collide — which is exactly what
       `item_versions_content_hash_key` would reject at insert time, so the
       plan must refuse before it gets there rather than let one row vanish
       into a constraint violation mid-run. */
    const twin = { ...question, id: `${question.id}-twin` } as Question;
    const result = buildProjectionPlan({ ...base, questions: [question, twin] });
    expect(result.counts.total).toBe(1);
    expect(result.problems.join()).toContain("content-hash collision");
  });
});
