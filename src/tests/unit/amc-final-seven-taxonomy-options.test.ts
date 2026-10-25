import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { afterAll, describe, expect, it, vi } from "vitest";

import type { TaxonomyEntry } from "@/features/question-factory/taxonomy/types";

/**
 * y5-028 and y5-006 taxonomy options, tested against IN-MEMORY taxonomies.
 *
 * Each scenario re-imports the real taxonomy registry with a modified entry
 * list (`vi.doMock` of the entries module). The registry therefore still runs
 * its own `validateTaxonomyEntries` on the modified list, and the preflight
 * still calls the real `validateBlueprint`; nothing is bypassed or stubbed.
 * The draft files, the entries file, the hash pins, the approvals and the
 * exclusions are never written. A "simulated taxonomy correction" here is
 * evidence about behaviour, not a change anyone has reviewed or adopted.
 *
 * The y5-028 variant is the owner-selectable "Option C" classification
 * (Logic & Problem-Solving, "Systematic counting", number_entry). It exists
 * only as an in-memory copy of the draft.
 */

const DRAFT_FILE = "content/roadmap-drafts/amc-y5-draft.json" as const;
const Y5_028 = "roadmap-amc-y5-028";
const Y5_006 = "roadmap-amc-y5-006";
const Y5_015 = "roadmap-amc-y5-015";

const SYSTEMATIC_COUNTING = "amc.systematic-counting";
const SIMPLE_SCALE_ID = "amc.use-a-simple-scale";

type Transform = (entries: readonly TaxonomyEntry[]) => readonly TaxonomyEntry[];

const addNumberEntryToSystematicCounting: Transform = (entries) =>
  entries.map((entry) =>
    entry.id === SYSTEMATIC_COUNTING ? { ...entry, recommendedQuestionTypes: [...entry.recommendedQuestionTypes, "number_entry"] } : entry,
  );

const simpleScaleEntry: TaxonomyEntry = {
  id: SIMPLE_SCALE_ID,
  displayName: "Use a simple scale",
  aliases: ["Use a simple scale"],
  yearLevels: [5],
  examStyles: ["amc_style"],
  subject: "amc_mathematics",
  strand: "Measurement & Geometry",
  prerequisites: [],
  recommendedQuestionTypes: ["multiple_choice"],
  recommendedVisualTypes: [],
  supportedDifficulties: ["easy"],
  curriculumNotes: ["AMC-style reasoning skill; original practice content, not an official AMC question."],
  generationConstraints: [],
};
const addSimpleScale: Transform = (entries) => [...entries, simpleScaleEntry];

// Remedy B placeholder: the label is illustrative; the owner would have to name the real skill.
const dedicatedCountingEntry: TaxonomyEntry = {
  ...simpleScaleEntry,
  id: "amc.count-combinations-systematically",
  displayName: "Count combinations systematically",
  aliases: ["Count combinations systematically"],
  strand: "Logic & Problem-Solving",
  recommendedQuestionTypes: ["number_entry"],
  supportedDifficulties: ["challenging"],
};
const addDedicatedCounting: Transform = (entries) => [...entries, dedicatedCountingEntry];

// Remedy C as written: keep the label "Systematic counting" on a second, number_entry entry.
const addSameLabelEntry: Transform = (entries) => [
  ...entries,
  { ...dedicatedCountingEntry, id: "amc.systematic-counting-number-entry", displayName: "Systematic counting", aliases: ["Systematic counting"] },
];

// A deliberately wrong type, to prove a question-type mismatch is never ready.
const numberEntryOnlyScale: Transform = (entries) => [...entries, { ...simpleScaleEntry, recommendedQuestionTypes: ["number_entry"] }];

async function loadScenario(transform: Transform) {
  vi.resetModules();
  vi.doMock("@/features/question-factory/taxonomy/entries", async (importOriginal) => {
    const original = await importOriginal<typeof import("@/features/question-factory/taxonomy/entries")>();
    return { ...original, SKILL_TAXONOMY_ENTRIES: transform(original.SKILL_TAXONOMY_ENTRIES) };
  });
  const lib = await import("../../../scripts/lib/amc-final-seven-intake.mjs");
  const sources = await import("../../../scripts/lib/amc-review-sources.mjs");
  const intakeBlueprint = await import("../../../scripts/lib/amc-intake-blueprint.mjs");
  const taxonomy = await import("@/features/question-factory/taxonomy");
  const checks = await import("@/features/question-factory/validation/taxonomy-checks");
  const blueprints = await import("@/features/question-factory/blueprints");
  const candidate = await import("@/features/question-factory/ingestion/candidate-question");
  const world = await lib.loadFinalSevenIntakeWorld();
  return { lib, sources, intakeBlueprint, taxonomy, checks, blueprints, candidate, world };
}
type Scenario = Awaited<ReturnType<typeof loadScenario>>;

