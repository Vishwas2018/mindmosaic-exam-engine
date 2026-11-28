import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  FINAL_SEVEN_IDS,
  describeFinalSevenWrites,
  evaluateAllDraftReadiness,
  evaluateFinalSevenIntake,
  loadFinalSevenIntakeWorld,
  type BlockerCode,
  type ExpectedHashes,
  type IntakeWorld,
} from "../../../scripts/lib/amc-final-seven-intake.mjs";
import { approvalFingerprint } from "@/features/content-governance/publication-integrity";

/**
 * The seven-ID intake preflight is READ-ONLY. These tests prove that it fails
 * closed on every unsafe condition and that it can never produce a write plan
 * for a blocked question.
 *
 * Two kinds of test:
 *  - "baseline" tests read the real repository and pin today's blockers. They
 *    are meant to change, visibly in review, when a governed decision lands
 *    (a classification, an exclusion lift, an approval).
 *  - "unsafe condition" tests start from an in-memory world in which ONE
 *    question has been made otherwise ready, using a SYNTHETIC approval that
 *    exists only inside the test process. It is never written anywhere and
 *    is not evidence of any real approval.
 */

const world = await loadFinalSevenIntakeWorld();
const TARGET_ID = "roadmap-amc-y3-005"; // the cleanest of the seven: taxonomy ok, blueprint present
const OTHER_ID = "roadmap-amc-y3-026";

const codes = (id: string, w: IntakeWorld, ids: readonly string[] = [id], expected?: readonly ExpectedHashes[]): BlockerCode[] =>
  evaluateFinalSevenIntake(w, { ids, expected }).results.flatMap((result) => result.blockers.map((b) => b.code));

/** A world where TARGET_ID has a (synthetic, in-memory) valid approval and no exclusion. */
function readyWorld(overrides: Partial<IntakeWorld> = {}): IntakeWorld {
  const target = world.targets.find((entry) => entry.question.id === TARGET_ID)!;
  const facts = {
    kind: "human_publication_approval" as const,
    schemaVersion: 1 as const,
    questionId: TARGET_ID,
    revision: target.source.revision,
    approvedBy: "SYNTHETIC TEST ONLY",
    approvedAt: "2026-01-01T00:00:00.000Z",
    contentHash: target.source.contentHash,
    sourceManifestHash: target.sourceManifestHash,
    checks: { correctness: true as const, originality: true as const, ageAppropriateness: true as const },
    question: target.question,
  };
  const approval = { ...facts, fingerprint: approvalFingerprint(facts) };
  return { ...world, approvals: new Map([[TARGET_ID, approval]]), exclusions: {}, ...overrides };
}

