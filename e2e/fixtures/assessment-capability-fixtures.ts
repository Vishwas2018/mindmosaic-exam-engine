import type { Question } from "@/schemas/question.schema";

/**
 * Test-only fixtures for the 3 new assessment capability question types:
 * - hot_text (single-select and multi-select with min/max)
 * - matrix_choice (single-per-row and multiple-per-row with disabled cells)
 * - structured_response (numeric part, short-text part, and manual-marked part + working area)
 *
 * Scoped strictly to tests — never imported into the served/published bank.
 */

export const TEST_HOT_TEXT_SINGLE: Question = {
  id: "test-hot-text-single-001",
  type: "hot_text",
  yearLevel: 3,
  examStyle: "naplan_style",
  status: "published",
  origin: "original_seed",
  prompt: "Select the action verb in the sentence below.",
  interaction: {
    type: "hot_text",
    selectionMode: "single",
    maxSelections: 1,
    minSelections: 1,
    segments: [
      { kind: "text", text: "The swift wallaby " },
      { kind: "selectable", id: "seg-verb-1", text: "bounded" },
      { kind: "text", text: " across the wide grassy " },
      { kind: "selectable", id: "seg-noun-1", text: "paddock" },
      { kind: "text", text: "." },
    ],
  },
  visuals: [],
  options: [],
  answerKey: {
    kind: "hot_text",
    regionIds: ["seg-verb-1"],
  },
  explanation:
    "'Bounded' is the action verb describing the physical movement of the wallaby.",
  metadata: {
    subject: "numeracy",
    strand: "number",
    topic: "Verbs",
    skill: "Identifying action verbs",
    difficulty: "easy",
    marks: 1,
    estimatedTimeSeconds: 45,
    tags: ["verbs", "grammar"],
    locale: "en-AU",
    source: "original",
    schemaVersion: 1,
  },
};

export const TEST_HOT_TEXT_MULTI: Question = {
  id: "test-hot-text-multi-002",
  type: "hot_text",
  yearLevel: 3,
  examStyle: "naplan_style",
  status: "published",
  origin: "original_seed",
  prompt: "Select the two descriptive adjectives in the passage below.",
  interaction: {
    type: "hot_text",
    selectionMode: "multiple",
    maxSelections: 2,
    minSelections: 2,
    segments: [
      { kind: "text", text: "Beneath the " },
      { kind: "selectable", id: "seg-adj-1", text: "ancient" },
      { kind: "text", text: " eucalyptus tree, we discovered a " },
      { kind: "selectable", id: "seg-adj-2", text: "gnarled" },
      { kind: "text", text: " wooden " },
      { kind: "selectable", id: "seg-noun-2", text: "bench" },
      { kind: "text", text: "." },
    ],
  },
  visuals: [],
  options: [],
  answerKey: {
    kind: "hot_text",
    regionIds: ["seg-adj-1", "seg-adj-2"],
  },
  explanation:
    "'Ancient' and 'gnarled' are adjectives describing the tree and the bench.",
  metadata: {
    subject: "numeracy",
    strand: "number",
    topic: "Adjectives",
    skill: "Identifying adjectives",
    difficulty: "medium",
    marks: 2,
    estimatedTimeSeconds: 60,
    tags: ["adjectives", "grammar"],
    locale: "en-AU",
    source: "original",
    schemaVersion: 1,
  },
};

export const TEST_MATRIX_SINGLE: Question = {
  id: "test-matrix-single-001",
  type: "matrix_choice",
  yearLevel: 3,
  examStyle: "naplan_style",
  status: "published",
  origin: "original_seed",
  prompt: "Classify each Australian native animal into its correct biological class.",
  interaction: {
    type: "matrix_choice",
    selectionMode: "single_per_row",
    rows: [
      { id: "row-koala", text: "Koala" },
      { id: "row-kookaburra", text: "Kookaburra" },
    ],
    columns: [
      { id: "col-mammal", text: "Mammal" },
      { id: "col-bird", text: "Bird" },
    ],
    cells: [
      { id: "c-koala-mammal", rowId: "row-koala", columnId: "col-mammal", selectable: true },
      { id: "c-koala-bird", rowId: "row-koala", columnId: "col-bird", selectable: true },
      { id: "c-kook-mammal", rowId: "row-kookaburra", columnId: "col-mammal", selectable: true },
      { id: "c-kook-bird", rowId: "row-kookaburra", columnId: "col-bird", selectable: true },
    ],
  },
  visuals: [],
  options: [],
  answerKey: {
    kind: "matrix",
    cellIds: ["c-koala-mammal", "c-kook-bird"],
  },
  explanation:
    "A koala is a marsupial mammal, and a kookaburra is a kingfisher bird.",
  metadata: {
    subject: "numeracy",
    strand: "number",
    topic: "Animal Classification",
    skill: "Classifying vertebrate animals",
    difficulty: "easy",
    marks: 2,
    estimatedTimeSeconds: 60,
    tags: ["science", "classification"],
    locale: "en-AU",
    source: "original",
    schemaVersion: 1,
  },
};