type DraftShape = { metadata: { strand: string; skill: string }; type: string };

/** The Option C classification of y5-028, as an in-memory copy of the draft. */
function optionCDraft(s: Scenario): unknown {
  const copy = structuredClone(s.world.rawDrafts.get(Y5_028)) as DraftShape;
  copy.metadata.strand = "Logic & Problem-Solving";
  copy.metadata.skill = "Systematic counting";
  return copy;
}

/** A world in which y5-028 is replaced by the Option C copy and its hashes are recomputed. */
function worldWithOptionC(s: Scenario) {
  const variant = optionCDraft(s);
  const target = s.sources.buildAmcReviewTarget(variant, DRAFT_FILE);
  return {
    variant,
    target,
    world: {
      ...s.world,
      rawDrafts: new Map(s.world.rawDrafts).set(Y5_028, variant),
      targets: s.world.targets.map((entry) => (entry.question.id === Y5_028 ? target : entry)),
    },
  };
}

const codes = (s: Scenario, world: Scenario["world"], id: string): string[] =>
  s.lib.evaluateFinalSevenIntake(world, { ids: [id] }).results.flatMap((result) => result.blockers.map((b) => b.code));

const TAXONOMY_CODES = ["taxonomy_skill_unresolvable", "taxonomy_mismatch", "question_type_not_recommended", "blueprint_unbuildable"];

const baseline = await loadScenario((entries) => entries);
const typeAFix = await loadScenario(addNumberEntryToSystematicCounting);
const withScale = await loadScenario(addSimpleScale);
const dedicated = await loadScenario(addDedicatedCounting);
afterAll(() => vi.resetModules());

