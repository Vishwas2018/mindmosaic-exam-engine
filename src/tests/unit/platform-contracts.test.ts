import { describe, expect, it } from "vitest";

import {
  assessmentBlueprintCellSchema,
  assessmentBlueprintVersionSchema,
  assessmentProfileVersionSchema,
  frameworkVersionSchema,
  localeSchema,
  PLATFORM_VERSION_KINDS,
  platformVersionSchema,
  programmeOfferingRefSchema,
  resolvedAssessmentProfileSchema,
  runtimeContentVersionSchema,
  stableIdSchema,
  type AssessmentBlueprintVersion,
  type AssessmentProfileVersion,
  type FrameworkVersion,
  type RuntimeContentVersion,
} from "@/schemas/platform";
import { YEAR_LEVELS } from "@/features/taxonomy/year-registry";

/**
 * Phase 0 Zod contracts (spec §10, §21 Phase 0).
 *
 * These schemas have no database behind them and no application importer yet,
 * which is precisely why they need tests: nothing else exercises them, so an
 * unnoticed mistake would sit here until Phase 1 built on it. The cases below
 * concentrate on the rules that are load-bearing for later phases rather than
 * on field-by-field coverage — the discriminator and schema version §10.1
 * requires, the absence of answer material from learner-visible content, the
 * cross-object agreement a session's pinned profile depends on, and the
 * internal consistency a blueprint has to have before capacity means anything.
 */

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

const offering = {
  family: "icas_style",
  programmeId: "icas-mathematics",
  subjectId: "numeracy",
  yearLevel: 5,
  locale: "en-AU",
} as const;

function contentVersion(overrides: Record<string, unknown> = {}): unknown {
  return {
    kind: "runtime_content_version",
    schemaVersion: 1,
    itemId: "b4f0c2e6-1a3d-4c5b-9e7f-0a1b2c3d4e5f",
    itemCode: "g5-icas-math-b01-008",
    revision: 1,
    questionType: "multiple_choice",
    prompt: "Which team scored more than twice Blue's score but fewer than 20 points?",
    candidateContent: { options: [{ id: "a", text: "Red" }] },
    visuals: [],
    accessibility: {
      altTextProvided: true,
      answerableFromAccessibleRepresentation: true,
    },
    estimatedTimeSeconds: 50,
    authoredDifficulty: "easy",
    marksAvailable: 1,
    locale: "en-AU",
    contentSchemaVersion: 1,
    contentHash: HASH_A,
    provenance: {
      manifestId: "manifest-0001",
      manifestSchemaVersion: 2,
      factoryCandidateState: "published",
      correctnessBasis: "deterministic",
      publishedAt: "2026-08-01T00:00:00.000Z",
    },
    scopes: [offering],
    skills: [],
    ...overrides,
  };
}

function framework(overrides: Record<string, unknown> = {}): unknown {
  return {
    kind: "framework_version",
    schemaVersion: 1,
    frameworkId: "fixed-standard",
    revision: 1,
    label: "Fixed-path standard sitting",
    deliveryMode: "fixed_path",
    stages: [{ stageId: "main", ordinal: 0, label: "Main", sealOnComplete: false }],
    navigation: {
      allowBacktrackWithinStage: true,
      allowBacktrackAcrossStages: false,
      allowFlagForReview: true,
      allowSkip: true,
    },
    timing: {
      mode: "timed",
      totalSeconds: 2400,
      perStageSeconds: {},
      lateSubmissionGraceSeconds: 300,
    },
    submission: {
      allowManualSubmit: true,
      autoSubmitOnExpiry: true,
      requireAllAnswered: false,
    },
    scoring: {
      algorithmId: "build-exam-result",
      algorithmVersion: 1,
      negativeMarking: false,
      partialCredit: true,
      manualReviewAffectsRouting: false,
    },
    supportedQuestionTypes: ["multiple_choice", "number_entry"],
    tools: { calculator: false, scratchpad: true, formulaSheet: false, dictionary: false },
    ...overrides,
  };
}