describe("baseline: the real repository today", () => {
  const report = evaluateFinalSevenIntake(world);
  const byId = new Map(report.results.map((result) => [result.questionId, result]));
  const blockerCodes = (id: string): string[] => byId.get(id)!.blockers.map((b) => b.code);

  it("covers exactly the seven allow-listed IDs and performs no writes", () => {
    expect(FINAL_SEVEN_IDS).toHaveLength(7);
    expect(report.results.map((r) => r.questionId)).toEqual([...FINAL_SEVEN_IDS]);
    expect(report.mode).toBe("dry-run");
    expect(report.writesPerformed).toBe(0);
    expect(report.rejectedIds).toEqual([]);
  });

  it("is not ready, and none of the seven is ready", () => {
    expect(report.ready).toBe(false);
    for (const result of report.results) expect(result.ready, result.questionId).toBe(false);
  });

  it("no longer reports taxonomy, blueprint or hash blockers for y5-006 and y5-028 after the adopted taxonomy changes", () => {
    for (const id of ["roadmap-amc-y5-006", "roadmap-amc-y5-028"]) {
      const codes = blockerCodes(id);
      for (const code of ["taxonomy_skill_unresolvable", "taxonomy_mismatch", "question_type_not_recommended", "blueprint_unbuildable", "registry_hash_mismatch", "attestation_failed"]) {
        expect(codes, `${id} ${code}`).not.toContain(code);
      }
    }
  });

  it("reports the two stale committed blueprints, which are never overwritten", () => {
    for (const id of ["roadmap-amc-y3-016", "roadmap-amc-y5-019"]) {
      expect(blockerCodes(id), id).toContain("blueprint_stale");
    }
  });

  it("detects each stale blueprint for the stated reason, and is the only blueprint source of truth it trusts", () => {
    const expectations: Record<string, { disk: [string, number]; derived: [string, number] }> = {
      "roadmap-amc-y3-016": { disk: ["medium", 3], derived: ["easy", 1] },
      "roadmap-amc-y5-019": { disk: ["easy", 1], derived: ["medium", 3] },
    };
    for (const [id, expected] of Object.entries(expectations)) {
      const blueprintId = `${id.replace("roadmap-", "")}-seed-001`;
      const onDisk = world.blueprintsOnDisk.get(blueprintId) as { difficulty: string; reasoningSteps: number };
      expect([onDisk.difficulty, onDisk.reasoningSteps], `${id} on disk`).toEqual(expected.disk);
      const draft = world.rawDrafts.get(id) as { metadata: { difficulty: string } };
      const derivedSteps = draft.metadata.difficulty === "challenging" ? 5 : draft.metadata.difficulty === "medium" ? 3 : 1;
      expect([draft.metadata.difficulty, derivedSteps], `${id} derived`).toEqual(expected.derived);
      expect(blockerCodes(id), id).toContain("blueprint_stale");
    }
  });

  it("keeps the three exclusions and the approval gate in force", () => {
    for (const id of ["roadmap-amc-y3-014", "roadmap-amc-y5-006", "roadmap-amc-y5-028"]) {
      expect(blockerCodes(id), id).toContain("excluded_from_review");
    }
    for (const id of FINAL_SEVEN_IDS) expect(blockerCodes(id), id).toContain("approval_missing");
  });

  it("finds none of the seven published or already ingested", () => {
    for (const id of FINAL_SEVEN_IDS) {
      expect(blockerCodes(id), id).not.toContain("already_published");
      expect(blockerCodes(id), id).not.toContain("already_ingested");
      expect(world.servedBankIds.has(id), id).toBe(false);
      expect(world.publishedManifestIds.has(id), id).toBe(false);
    }
  });

  it("leaves the served AMC baseline at 26 Year 3 and 27 Year 5 questions", () => {
    const ids = [...world.servedBankIds];
    expect(ids).toHaveLength(53);
    expect(ids.filter((id) => id.includes("-y3-"))).toHaveLength(26);
    expect(ids.filter((id) => id.includes("-y5-"))).toHaveLength(27);
  });

  it("finds all 60 drafts ready for taxonomy and blueprint", () => {
    const readiness = evaluateAllDraftReadiness(world);
    expect(readiness).toHaveLength(60);
    const notReady = readiness.filter((row) => row.taxonomy !== "ok" || row.blueprint !== "ok").map((row) => row.questionId);
    expect(notReady).toEqual([]);
  });
});

