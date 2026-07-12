import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import { FACTORY_VERSIONS } from "@/features/question-factory/config";
import { hashJson } from "@/features/question-factory/provenance";
import type { QuestionFactoryCandidate } from "@/features/question-factory/validation";

/**
 * Small, hand-written synthetic fixtures for the structural-validation
 * gate's test suite — never harvested content. Mirrors the fixture-factory
 * style already established in `ingestion.test.ts`.
 */

export function baseQuestion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "candidate-mc-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: "What is 23 + 48?",
    options: [
      { id: "opt-a", text: "71" },
      { id: "opt-b", text: "61" },
      { id: "opt-c", text: "81" },
      { id: "opt-d", text: "70" },
    ],
    answerKey: { kind: "single_option", optionId: "opt-a" },
    visuals: [],
    explanation: "23 + 48 = 71.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      skill: "num.addition.two-digit",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
    },
    ...overrides,
  };
}

export function baseProvenance(
  question: Record<string, unknown>,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    candidateId: question.id,
    blueprintId: "legacy-ingestion-unblueprinted",
    batchId: "batch-001",
    pipelineRunId: "run-001",
    revision: 0,
    generatedAt: "2026-01-01T00:00:00.000Z",
    generatorAdapter: { class: "manual_external", identity: normaliseIdentityOrThrow("chatgpt") },
    generatorVersion: "1",
    promptVersion: "n-a-legacy-ingestion",
    schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION,
    taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
    contentHash: hashJson(question),
    reviewRecords: [],
    ...overrides,
  };
}

export interface BuildCandidateOptions {
  readonly questionOverrides?: Record<string, unknown>;
  readonly provenanceOverrides?: Record<string, unknown>;
  readonly state?: string;
  readonly sourcePath?: string;
}

export function buildCandidate(
  options: BuildCandidateOptions = {},
): { readonly candidate: QuestionFactoryCandidate; readonly question: Record<string, unknown> } {
  const question = baseQuestion(options.questionOverrides);
  const provenance = baseProvenance(question, options.provenanceOverrides);
  const candidate: QuestionFactoryCandidate = {
    candidateId: question.id as string,
    state: options.state ?? "generated",
    question,
    provenance,
    ...(options.sourcePath !== undefined ? { ingestion: { sourcePath: options.sourcePath } } : {}),
  };
  return { candidate, question };
}

export const VALID_CONTEXT = { validatedAt: "2026-01-02T00:00:00.000Z" };

/* Additional valid per-type fixtures, each grounded in a real taxonomy entry. */

export function multipleSelectQuestion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return baseQuestion({
    id: "candidate-ms-001",
    type: "multiple_select",
    yearLevel: 5,
    examStyle: "icas_style",
    prompt: "Which of these are multiples of 4?",
    options: [
      { id: "opt-a", text: "8" },
      { id: "opt-b", text: "9" },
      { id: "opt-c", text: "12" },
      { id: "opt-d", text: "15" },
    ],
    answerKey: { kind: "multiple_options", optionIds: ["opt-a", "opt-c"] },
    metadata: {
      subject: "numeracy",
      strand: "Number",
      skill: "num.number.multiples",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
    },
    ...overrides,
  });
}

export function numberEntryQuestion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return baseQuestion({
    id: "candidate-ne-001",
    type: "number_entry",
    prompt: "What is 23 + 48?",
    options: [],
    answerKey: { kind: "number", value: 71, tolerance: 0 },
    ...overrides,
  });
}

export function fillBlankQuestion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return baseQuestion({
    id: "candidate-fb-001",
    type: "fill_blank",
    yearLevel: 5,
    examStyle: "naplan_style",
    prompt: "The plural of 'mouse' is ___.",
    options: [],
    interaction: { type: "fill_blank", segments: [], blanks: [{ id: "blank-1", label: "Plural form" }] },
    answerKey: {
      kind: "fill_blank",
      blanks: [{ id: "blank-1", acceptedAnswers: ["mice"] }],
      caseSensitive: false,
      trimWhitespace: true,
    },
    metadata: {
      subject: "language_conventions",
      strand: "Grammar",
      skill: "lit.grammar.plurals",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
    },
    ...overrides,
  });
}

