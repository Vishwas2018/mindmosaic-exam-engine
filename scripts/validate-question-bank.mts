/**
 * Production question-bank validation.
 *
 * Enforces the Phase 3 contract for the 100-question production bank
 * (exact distribution, visual coverage, metadata completeness, uniqueness)
 * and re-validates the Phase 2 showcase fixtures. Exits non-zero on any
 * failure.
 */

import {
  showcaseQuestions,
  showcaseVisuals,
} from "../src/content/questions/showcase-fixtures";
import { summariseQuestionBank } from "../src/content/questions/question-bank-summary";
import { safeValidateQuestionBank } from "../src/features/exam-engine/validation/validate-question-bank";
import {
  QUESTION_TYPES,
  type Question,
  type QuestionType,
} from "../src/schemas/question.schema";
import { VISUAL_TYPES, visualSchema, type VisualType } from "../src/schemas/visual.schema";

const failures: string[] = [];

function fail(message: string): void {
  failures.push(message);
}

/* Load the production bank; a schema failure inside the module throws. */

let questionBank: readonly Question[] = [];
try {
  ({ questionBank } = await import("../src/content/questions/question-bank"));
} catch (error) {
  console.error("The production question bank failed schema validation:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

/* 1-3. Exact totals and per-type distribution. */

const EXPECTED_TOTAL = 100;

const EXPECTED_TYPE_COUNTS: Record<QuestionType, number> = {
  multiple_choice: 14,
  multiple_select: 7,
  number_entry: 12,
  fill_blank: 8,
  dropdown: 7,
  true_false: 6,
  matching: 6,
  ordering: 6,
  short_answer: 6,
  reading_comprehension: 8,
  essay: 4,
  label_diagram: 6,
  hotspot: 5,
  drag_drop: 5,
};

/* 4-6. Visual coverage minimums. */

const MINIMUM_VISUAL_QUESTIONS = 45;

const VISUAL_MINIMUMS: Record<VisualType, number> = {
  bar_chart: 5,
  line_graph: 4,
  pie_chart: 4,
  table: 6,
  number_line: 5,
  geometry_shape: 5,
  coordinate_grid: 4,
  fraction_model: 4,
  labelled_svg: 5,
  hotspot_svg: 5,
};

/* Grade and exam-style distribution ranges. */

const YEAR_RANGES: Record<string, readonly [number, number]> = {
  "year-3": [45, 50],
  "year-5": [50, 55],
};

const STYLE_RANGES: Record<string, readonly [number, number]> = {
  naplan_style: [70, 75],
  icas_style: [25, 30],
};

const summary = summariseQuestionBank(questionBank);

if (summary.totalQuestions !== EXPECTED_TOTAL) {
  fail(
    `Production bank must hold exactly ${EXPECTED_TOTAL} questions, found ${summary.totalQuestions}.`,
  );
}

for (const type of QUESTION_TYPES) {
  const expected = EXPECTED_TYPE_COUNTS[type];
  const actual = summary.byQuestionType[type] ?? 0;
  if (actual !== expected) {
    fail(`Question type '${type}' must appear exactly ${expected} times, found ${actual}.`);
  }
}

if (summary.questionsWithVisuals < MINIMUM_VISUAL_QUESTIONS) {
  fail(
    `At least ${MINIMUM_VISUAL_QUESTIONS} questions must contain visuals, found ${summary.questionsWithVisuals}.`,
  );
}

for (const type of VISUAL_TYPES) {
  const minimum = VISUAL_MINIMUMS[type];
  const actual = summary.byVisualType[type] ?? 0;
  if (actual < minimum) {
    fail(`Visual type '${type}' must appear at least ${minimum} times, found ${actual}.`);
  }
}

for (const [year, [low, high]] of Object.entries(YEAR_RANGES)) {
  const actual = summary.byYearLevel[year] ?? 0;
  if (actual < low || actual > high) {
    fail(`${year} count ${actual} is outside the permitted range ${low}-${high}.`);
  }
}

for (const [style, [low, high]] of Object.entries(STYLE_RANGES)) {
  const actual = summary.byExamStyle[style] ?? 0;
  if (actual < low || actual > high) {
    fail(`${style} count ${actual} is outside the permitted range ${low}-${high}.`);
  }
}

/* 7. Unique IDs (also enforced at import; re-checked independently). */

const idCounts = new Map<string, number>();
for (const question of questionBank) {
  idCounts.set(question.id, (idCounts.get(question.id) ?? 0) + 1);
}
for (const [id, count] of idCounts) {
  if (count > 1) fail(`Duplicate question ID '${id}' appears ${count} times.`);
}

/* 8. Schema validity, re-run explicitly so this script never silently trusts imports. */

const parsed = safeValidateQuestionBank(questionBank);
if (!parsed.success) {
  for (const issue of parsed.error.issues) {
    fail(`Schema: ${issue.path.join(".")}: ${issue.message}`);
  }
}

/* Per-question checks (9-31). */

const normalisedPrompts = new Map<string, string>();
const exactExplanations = new Map<string, string>();

function normalisePrompt(prompt: string): string {
  return prompt.toLocaleLowerCase("en-AU").replace(/[^a-z0-9]+/g, " ").trim();
}

for (const question of questionBank) {
  const label = `Question '${question.id}'`;

  /* 30-31. Lifecycle fields. */
  if (question.status !== "published") {
    fail(`${label} must be published, found status '${question.status}'.`);
  }
  if (question.origin !== "original_seed") {
    fail(`${label} must have origin 'original_seed', found '${question.origin}'.`);
  }

  /* 9. Explanation present. */
  if (question.explanation.trim().length === 0) {
    fail(`${label} is missing an explanation.`);
  }

  /* 10. Answer key present (schema guarantees shape; guard against blanks). */
  if (!question.answerKey) {
    fail(`${label} is missing an answer key.`);
  }

  /* 11. Alt text for every visual. */
  for (const visual of question.visuals) {
    if (visual.altText.trim().length < 10) {
      fail(`${label} visual '${visual.id}' is missing meaningful alt text.`);
    }
    const visualResult = visualSchema.safeParse(visual);
    if (!visualResult.success) {
      fail(`${label} visual '${visual.id}' fails the visual schema.`);
    }
  }

  /* 12-13. Unsupported types (schema enums enforce; assert defensively). */
  if (!QUESTION_TYPES.includes(question.type)) {
    fail(`${label} uses unsupported question type '${question.type}'.`);
  }
  for (const visual of question.visuals) {
    if (!VISUAL_TYPES.includes(visual.type)) {
      fail(`${label} uses unsupported visual type '${visual.type}'.`);
    }
  }

  /* 14-17. Orphaned or duplicated identifiers. */
  const optionIds = question.options.map((option) => option.id);
  if (new Set(optionIds).size !== optionIds.length) {
    fail(`${label} has duplicate option IDs.`);
  }
  /*
   * Exact-match on trimmed text: case must stay significant because some
   * language questions differ only in capitalisation.
   */
  const optionTexts = question.options.map((option) => option.text.trim());
  if (new Set(optionTexts).size !== optionTexts.length) {
    fail(`${label} has duplicate option text.`);
  }

  const key = question.answerKey;
  if (key.kind === "single_option" && !optionIds.includes(key.optionId)) {
    fail(`${label} answer key references unknown option '${key.optionId}'.`);
  }
  if (key.kind === "multiple_options") {
    for (const id of key.optionIds) {
      if (!optionIds.includes(id)) {
        fail(`${label} answer key references unknown option '${id}'.`);
      }
    }
  }

  if (question.interaction) {
    const interaction = question.interaction;
    const interactionIds: string[] = [];
    switch (interaction.type) {
      case "fill_blank":
        interactionIds.push(...interaction.blanks.map((blank) => blank.id));
        break;
      case "dropdown":
        interactionIds.push(...interaction.fields.map((field) => field.id));
        for (const field of interaction.fields) {
          const ids = field.options.map((option) => option.id);
          if (new Set(ids).size !== ids.length) {
            fail(`${label} dropdown field '${field.id}' has duplicate option IDs.`);
          }
        }
        break;
      case "matching":
        interactionIds.push(
          ...interaction.sources.map((source) => source.id),
          ...interaction.targets.map((target) => target.id),
        );
        break;
      case "ordering":
        interactionIds.push(...interaction.items.map((item) => item.id));
        break;
      case "drag_drop":
        interactionIds.push(
          ...interaction.items.map((item) => item.id),
          ...interaction.zones.map((zone) => zone.id),
        );
        break;
      case "label_diagram":
        interactionIds.push(
          ...interaction.labels.map((labelItem) => labelItem.id),
          ...interaction.targets.map((target) => target.id),
        );
        break;
    }
    if (new Set(interactionIds).size !== interactionIds.length) {
      fail(`${label} has duplicate interaction IDs.`);
    }
  }

  /* 18. No duplicate prompts after normalisation. */
  const normalised = normalisePrompt(question.prompt);
  const promptOwner = normalisedPrompts.get(normalised);
  if (promptOwner) {
    fail(`${label} duplicates the prompt of '${promptOwner}' after normalisation.`);
  } else {
    normalisedPrompts.set(normalised, question.id);
  }

  /* 19. No exact duplicate explanations. */
  const explanationOwner = exactExplanations.get(question.explanation);
  if (explanationOwner) {
    fail(`${label} duplicates the explanation of '${explanationOwner}'.`);
  } else {
    exactExplanations.set(question.explanation, question.id);
  }

  /* 20. No empty stimuli. */
  if (question.stimulus && question.stimulus.body.trim().length === 0) {
    fail(`${label} has an empty stimulus.`);
  }

  /* 21. Valid essay rubrics. */
  if (question.type === "essay") {
    if (key.kind !== "manual") {
      fail(`${label} must use a manual answer key.`);
    } else {
      if (key.rubric.trim().length < 40) {
        fail(`${label} rubric is too short to guide marking.`);
      }
      if (
        key.minWords !== undefined &&
        key.maxWords !== undefined &&
        key.minWords >= key.maxWords
      ) {
        fail(`${label} rubric word guidance is invalid (minWords >= maxWords).`);
      }
    }
  }

  /* 22-29. Metadata completeness. */
  if (question.yearLevel !== 3 && question.yearLevel !== 5) {
    fail(`${label} has invalid year level '${question.yearLevel}'.`);
  }
  if (!["naplan_style", "icas_style"].includes(question.examStyle)) {
    fail(`${label} has invalid exam style '${question.examStyle}'.`);
  }
  const { metadata } = question;
  if (!metadata.subject) fail(`${label} is missing subject metadata.`);
  if (!metadata.strand?.trim()) fail(`${label} is missing strand metadata.`);
  if (!metadata.skill?.trim()) fail(`${label} is missing skill metadata.`);
  if (!["easy", "medium", "challenging"].includes(metadata.difficulty)) {
    fail(`${label} has invalid difficulty '${metadata.difficulty}'.`);
  }
  if (!Number.isInteger(metadata.marks) || metadata.marks <= 0) {
    fail(`${label} has invalid marks '${metadata.marks}'.`);
  }
  if (
    !Number.isInteger(metadata.estimatedTimeSeconds) ||
    metadata.estimatedTimeSeconds <= 0 ||
    metadata.estimatedTimeSeconds > 3600
  ) {
    fail(`${label} has invalid estimated time '${metadata.estimatedTimeSeconds}'.`);
  }
}

/* Coverage report. */

function printCounts(title: string, counts: Readonly<Record<string, number>>): void {
  console.log(`\n${title}`);
  for (const [key, value] of Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`  - ${key}: ${value}`);
  }
}

console.log("MindMosaic production question bank");
console.log("===================================");
console.log(`Questions: ${summary.totalQuestions}`);
console.log(`Questions with visuals: ${summary.questionsWithVisuals}`);
console.log(`Manual-review questions: ${summary.manualReviewCount}`);
printCounts("By question type:", summary.byQuestionType);
printCounts("By visual type:", summary.byVisualType);
printCounts("By year level:", summary.byYearLevel);
printCounts("By exam style:", summary.byExamStyle);
printCounts("By subject:", summary.bySubject);
printCounts("By strand:", summary.byStrand);
printCounts("By skill:", summary.bySkill);
printCounts("By difficulty:", summary.byDifficulty);

/* Showcase fixtures (Phase 2) stay valid alongside the production bank. */

const showcaseValidation = safeValidateQuestionBank(showcaseQuestions);
if (!showcaseValidation.success) {
  for (const issue of showcaseValidation.error.issues) {
    fail(`Showcase fixture: ${issue.path.join(".")}: ${issue.message}`);
  }
}
for (const visual of showcaseVisuals) {
  if (!visualSchema.safeParse(visual).success) {
    fail(`Showcase visual '${visual.id}' failed validation.`);
  }
}
console.log(`\nShowcase fixtures: ${showcaseQuestions.length} questions revalidated.`);

if (failures.length > 0) {
  console.error(`\n${failures.length} validation failure(s):`);
  for (const message of failures) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log("\nAll production questions and showcase fixtures are valid.");