describe("unsafe conditions fail closed", () => {
  it("accepts a question only once every gate is satisfied (and plans only blueprint and inbox writes)", () => {
    const w = readyWorld();
    const report = evaluateFinalSevenIntake(w, { ids: [TARGET_ID] });
    expect(report.results[0].blockers).toEqual([]);
    expect(report.ready).toBe(true);
    const writes = describeFinalSevenWrites(w, report);
    for (const write of writes) {
      expect(write.path).toMatch(/^content\/question-factory\/(blueprints|inbox\/amc-reviewed)\//);
      expect(write.path).not.toMatch(/staged|published|approval|manifest|bank|generated/);
    }
    expect(writes.some((write) => write.kind === "create_inbox_file")).toBe(true);
  });

  it("refuses to plan writes while any blocker exists", () => {
    expect(() => describeFinalSevenWrites(world, evaluateFinalSevenIntake(world))).toThrow(/blockers/);
    expect(() => describeFinalSevenWrites(world, evaluateFinalSevenIntake(world, { ids: [TARGET_ID] }))).toThrow(/blockers/);
  });

  it("rejects unexpected and duplicate IDs without evaluating them", () => {
    const report = evaluateFinalSevenIntake(readyWorld(), { ids: [TARGET_ID, "roadmap-amc-y3-001", TARGET_ID] });
    expect(report.rejectedIds.map((r) => r.code).sort()).toEqual(["duplicate_id", "id_not_allowed"]);
    expect(report.results).toHaveLength(1);
    expect(report.ready).toBe(false);
  });

  it("rejects an empty request", () => {
    expect(evaluateFinalSevenIntake(readyWorld(), { ids: [] }).ready).toBe(false);
  });

  it("blocks a draft that is missing", () => {
    const rawDrafts = new Map(world.rawDrafts);
    rawDrafts.delete(TARGET_ID);
    expect(codes(TARGET_ID, readyWorld({ rawDrafts }))).toContain("draft_missing");
  });

  it("blocks a stale registry binding", () => {
    const registryRows = world.registryRows.map((row) => (row.questionId === TARGET_ID ? { ...row, contentHash: "0".repeat(64) } : row));
    expect(codes(TARGET_ID, readyWorld({ registryRows }))).toContain("registry_hash_mismatch");
    expect(codes(TARGET_ID, readyWorld({ registryRows: [] }))).toContain("registry_row_missing");
  });

  it("blocks a draft edited after its hashes were pinned (attestation)", () => {
    const raw = structuredClone(world.rawDrafts.get(TARGET_ID)) as { prompt: string };
    raw.prompt += " (edited)";
    const rawDrafts = new Map(world.rawDrafts).set(TARGET_ID, raw);
    expect(codes(TARGET_ID, readyWorld({ rawDrafts }))).toContain("attestation_failed");
  });

  it("blocks when the supplied expected-hash manifest is missing the ID or disagrees", () => {
    const target = world.targets.find((entry) => entry.question.id === TARGET_ID)!;
    const pin: ExpectedHashes = {
      questionId: TARGET_ID,
      revision: target.source.revision,
      sourceQuestionHash: target.source.sourceQuestionHash,
      contentHash: target.source.contentHash,
      sourceManifestHash: target.sourceManifestHash,
    };
    const w = readyWorld();
    expect(codes(TARGET_ID, w, [TARGET_ID], [pin])).toEqual([]);
    expect(codes(TARGET_ID, w, [TARGET_ID], [])).toContain("expected_hash_missing");
    expect(codes(TARGET_ID, w, [TARGET_ID], [{ ...pin, contentHash: "f".repeat(64) }])).toContain("expected_hash_mismatch");
    expect(codes(TARGET_ID, w, [TARGET_ID], [{ ...pin, revision: 2 }])).toContain("expected_hash_mismatch");
  });

  it("blocks a skill that resolves to nothing, and never maps it to a similar skill", () => {
    const raw = structuredClone(world.rawDrafts.get(TARGET_ID)) as { metadata: { skill: string } };
    raw.metadata.skill = "Divisibility and remainder";
    const rawDrafts = new Map(world.rawDrafts).set(TARGET_ID, raw);
    expect(codes(TARGET_ID, readyWorld({ rawDrafts }))).toEqual(expect.arrayContaining(["taxonomy_skill_unresolvable", "blueprint_unbuildable"]));
  });

  it("blocks a skill that resolves but disagrees on strand, year or subject", () => {
    const raw = structuredClone(world.rawDrafts.get(TARGET_ID)) as { metadata: { strand: string } };
    raw.metadata.strand = "Statistics & Chance";
    const rawDrafts = new Map(world.rawDrafts).set(TARGET_ID, raw);
    expect(codes(TARGET_ID, readyWorld({ rawDrafts }))).toContain("taxonomy_mismatch");

    const wrongYear = structuredClone(world.rawDrafts.get(TARGET_ID)) as { yearLevel: number };
    wrongYear.yearLevel = 5;
    expect(codes(TARGET_ID, readyWorld({ rawDrafts: new Map(world.rawDrafts).set(TARGET_ID, wrongYear) }))).toContain("taxonomy_mismatch");
  });

  it("blocks a blueprint on disk that differs from the one derived (never overwritten)", () => {
    const id = `${TARGET_ID.replace("roadmap-", "")}-seed-001`;
    const onDisk = { ...(world.blueprintsOnDisk.get(id) as object), difficulty: "challenging" };
    expect(codes(TARGET_ID, readyWorld({ blueprintsOnDisk: new Map([[id, onDisk]]) }))).toContain("blueprint_stale");
  });

  it("blocks anything already published or already ingested", () => {
    expect(codes(TARGET_ID, readyWorld({ servedBankIds: new Set([TARGET_ID]) }))).toContain("already_published");
    expect(codes(TARGET_ID, readyWorld({ publishedManifestIds: new Set([TARGET_ID]) }))).toContain("already_published");
    expect(
      codes(TARGET_ID, readyWorld({ factoryPaths: new Map([[TARGET_ID, [`inbox/amc-reviewed/${TARGET_ID}/${TARGET_ID}.json`]]]) })),
    ).toContain("already_ingested");
  });

  it("blocks while the code exclusion is active", () => {
    expect(codes(TARGET_ID, readyWorld({ exclusions: { [TARGET_ID]: "test exclusion" } }))).toContain("excluded_from_review");
  });

  it("blocks without a valid exact-revision human approval", () => {
    expect(codes(TARGET_ID, readyWorld({ approvals: new Map() }))).toContain("approval_missing");

    const good = readyWorld().approvals.get(TARGET_ID) as Record<string, unknown>;
    expect(codes(TARGET_ID, readyWorld({ approvals: new Map([[TARGET_ID, { ...good, fingerprint: "a".repeat(64) }]]) }))).toContain("approval_invalid");
    expect(codes(TARGET_ID, readyWorld({ approvals: new Map([[TARGET_ID, { ...good, revision: 2 }]]) }))).toContain("approval_invalid");
    expect(codes(TARGET_ID, readyWorld({ approvals: new Map([[TARGET_ID, { not: "an approval" }]]) }))).toContain("approval_invalid");
  });

  it("does not let one question's approval satisfy another", () => {
    const w = readyWorld();
    const borrowed = new Map([[OTHER_ID, w.approvals.get(TARGET_ID)]]);
    expect(codes(OTHER_ID, readyWorld({ approvals: borrowed, exclusions: {} }))).toContain("approval_invalid");
  });
});

describe("the mechanism cannot write", () => {
  const sources = ["scripts/lib/amc-final-seven-intake.mts", "scripts/amc-final-seven-intake-preflight.mts"].map((file) => ({
    file,
    text: readFileSync(path.join(process.cwd(), file), "utf8"),
  }));

  it("imports and calls no write, spawn or network API", () => {
    for (const { file, text } of sources) {
      expect(text, file).not.toMatch(/\b(writeFile|appendFile|mkdir|rmSync|rm|unlink|rename|copyFile|createWriteStream|spawn|spawnSync|exec|execSync|fork|fetch)\s*\(/);
      expect(text, file).not.toMatch(/from ["']node:(child_process|http|https|net)["']/);
      expect(text, file).not.toMatch(/questions-(ingest|stage|publish|assemble)|content-approvals|record-approval/);
    }
  });

  it("leaves the repository untouched when the CLI runs, and refuses --execute and unknown flags", () => {
    const snapshot = (): string => JSON.stringify(["blueprints", "inbox", "published-manifests", "reports"].map((dir) => readdirSync(path.join(process.cwd(), "content/question-factory", dir)).length));
    const before = snapshot();
    const run = (...args: string[]) =>
      spawnSync(process.execPath, ["--import", "tsx", "scripts/amc-final-seven-intake-preflight.mts", ...args], { encoding: "utf8", cwd: process.cwd() });
    expect(run("--execute").status).toBe(2);
    expect(run("--write").status).toBe(2);
    expect(run("--ids", "roadmap-amc-y3-001").status).toBe(3);
    const normal = run();
    expect(normal.status).toBe(3);
    expect(normal.stdout).toContain("writes performed: 0");
    expect(snapshot()).toBe(before);
  }, 120_000);
});