export function matchingQuestion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return baseQuestion({
    id: "candidate-match-001",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    prompt: "Match each word to its word class.",
    options: [],
    interaction: {
      type: "matching",
      sources: [
        { id: "src-1", text: "Dog" },
        { id: "src-2", text: "Run" },
      ],
      targets: [
        { id: "tgt-1", text: "Noun" },
        { id: "tgt-2", text: "Verb" },
      ],
    },
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "src-1", targetId: "tgt-1" },
        { sourceId: "src-2", targetId: "tgt-2" },
      ],
    },
    metadata: {
      subject: "language_conventions",
      strand: "Grammar",
      skill: "lit.grammar.nouns-verbs-adjectives",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
    },
    ...overrides,
  });
}

export function orderingQuestion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return baseQuestion({
    id: "candidate-order-001",
    type: "ordering",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: "Put these events in the correct order.",
    options: [],
    interaction: {
      type: "ordering",
      items: [
        { id: "step-1", text: "Wake up" },
        { id: "step-2", text: "Eat breakfast" },
        { id: "step-3", text: "Go to school" },
      ],
    },
    answerKey: { kind: "ordering", optionIds: ["step-1", "step-2", "step-3"] },
    metadata: {
      subject: "reading",
      strand: "Comprehension",
      skill: "lit.reading.sequence-of-events",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
    },
    ...overrides,
  });
}

export function dropdownQuestion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return baseQuestion({
    id: "candidate-dd-001",
    type: "dropdown",
    yearLevel: 5,
    examStyle: "naplan_style",
    prompt: "Choose the correct pronoun.",
    options: [],
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "field-1",
          label: "Pronoun",
          options: [
            { id: "opt-he", text: "he" },
            { id: "opt-him", text: "him" },
          ],
        },
      ],
    },
    answerKey: { kind: "dropdown", fields: [{ id: "field-1", correctOptionId: "opt-he" }] },
    metadata: {
      subject: "language_conventions",
      strand: "Grammar",
      skill: "lit.grammar.pronouns",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
    },
    ...overrides,
  });
}

export function trueFalseQuestion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return baseQuestion({
    id: "candidate-tf-001",
    type: "true_false",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: "Sentences always start with a capital letter.",
    options: [],
    answerKey: { kind: "boolean", value: true },
    metadata: {
      subject: "language_conventions",
      strand: "Punctuation",
      skill: "lit.grammar.capital-letters",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
    },
    ...overrides,
  });
}

export function visualQuestion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return baseQuestion({
    id: "candidate-visual-001",
    type: "multiple_choice",
    yearLevel: 5,
    examStyle: "naplan_style",
    prompt: "Which fruit sold the most, according to the chart?",
    options: [
      { id: "opt-apples", text: "Apples" },
      { id: "opt-bananas", text: "Bananas" },
    ],
    answerKey: { kind: "single_option", optionId: "opt-bananas" },
    visuals: [
      {
        id: "chart-1",
        type: "bar_chart",
        altText: "Bar chart comparing fruit sales by type.",
        data: { labels: ["Apples", "Bananas"], values: [10, 20], colour: "#4B2E83" },
      },
    ],
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      skill: "num.data.read-bar-chart",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
    },
    ...overrides,
  });
}

/** Uses a declared alias ("Calculating the perimeter of a square"), not the canonical taxonomy id, to prove alias resolution. */
export function taxonomyAliasQuestion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return baseQuestion({
    id: "candidate-alias-001",
    type: "true_false",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: "A square with side 4cm has a perimeter of 16cm.",
    options: [],
    answerKey: { kind: "boolean", value: true },
    metadata: {
      subject: "numeracy",
      strand: "Measurement",
      skill: "Calculating the perimeter of a square",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
    },
    ...overrides,
  });
}