function blueprint(overrides: Record<string, unknown> = {}): unknown {
  return {
    kind: "assessment_blueprint_version",
    schemaVersion: 1,
    blueprintId: "icas-math-y5",
    revision: 1,
    label: "ICAS-style Mathematics Year 5",
    cells: [
      {
        cellId: "number",
        stageId: "main",
        subjectId: "numeracy",
        difficultyBand: "easy",
        stimulusRequirement: "any",
        scoringEligibility: "machine",
        itemCount: 18,
        marks: 18,
        estimatedTimeSeconds: 900,
      },
      {
        cellId: "data",
        stageId: "main",
        subjectId: "numeracy",
        difficultyBand: "medium",
        stimulusRequirement: "required",
        scoringEligibility: "machine",
        itemCount: 12,
        marks: 12,
        estimatedTimeSeconds: 900,
      },
    ],
    totalItems: 30,
    totalMarks: 30,
    ...overrides,
  };
}

function profile(overrides: Record<string, unknown> = {}): unknown {
  return {
    kind: "assessment_profile_version",
    schemaVersion: 1,
    profileId: "icas-math-y5-standard",
    revision: 1,
    label: "ICAS-style Mathematics Year 5 — standard",
    offering,
    frameworkId: "fixed-standard",
    frameworkRevision: 1,
    blueprintId: "icas-math-y5",
    blueprintRevision: 1,
    deliveryMode: "fixed_path",
    durationSeconds: 2400,
    scoringAlgorithmId: "build-exam-result",
    scoringAlgorithmVersion: 1,
    availability: "available",
    ...overrides,
  };
}

