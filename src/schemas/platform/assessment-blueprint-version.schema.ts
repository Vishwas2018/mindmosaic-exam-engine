import { z } from "zod";

import { questionTypeSchema } from "@/schemas/question.schema";

import {
  difficultyBandSchema,
  revisionSchema,
  schemaVersionSchema,
  scoringEligibilitySchema,
  stableIdSchema,
} from "./common";

/**
 * Assessment blueprint version — what an assessment measures (spec §10.2).
 *
 * **Naming.** This is NOT the question factory's `blueprints/` module. That one
 * is a *generation* blueprint: the instruction set for producing one question
 * (`src/features/question-factory/blueprints/schema.ts` — one skill, one
 * difficulty, one question type, a target count). This is an *assessment*
 * blueprint: the measurement specification for a whole paper, decomposed into
 * cells. The two are unrelated and the collision is real, which is why
 * everything here is prefixed `assessmentBlueprint*`. ADR-004 owns resolving
 * the naming properly if the two ever need to meet.
 *
 * A cell must define a count or a proportion, plus explicit matching
 * constraints (spec §10.2). Both are modelled because a fixed-length paper
 * naturally specifies counts while an adaptive stage naturally specifies
 * proportions; exactly one is required per cell.
 */

export const assessmentBlueprintCellSchema = z
  .object({
    cellId: stableIdSchema,

    /* Where in the paper this cell applies. `stageId` matches a framework
       version's stage; a single-stage fixed-path paper uses one stage. */
    sectionId: stableIdSchema.optional(),
    stageId: stableIdSchema,

    /* What it selects (spec §10.2's required query axes). */
    subjectId: stableIdSchema,
    strandId: stableIdSchema.optional(),
    skillNodeId: stableIdSchema.optional(),
    difficultyBand: difficultyBandSchema.optional(),
    questionTypes: z.array(questionTypeSchema).min(1).optional(),
    cognitiveDemand: z.enum(["recall", "apply", "analyse", "evaluate"]).optional(),
    /**
     * `required` means every item in this cell must carry a stimulus (a reading
     * passage, a data table); `forbidden` means none may. `any` is the default
     * and states no constraint — spelled out rather than left undefined so a
     * blueprint author has to make the choice.
     */
    stimulusRequirement: z.enum(["required", "forbidden", "any"]).default("any"),
    scoringEligibility: scoringEligibilitySchema.default("machine"),

    /* How much of it. Exactly one of the two — see superRefine below. */
    itemCount: z.number().int().positive().max(200).optional(),
    proportion: z.number().gt(0).max(1).optional(),

    marks: z.number().int().positive().max(200),
    estimatedTimeSeconds: z.number().int().positive().max(86_400),
  })
  .strict()
  .superRefine((cell, context) => {
    const hasCount = cell.itemCount !== undefined;
    const hasProportion = cell.proportion !== undefined;
    if (hasCount === hasProportion) {
      context.addIssue({
        code: "custom",
        path: ["itemCount"],
        message: "a cell defines exactly one of itemCount or proportion",
      });
    }
    /* A cell that forbids stimuli while asking for reading comprehension is
       unsatisfiable, and is much cheaper to reject here than at selection time
       against a real pool. */
    if (
      cell.stimulusRequirement === "forbidden" &&
      cell.questionTypes?.includes("reading_comprehension")
    ) {
      context.addIssue({
        code: "custom",
        path: ["stimulusRequirement"],
        message: "reading_comprehension items always carry a stimulus",
      });
    }
  });

export type AssessmentBlueprintCell = z.infer<typeof assessmentBlueprintCellSchema>;

export const assessmentBlueprintVersionSchema = z
  .object({
    kind: z.literal("assessment_blueprint_version"),
    schemaVersion: schemaVersionSchema,

    blueprintId: stableIdSchema,
    revision: revisionSchema,
    label: z.string().trim().min(1).max(160),

    cells: z.array(assessmentBlueprintCellSchema).min(1),

    /** Whole-paper totals, asserted against the cells below. */
    totalItems: z.number().int().positive().max(500),
    totalMarks: z.number().int().positive().max(1000),
  })
  .strict()
  .superRefine((blueprint, context) => {
    const cellIds = new Set(blueprint.cells.map((cell) => cell.cellId));
    if (cellIds.size !== blueprint.cells.length) {
      context.addIssue({ code: "custom", path: ["cells"], message: "duplicate cellId" });
    }

    /* Marks always add up, whether cells are counted or proportional. A
       blueprint whose declared total disagrees with its own cells cannot be
       used to check anything, and would fail silently at capacity time. */
    const marks = blueprint.cells.reduce((sum, cell) => sum + cell.marks, 0);
    if (marks !== blueprint.totalMarks) {
      context.addIssue({
        code: "custom",
        path: ["totalMarks"],
        message: `cells sum to ${marks} marks, totalMarks says ${blueprint.totalMarks}`,
      });
    }

    /* Mixing counted and proportional cells in one blueprint makes the total
       ambiguous — the proportions would have to be of the remainder, which no
       reader would infer reliably. Require one style throughout. */
    const counted = blueprint.cells.filter((cell) => cell.itemCount !== undefined);
    if (counted.length > 0 && counted.length < blueprint.cells.length) {
      context.addIssue({
        code: "custom",
        path: ["cells"],
        message: "cells must be all counted or all proportional, not a mixture",
      });
      return;
    }

    if (counted.length === blueprint.cells.length) {
      const items = counted.reduce((sum, cell) => sum + (cell.itemCount ?? 0), 0);
      if (items !== blueprint.totalItems) {
        context.addIssue({
          code: "custom",
          path: ["totalItems"],
          message: `cells sum to ${items} items, totalItems says ${blueprint.totalItems}`,
        });
      }
      return;
    }

    const proportion = blueprint.cells.reduce((sum, cell) => sum + (cell.proportion ?? 0), 0);
    /* Floating-point tolerance: 0.3 + 0.3 + 0.4 is not exactly 1 in IEEE 754. */
    if (Math.abs(proportion - 1) > 1e-6) {
      context.addIssue({
        code: "custom",
        path: ["cells"],
        message: `proportions sum to ${proportion}, expected 1`,
      });
    }
  });

export type AssessmentBlueprintVersion = z.infer<typeof assessmentBlueprintVersionSchema>;