export const TEST_MATRIX_MULTI: Question = {
  id: "test-matrix-multi-002",
  type: "matrix_choice",
  yearLevel: 3,
  examStyle: "naplan_style",
  status: "published",
  origin: "original_seed",
  prompt: "Select all geometric properties that apply to each 2D quadrilateral shape.",
  interaction: {
    type: "matrix_choice",
    selectionMode: "multiple_per_row",
    maxSelections: 4,
    rows: [
      { id: "row-square", text: "Square" },
      { id: "row-rectangle", text: "Oblong rectangle" },
    ],
    columns: [
      { id: "col-4equal", text: "4 equal sides" },
      { id: "col-4right", text: "4 right angles" },
    ],
    cells: [
      { id: "c-sq-equal", rowId: "row-square", columnId: "col-4equal", selectable: true },
      { id: "c-sq-right", rowId: "row-square", columnId: "col-4right", selectable: true },
      { id: "c-rec-equal", rowId: "row-rectangle", columnId: "col-4equal", selectable: false },
      { id: "c-rec-right", rowId: "row-rectangle", columnId: "col-4right", selectable: true },
    ],
  },
  visuals: [],
  options: [],
  answerKey: {
    kind: "matrix",
    cellIds: ["c-sq-equal", "c-sq-right", "c-rec-right"],
  },
  explanation:
    "A square has both 4 equal sides and 4 right angles. An oblong rectangle has 4 right angles but unequal adjacent sides.",
  metadata: {
    subject: "numeracy",
    strand: "space",
    topic: "2D Shapes",
    skill: "Properties of quadrilaterals",
    difficulty: "medium",
    marks: 3,
    estimatedTimeSeconds: 75,
    tags: ["geometry", "quadrilaterals"],
    locale: "en-AU",
    source: "original",
    schemaVersion: 1,
  },
};

export const TEST_STRUCTURED_RESPONSE: Question = {
  id: "test-structured-response-001",
  type: "structured_response",
  yearLevel: 3,
  examStyle: "naplan_style",
  status: "published",
  origin: "original_seed",
  prompt: "Solve the geometry problem below in three distinct steps.",
  interaction: {
    type: "structured_response",
    parts: [
      {
        id: "part-calc",
        label: "Part A: Calculate the unknown angle x in degrees",
        responseKind: "number",
        placeholder: "e.g. 65",
        required: true,
      },
      {
        id: "part-type",
        label: "Part B: State the classification of this angle",
        responseKind: "short_text",
        placeholder: "e.g. acute",
        required: true,
      },
      {
        id: "part-reason",
        label: "Part C: Explain your mathematical reasoning in detail",
        responseKind: "short_text",
        placeholder: "Show your working and explain the geometric theorem used...",
        required: true,
      },
    ],
    workingArea: {
      enabled: true,
      label: "Working & Explanation",
      maxLength: 3000,
    },
  },
  visuals: [],
  options: [],
  answerKey: {
    kind: "structured",
    markingMode: "hybrid",
    parts: [
      {
        id: "part-calc",
        responseKind: "number",
        value: 65,
        tolerance: 0,
        marks: 1,
        marking: "automatic",
      },
      {
        id: "part-type",
        responseKind: "short_text",
        acceptableAnswers: ["acute", "acute angle"],
        marks: 1,
        marking: "automatic",
        caseSensitive: false,
        trimWhitespace: true,
      },
      {
        id: "part-reason",
        responseKind: "short_text",
        marks: 2,
        marking: "manual",
        rubric: "1 mark for stating angles on a straight line equal 180 degrees. 1 mark for correct arithmetic reasoning.",
        rubricVersion: "v1.0",
      },
    ],
  },
  explanation:
    "Part A is 65° because 180° - 115° = 65°. Part B is acute because 65° < 90°. Part C requires explanation of supplementary angles on a straight line.",
  metadata: {
    subject: "numeracy",
    strand: "measurement",
    topic: "Angles",
    skill: "Multi-part angle calculations and reasoning",
    difficulty: "medium",
    marks: 4,
    estimatedTimeSeconds: 120,
    tags: ["angles", "geometry", "reasoning"],
    locale: "en-AU",
    source: "original",
    schemaVersion: 1,
  },
};

// Additional 5 questions to reach 10 items for the standard 10-count exam
export const TEST_HOT_TEXT_SINGLE_ALT: Question = {
  ...TEST_HOT_TEXT_SINGLE,
  id: "test-hot-text-single-002",
  prompt: "Select the main verb in the sentence.",
};

export const TEST_HOT_TEXT_MULTI_ALT: Question = {
  ...TEST_HOT_TEXT_MULTI,
  id: "test-hot-text-multi-003",
  prompt: "Select the two descriptive adjectives.",
};

export const TEST_MATRIX_SINGLE_ALT: Question = {
  ...TEST_MATRIX_SINGLE,
  id: "test-matrix-single-002",
  prompt: "Classify each animal into its biological class.",
};

export const TEST_MATRIX_MULTI_ALT: Question = {
  ...TEST_MATRIX_MULTI,
  id: "test-matrix-multi-003",
  prompt: "Select all geometric properties that apply.",
};

export const TEST_STRUCTURED_RESPONSE_ALT: Question = {
  ...TEST_STRUCTURED_RESPONSE,
  id: "test-structured-response-002",
  prompt: "Solve the geometry problem in three steps.",
};

export const ALL_TEST_ASSESSMENT_QUESTIONS: readonly Question[] = [
  TEST_HOT_TEXT_SINGLE,
  TEST_HOT_TEXT_MULTI,
  TEST_MATRIX_SINGLE,
  TEST_MATRIX_MULTI,
  TEST_STRUCTURED_RESPONSE,
  TEST_HOT_TEXT_SINGLE_ALT,
  TEST_HOT_TEXT_MULTI_ALT,
  TEST_MATRIX_SINGLE_ALT,
  TEST_MATRIX_MULTI_ALT,
  TEST_STRUCTURED_RESPONSE_ALT,
];