describe("shared primitives", () => {
  it("accepts BCP-47 locale tags and rejects free text", () => {
    for (const tag of ["en", "en-AU", "en-GB", "zh-Hans", "zh-Hans-CN"]) {
      expect(localeSchema.safeParse(tag).success).toBe(true);
    }
    for (const notATag of ["English", "en_AU", "EN-au", "", "en-australia"]) {
      expect(localeSchema.safeParse(notATag).success).toBe(false);
    }
  });

  it("keeps stable identifiers lowercase and segmented", () => {
    for (const id of ["numeracy", "icas-mathematics", "lang.prod.grammar", "year_5"]) {
      expect(stableIdSchema.safeParse(id).success).toBe(true);
    }
    for (const bad of ["Numeracy", "icas mathematics", "-leading", "trailing-", ""]) {
      expect(stableIdSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("takes its year range from the registry, not a second list", () => {
    /* `programmeOfferingRefSchema` reuses `yearLevelSchema` (ADR-001 §1), so
       every registry year parses and nothing outside it does. */
    for (const year of YEAR_LEVELS) {
      expect(programmeOfferingRefSchema.safeParse({ ...offering, yearLevel: year }).success).toBe(
        true,
      );
    }
    for (const notAYear of [0, 13, 4.5, "5"]) {
      expect(
        programmeOfferingRefSchema.safeParse({ ...offering, yearLevel: notAYear }).success,
      ).toBe(false);
    }
  });
});

describe("runtime content version", () => {
  it("parses a projected published item", () => {
    const parsed = runtimeContentVersionSchema.parse(contentVersion()) as RuntimeContentVersion;
    expect(parsed.kind).toBe("runtime_content_version");
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.scopes[0].locale).toBe("en-AU");
  });

  it("refuses answer material in learner-visible content", () => {
    /* The single most important property of this schema (spec §9.3, ADR-003
       §4): answers live in a separate table with no privileges, so an answer
       key appearing here at all is a projection bug, not a stray field. */
    for (const leak of ["answerKey", "rubric", "explanation", "gradingRules"]) {
      const result = runtimeContentVersionSchema.safeParse(
        contentVersion({ [leak]: { kind: "single_option", optionId: "a" } }),
      );
      expect(result.success, `${leak} must be rejected`).toBe(false);
    }
  });

  it("refuses a non-published factory state", () => {
    /* Only `published` may produce a runtime row (spec §9.7, ADR-002 §4). */
    for (const state of ["staged", "needs_revision", "rejected", "quarantined", "archived"]) {
      const result = runtimeContentVersionSchema.safeParse(
        contentVersion({
          provenance: {
            ...(contentVersion() as { provenance: Record<string, unknown> }).provenance,
            factoryCandidateState: state,
          },
        }),
      );
      expect(result.success, `${state} must not project`).toBe(false);
    }
  });

  it("has no locale-variant container — locale is a version axis", () => {
    /* ADR-001 §5 / ADR-003 §3. A translated question is a distinct version
       scoped to the locale-specific offering, so any structure holding two
       locales' content in one row must fail to parse. */
    for (const shape of [
      { translations: { "en-GB": { prompt: "…" } } },
      { localeVariants: [{ locale: "en-GB", prompt: "…" }] },
    ]) {
      expect(runtimeContentVersionSchema.safeParse(contentVersion(shape)).success).toBe(false);
    }
    /* The supported shape: same item, second version, different locale/hash. */
    const enGb = runtimeContentVersionSchema.parse(
      contentVersion({ revision: 2, locale: "en-GB", contentHash: HASH_B }),
    ) as RuntimeContentVersion;
    const enAu = runtimeContentVersionSchema.parse(contentVersion()) as RuntimeContentVersion;
    expect(enGb.itemId).toBe(enAu.itemId);
    expect(enGb.contentHash).not.toBe(enAu.contentHash);
  });

  it("requires at least one offering scope and a well-formed content hash", () => {
    expect(runtimeContentVersionSchema.safeParse(contentVersion({ scopes: [] })).success).toBe(
      false,
    );
    expect(
      runtimeContentVersionSchema.safeParse(contentVersion({ contentHash: "not-a-hash" })).success,
    ).toBe(false);
  });
});

describe("framework version", () => {
  it("parses a fixed-path framework", () => {
    const parsed = frameworkVersionSchema.parse(framework()) as FrameworkVersion;
    expect(parsed.deliveryMode).toBe("fixed_path");
    expect(parsed.stages).toHaveLength(1);
  });

  it("ties adaptive routing to adaptive delivery in both directions", () => {
    expect(
      frameworkVersionSchema.safeParse(framework({ deliveryMode: "adaptive_mst" })).success,
    ).toBe(false);

    const routing = {
      itemsPerStage: { routing: 8, upper: 10 },
      routes: [
        { fromStageId: "routing", toStageId: "upper", minProportionCorrect: 0.6, maxProportionCorrect: 1 },
      ],
      abilityReporting: "banded",
    };
    expect(frameworkVersionSchema.safeParse(framework({ adaptiveRouting: routing })).success).toBe(
      false,
    );

    const adaptive = frameworkVersionSchema.safeParse(
      framework({
        deliveryMode: "adaptive_mst",
        stages: [
          { stageId: "routing", ordinal: 0, label: "Routing", sealOnComplete: true },
          { stageId: "upper", ordinal: 1, label: "Upper", sealOnComplete: true },
        ],
        adaptiveRouting: routing,
      }),
    );
    expect(adaptive.success).toBe(true);
  });

  it("rejects a route to an undeclared stage and an empty score band", () => {
    const base = {
      deliveryMode: "adaptive_mst",
      stages: [
        { stageId: "routing", ordinal: 0, label: "Routing", sealOnComplete: true },
        { stageId: "upper", ordinal: 1, label: "Upper", sealOnComplete: true },
      ],
    };
    expect(
      frameworkVersionSchema.safeParse(
        framework({
          ...base,
          adaptiveRouting: {
            itemsPerStage: { routing: 8 },
            routes: [
              { fromStageId: "routing", toStageId: "ghost", minProportionCorrect: 0, maxProportionCorrect: 1 },
            ],
            abilityReporting: "banded",
          },
        }),
      ).success,
    ).toBe(false);

    expect(
      frameworkVersionSchema.safeParse(
        framework({
          ...base,
          adaptiveRouting: {
            itemsPerStage: { routing: 8 },
            routes: [
              { fromStageId: "routing", toStageId: "upper", minProportionCorrect: 0.9, maxProportionCorrect: 0.4 },
            ],
            abilityReporting: "banded",
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("requires a duration for a timed sitting and rejects unknown config keys", () => {
    expect(
      frameworkVersionSchema.safeParse(
        framework({ timing: { mode: "timed", totalSeconds: null, perStageSeconds: {}, lateSubmissionGraceSeconds: 300 } }),
      ).success,
    ).toBe(false);
    /* §10.1 forbids unvalidated arbitrary JSON; `.strict()` is how that is
       enforced rather than asserted. */
    expect(frameworkVersionSchema.safeParse(framework({ someFutureKnob: true })).success).toBe(
      false,
    );
  });

  it("forbids manual-review items influencing routing", () => {
    const scoring = (framework() as { scoring: Record<string, unknown> }).scoring;
    expect(
      frameworkVersionSchema.safeParse(
        framework({ scoring: { ...scoring, manualReviewAffectsRouting: true } }),
      ).success,
    ).toBe(false);
  });
});

describe("assessment blueprint version", () => {
  it("parses a counted blueprint whose cells add up", () => {
    const parsed = assessmentBlueprintVersionSchema.parse(blueprint()) as AssessmentBlueprintVersion;
    expect(parsed.cells).toHaveLength(2);
    expect(parsed.totalItems).toBe(30);
  });

  it("requires exactly one of itemCount or proportion per cell", () => {
    const cell = {
      cellId: "c1",
      stageId: "main",
      subjectId: "numeracy",
      marks: 10,
      estimatedTimeSeconds: 600,
    };
    expect(assessmentBlueprintCellSchema.safeParse(cell).success).toBe(false);
    expect(assessmentBlueprintCellSchema.safeParse({ ...cell, itemCount: 10 }).success).toBe(true);
    expect(assessmentBlueprintCellSchema.safeParse({ ...cell, proportion: 0.5 }).success).toBe(true);
    expect(
      assessmentBlueprintCellSchema.safeParse({ ...cell, itemCount: 10, proportion: 0.5 }).success,
    ).toBe(false);
  });

  it("rejects totals that disagree with the cells", () => {
    expect(assessmentBlueprintVersionSchema.safeParse(blueprint({ totalItems: 40 })).success).toBe(
      false,
    );
    expect(assessmentBlueprintVersionSchema.safeParse(blueprint({ totalMarks: 40 })).success).toBe(
      false,
    );
  });

  it("rejects a mixture of counted and proportional cells", () => {
    const cells = (blueprint() as { cells: Record<string, unknown>[] }).cells;
    const mixed = [cells[0], { ...cells[1], itemCount: undefined, proportion: 0.4 }];
    expect(assessmentBlueprintVersionSchema.safeParse(blueprint({ cells: mixed })).success).toBe(
      false,
    );
  });

  it("requires proportions to sum to one, with float tolerance", () => {
    const proportional = (over: readonly number[]) =>
      blueprint({
        cells: over.map((proportion, index) => ({
          cellId: `c${index}`,
          stageId: "main",
          subjectId: "numeracy",
          proportion,
          marks: 10,
          estimatedTimeSeconds: 300,
        })),
        totalItems: 30,
        totalMarks: 10 * over.length,
      });
    expect(assessmentBlueprintVersionSchema.safeParse(proportional([0.3, 0.3, 0.4])).success).toBe(
      true,
    );
    expect(assessmentBlueprintVersionSchema.safeParse(proportional([0.3, 0.3])).success).toBe(false);
  });

  it("rejects a cell that forbids stimuli but asks for reading comprehension", () => {
    expect(
      assessmentBlueprintCellSchema.safeParse({
        cellId: "c1",
        stageId: "main",
        subjectId: "reading",
        questionTypes: ["reading_comprehension"],
        stimulusRequirement: "forbidden",
        itemCount: 5,
        marks: 5,
        estimatedTimeSeconds: 300,
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate cell ids", () => {
    const cells = (blueprint() as { cells: Record<string, unknown>[] }).cells;
    expect(
      assessmentBlueprintVersionSchema.safeParse(
        blueprint({ cells: [cells[0], { ...cells[1], cellId: "number" }] }),
      ).success,
    ).toBe(false);
  });
});

describe("assessment profile version", () => {
  it("parses an available profile", () => {
    const parsed = assessmentProfileVersionSchema.parse(profile()) as AssessmentProfileVersion;
    expect(parsed.availability).toBe("available");
    expect(parsed.offering.yearLevel).toBe(5);
  });

  it("pairs withdrawal with a withdrawal timestamp, both ways", () => {
    expect(assessmentProfileVersionSchema.safeParse(profile({ availability: "withdrawn" })).success).toBe(
      false,
    );
    expect(
      assessmentProfileVersionSchema.safeParse(
        profile({ availability: "withdrawn", withdrawnAt: "2026-08-01T00:00:00.000Z" }),
      ).success,
    ).toBe(true);
    expect(
      assessmentProfileVersionSchema.safeParse(
        profile({ withdrawnAt: "2026-08-01T00:00:00.000Z" }),
      ).success,
    ).toBe(false);
  });

  it("pins framework and blueprint by revision, not by id alone", () => {
    /* Spec §10.3: a session references the exact profile version, which must in
       turn pin exact framework/blueprint revisions. A missing revision is a
       "current version" reference in disguise. */
    const withoutRevision: Record<string, unknown> = { ...(profile() as Record<string, unknown>) };
    delete withoutRevision.frameworkRevision;
    expect(assessmentProfileVersionSchema.safeParse(withoutRevision).success).toBe(false);
  });
});

describe("the composed contract", () => {
  it("parses a profile with the framework and blueprint it pins", () => {
    const resolved = resolvedAssessmentProfileSchema.safeParse({
      profile: profile(),
      framework: framework(),
      blueprint: blueprint(),
    });
    expect(resolved.success).toBe(true);
  });

  it("catches a profile pinning a different framework revision", () => {
    expect(
      resolvedAssessmentProfileSchema.safeParse({
        profile: profile({ frameworkRevision: 2 }),
        framework: framework(),
        blueprint: blueprint(),
      }).success,
    ).toBe(false);
  });

  it("catches a delivery-mode disagreement between profile and framework", () => {
    expect(
      resolvedAssessmentProfileSchema.safeParse({
        profile: profile({ deliveryMode: "adaptive_mst" }),
        framework: framework(),
        blueprint: blueprint(),
      }).success,
    ).toBe(false);
  });

  it("catches a scoring-algorithm disagreement", () => {
    expect(
      resolvedAssessmentProfileSchema.safeParse({
        profile: profile({ scoringAlgorithmVersion: 2 }),
        framework: framework(),
        blueprint: blueprint(),
      }).success,
    ).toBe(false);
  });

  it("catches a blueprint cell in a stage the framework does not declare", () => {
    const cells = (blueprint() as { cells: Record<string, unknown>[] }).cells;
    expect(
      resolvedAssessmentProfileSchema.safeParse({
        profile: profile(),
        framework: framework(),
        blueprint: blueprint({ cells: [cells[0], { ...cells[1], stageId: "ghost" }] }),
      }).success,
    ).toBe(false);
  });
});

describe("the platform version union", () => {
  it("round-trips every declared kind", () => {
    const samples = [contentVersion(), framework(), blueprint(), profile()];
    const kinds = samples.map((sample) => {
      const parsed = platformVersionSchema.parse(sample);
      return parsed.kind;
    });
    expect(kinds.sort()).toEqual([...PLATFORM_VERSION_KINDS].sort());
  });

  it("gives every kind a discriminator and a schema version (§10.1)", () => {
    for (const sample of [contentVersion(), framework(), blueprint(), profile()]) {
      const parsed = platformVersionSchema.parse(sample);
      expect(PLATFORM_VERSION_KINDS).toContain(parsed.kind);
      expect(parsed.schemaVersion).toBe(1);
    }
  });

  it("rejects an unknown kind and a future schema version", () => {
    expect(platformVersionSchema.safeParse({ kind: "form_version", schemaVersion: 1 }).success).toBe(
      false,
    );
    expect(platformVersionSchema.safeParse(framework({ schemaVersion: 2 })).success).toBe(false);
  });
});