describe("y5-028 Option C against the current taxonomy", () => {
  it("resolves and passes the structural taxonomy check, so only the question type is wrong", () => {
    const candidate = baseline.candidate.candidateQuestionSchema.parse(optionCDraft(baseline));
    expect(baseline.taxonomy.skillTaxonomyRegistry.resolve("Systematic counting")?.id).toBe(SYSTEMATIC_COUNTING);
    expect(baseline.checks.checkTaxonomy(candidate)).toEqual([]);
    expect(baseline.taxonomy.skillTaxonomyRegistry.get(SYSTEMATIC_COUNTING)?.recommendedQuestionTypes).toEqual(["multiple_choice"]);
  });

  it("is rejected by validateBlueprint with question_type_not_recommended_for_skill", () => {
    const candidate = baseline.candidate.candidateQuestionSchema.parse(optionCDraft(baseline));
    let message = "";
    try {
      baseline.intakeBlueprint.amcIntakeBlueprint(candidate);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("question_type_not_recommended_for_skill");
    expect(message).toContain("number_entry");
  });

  it("is reported as a named question-type blocker and is never ready", () => {
    const { world } = worldWithOptionC(baseline);
    const found = codes(baseline, world, Y5_028);
    expect(found).toEqual(expect.arrayContaining(["question_type_not_recommended", "blueprint_unbuildable"]));
    expect(found).not.toContain("taxonomy_skill_unresolvable");
    expect(found).not.toContain("taxonomy_mismatch");
    expect(baseline.lib.evaluateFinalSevenIntake(world, { ids: [Y5_028] }).ready).toBe(false);
    const readiness = baseline.lib.evaluateAllDraftReadiness(world).find((row) => row.questionId === Y5_028)!;
    expect(readiness.taxonomy).toBe("question_type_incompatible");
    expect(readiness.blueprint).toBe("unbuildable");
  });

  it("produces the Option C hashes recorded in intake-preflight.md", () => {
    const { target } = worldWithOptionC(baseline);
    expect(target.source.sourceQuestionHash).toBe("9211116d5f5fc502e48bdb7005bcb6a150ac5c2a017001245081b78e4f3b809b");
    expect(target.source.contentHash).toBe("4ca0370da7e1bc2e6949ed4df1f4c1156175e7125028727e683da01f56747728");
    expect(target.sourceManifestHash).toBe("f00249b651f4a93e2d4f87f359ff5111e8d8076000a19c5ff23c6d0e8f5f6592");
  });
});

describe("remedy A: add number_entry to amc.systematic-counting (in-memory)", () => {
  it("changes exactly one taxonomy entry, and only its recommended question types", () => {
    const before = new Map(baseline.taxonomy.skillTaxonomyRegistry.list().map((entry) => [entry.id, JSON.stringify(entry)]));
    const after = typeAFix.taxonomy.skillTaxonomyRegistry.list();
    expect(after).toHaveLength(before.size);
    const changed = after.filter((entry) => before.get(entry.id) !== JSON.stringify(entry));
    expect(changed.map((entry) => entry.id)).toEqual([SYSTEMATIC_COUNTING]);
    expect({ ...changed[0], recommendedQuestionTypes: ["multiple_choice"] }).toEqual(baseline.taxonomy.skillTaxonomyRegistry.get(SYSTEMATIC_COUNTING));
    expect(changed[0].recommendedQuestionTypes).toEqual(["multiple_choice", "number_entry"]);
  });

  it("clears every taxonomy and blueprint blocker for Option C, and nothing else", () => {
    const { world } = worldWithOptionC(typeAFix);
    const report = typeAFix.lib.evaluateFinalSevenIntake(world, { ids: [Y5_028] });
    const found = report.results[0].blockers.map((b) => b.code);
    for (const code of TAXONOMY_CODES) expect(found, code).not.toContain(code);
    expect(report.results[0].facts.blueprint).toBe("would_create");
    // What remains is the separately authorised work: re-pin, exclusion lift, human approval.
    expect(found).toEqual(expect.arrayContaining(["registry_hash_mismatch", "attestation_failed", "excluded_from_review", "approval_missing"]));
    expect(report.ready).toBe(false);
  });

  it("still cannot produce a write plan, because those blockers remain", () => {
    const { world } = worldWithOptionC(typeAFix);
    const report = typeAFix.lib.evaluateFinalSevenIntake(world, { ids: [Y5_028] });
    expect(() => typeAFix.lib.describeFinalSevenWrites(world, report)).toThrow(/blockers/);
  });

  it("keeps published y5-015 compatible, with its committed blueprint unchanged", () => {
    for (const scenario of [baseline, typeAFix]) {
      const draft = scenario.world.rawDrafts.get(Y5_015);
      const derived = scenario.intakeBlueprint.amcIntakeBlueprint(scenario.candidate.candidateQuestionSchema.parse(draft));
      const onDisk = JSON.parse(readFileSync(path.join(process.cwd(), "content/question-factory/blueprints/amc-y5-015-seed-001.json"), "utf8"));
      expect(JSON.parse(JSON.stringify(derived))).toEqual(onDisk);
      expect(scenario.blueprints.validateBlueprint(scenario.blueprints.blueprintSchema.parse(onDisk)).valid).toBe(true);
    }
  });
});

describe("remedy B: a dedicated number_entry entry with its own label (in-memory)", () => {
  it("adds one entry and leaves amc.systematic-counting untouched", () => {
    expect(dedicated.taxonomy.skillTaxonomyRegistry.list()).toHaveLength(baseline.taxonomy.skillTaxonomyRegistry.list().length + 1);
    expect(dedicated.taxonomy.skillTaxonomyRegistry.get(SYSTEMATIC_COUNTING)).toEqual(baseline.taxonomy.skillTaxonomyRegistry.get(SYSTEMATIC_COUNTING));
  });

  it("makes a differently labelled y5-028 buildable, but this is not the Option C label", () => {
    const copy = structuredClone(dedicated.world.rawDrafts.get(Y5_028)) as DraftShape;
    copy.metadata.strand = "Logic & Problem-Solving";
    copy.metadata.skill = "Count combinations systematically";
    const candidate = dedicated.candidate.candidateQuestionSchema.parse(copy);
    expect(dedicated.checks.checkTaxonomy(candidate)).toEqual([]);
    expect(() => dedicated.intakeBlueprint.amcIntakeBlueprint(candidate)).not.toThrow();
    // Option C's own label still resolves to the multiple-choice entry, so it is still a mismatch here.
    const optionC = dedicated.candidate.candidateQuestionSchema.parse(optionCDraft(dedicated));
    expect(() => dedicated.intakeBlueprint.amcIntakeBlueprint(optionC)).toThrow(/question_type_not_recommended_for_skill/);
  });
});

describe("remedy C: a second entry that keeps the label 'Systematic counting'", () => {
  it("is refused by the registry's own validation (alias collision), so it cannot be registered", async () => {
    await expect(loadScenario(addSameLabelEntry)).rejects.toThrow(/Skill taxonomy registry failed validation[\s\S]*Systematic counting/);
  });
});

describe("y5-006 Option A: register 'Use a simple scale' (in-memory)", () => {
  it("collides with no existing taxonomy id or alias, and the modified registry still validates", () => {
    expect(baseline.taxonomy.skillTaxonomyRegistry.get(SIMPLE_SCALE_ID)).toBeUndefined();
    expect(baseline.taxonomy.skillTaxonomyRegistry.resolve("Use a simple scale")).toBeUndefined();
    expect(withScale.taxonomy.validateTaxonomyEntries(withScale.taxonomy.SKILL_TAXONOMY_ENTRIES)).toEqual({ valid: true, issues: [] });
    expect(withScale.taxonomy.skillTaxonomyRegistry.resolve("Use a simple scale")?.id).toBe(SIMPLE_SCALE_ID);
    expect(withScale.taxonomy.skillTaxonomyRegistry.list()).toHaveLength(baseline.taxonomy.skillTaxonomyRegistry.list().length + 1);
  });

  it("makes the unchanged draft taxonomy-ready and blueprint-buildable, with no other entry affected", () => {
    const candidate = withScale.candidate.candidateQuestionSchema.parse(withScale.world.rawDrafts.get(Y5_006));
    expect(withScale.checks.checkTaxonomy(candidate)).toEqual([]);
    expect(() => withScale.intakeBlueprint.amcIntakeBlueprint(candidate)).not.toThrow();
    const found = codes(withScale, withScale.world, Y5_006);
    for (const code of [...TAXONOMY_CODES, "registry_hash_mismatch", "attestation_failed"]) expect(found, code).not.toContain(code);
    // Remaining: the exclusion and the human approval only.
    expect([...found].sort()).toEqual(["approval_missing", "excluded_from_review"]);
  });

  it("keeps the source, content and manifest hashes unchanged and equal to the committed registry row", () => {
    const row = (JSON.parse(readFileSync(path.join(process.cwd(), "content/review-sources/amc/y5.json"), "utf8")) as { questionId: string; sourceQuestionHash: string; contentHash: string }[]).find(
      (entry) => entry.questionId === Y5_006,
    )!;
    for (const scenario of [baseline, withScale]) {
      const target = scenario.world.targets.find((entry) => entry.question.id === Y5_006)!;
      expect(target.source.sourceQuestionHash).toBe(row.sourceQuestionHash);
      expect(target.source.contentHash).toBe(row.contentHash);
      expect(target.sourceManifestHash).toBe("fca56d70fea3730fd4dfb72ed73de60faabeb99479ab90fd9dd02f2a8953709d");
    }
    expect(row.sourceQuestionHash).toBe("93b739d8908781b715ed3f7b884deff7c96a079309e2940bb51555bfecc357f0");
    expect(row.contentHash).toBe("5e813e503db1533f1058b8f0db776fccc7979eba852dc167619acffe1238b02e");
  });

  it("produces a blueprint that equals what the preflight would plan, but no write plan while blockers remain", () => {
    const report = withScale.lib.evaluateFinalSevenIntake(withScale.world, { ids: [Y5_006] });
    expect(report.ready).toBe(false);
    expect(() => withScale.lib.describeFinalSevenWrites(withScale.world, report)).toThrow(/blockers/);
  });
});

describe("taxonomy strand names versus the learner-facing subject registry", () => {
  it("is not enforced at intake: live AMC questions already use strands the subject registry does not list", async () => {
    const { isKnownStrandLabel } = await import("@/features/taxonomy/subject-registry");
    const { amcPublishedQuestions } = await import("@/content/questions/generated/amc-index");
    expect(isKnownStrandLabel("amc_mathematics", "Measurement & Geometry", "amc_style")).toBe(false);
    expect(isKnownStrandLabel("amc_mathematics", "Geometry & Measurement", "amc_style")).toBe(true);
    const live = amcPublishedQuestions.filter((question) => question.metadata.strand === "Measurement & Geometry");
    expect(live.length).toBeGreaterThan(0);
  });

  it("is not used by any AMC exam pattern (only language patterns filter by strand)", () => {
    const registry = readFileSync(path.join(process.cwd(), "src/features/exam-engine/exam-patterns/exam-pattern-registry.ts"), "utf8");
    const filters = [...registry.matchAll(/strandIn:\s*([^\n]+)/g)].map((match) => match[1]);
    expect(filters.length).toBeGreaterThan(0);
    for (const filter of filters) expect(filter).not.toMatch(/Measurement|Geometry|Logic/);
  });
});

describe("a question-type mismatch can never be reported as intake-ready", () => {
  it("blocks y5-006 when its only matching entry recommends the wrong type, even with a synthetic approval and no exclusion", async () => {
    const wrongType = await loadScenario(numberEntryOnlyScale);
    const target = wrongType.world.targets.find((entry) => entry.question.id === Y5_006)!;
    const facts = {
      kind: "human_publication_approval" as const,
      schemaVersion: 1 as const,
      questionId: Y5_006,
      revision: target.source.revision,
      approvedBy: "SYNTHETIC TEST ONLY",
      approvedAt: "2026-01-01T00:00:00.000Z",
      contentHash: target.source.contentHash,
      sourceManifestHash: target.sourceManifestHash,
      checks: { correctness: true as const, originality: true as const, ageAppropriateness: true as const },
      question: target.question,
    };
    const { approvalFingerprint } = await import("@/features/content-governance/publication-integrity");
    const approval = { ...facts, fingerprint: approvalFingerprint(facts) };
    const world = { ...wrongType.world, approvals: new Map([[Y5_006, approval]]), exclusions: {} };
    const report = wrongType.lib.evaluateFinalSevenIntake(world, { ids: [Y5_006] });
    const found = report.results[0].blockers.map((b) => b.code);
    expect(found).toEqual(expect.arrayContaining(["question_type_not_recommended", "blueprint_unbuildable"]));
    expect(report.ready).toBe(false);
    expect(() => wrongType.lib.describeFinalSevenWrites(world, report)).toThrow(/blockers/);
  });
});

describe("existing published AMC questions are unaffected by either taxonomy change", () => {
  const servedIds = [...baseline.world.servedBankIds];

  it("serves exactly the 53 published questions in every scenario", () => {
    for (const scenario of [baseline, typeAFix, withScale, dedicated]) expect(scenario.world.servedBankIds.size).toBe(53);
    expect(servedIds).toHaveLength(53);
  });

  it("keeps each published question's committed blueprint valid and its resolved skill entry the same", () => {
    const baselineSkill = new Map<string, string>();
    for (const id of servedIds) {
      const file = path.join(process.cwd(), "content/question-factory/blueprints", `${id.replace("roadmap-", "")}-seed-001.json`);
      expect(existsSync(file), id).toBe(true);
      const blueprint = baseline.blueprints.blueprintSchema.parse(JSON.parse(readFileSync(file, "utf8")));
      baselineSkill.set(id, baseline.taxonomy.skillTaxonomyRegistry.resolveOrThrow(blueprint.skill).id);
      expect(baseline.blueprints.validateBlueprint(blueprint).valid, id).toBe(true);
    }
    for (const scenario of [typeAFix, withScale, dedicated]) {
      for (const id of servedIds) {
        const file = path.join(process.cwd(), "content/question-factory/blueprints", `${id.replace("roadmap-", "")}-seed-001.json`);
        const blueprint = scenario.blueprints.blueprintSchema.parse(JSON.parse(readFileSync(file, "utf8")));
        expect(scenario.blueprints.validateBlueprint(blueprint).valid, id).toBe(true);
        expect(scenario.taxonomy.skillTaxonomyRegistry.resolveOrThrow(blueprint.skill).id, id).toBe(baselineSkill.get(id));
      }
    }
  });

  it("keeps hashing independent of the taxonomy, so no hash or manifest can move with it", () => {
    for (const file of ["src/features/content-governance/publication-integrity.ts", "src/features/question-factory/provenance/content-hash.ts"]) {
      expect(readFileSync(path.join(process.cwd(), file), "utf8"), file).not.toMatch(/taxonomy/i);
    }
  });
});
