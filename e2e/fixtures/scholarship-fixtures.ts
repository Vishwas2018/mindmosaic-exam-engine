import type { Question } from "@/schemas/question.schema";

/**
 * Test-only fixtures for Scholarship-style practice:
 * - Verbal reasoning and numerical reasoning items with full explanation text
 * - Marked as published for test-only route interception
 * - Strictly test fixtures, never imported into the served runtime bank
 */

export const TEST_SCHOLARSHIP_VR_1: Question = {
  id: "test-scholarship-y6-vr-001",
  type: "multiple_choice",
  yearLevel: 6,
  examStyle: "scholarship_style",
  status: "published",
  origin: "original_seed",
  prompt: "Select the word that completes the analogy: OCEAN is to WATER as GLACIER is to ___.",
  visuals: [],
  options: [
    { id: "a", text: "ICE" },
    { id: "b", text: "ROCK" },
    { id: "c", text: "COLD" },
    { id: "d", text: "SNOW" },
    { id: "e", text: "MOUNTAIN" },
  ],
  answerKey: {
    kind: "single_option",
    optionId: "a",
  },
  explanation:
    "An ocean is fundamentally composed of liquid water, just as a glacier is fundamentally composed of solid ice.",
  metadata: {
    subject: "verbal_reasoning",
    strand: "verbal_reasoning",
    topic: "Verbal Analogies",
    skill: "Identifying substance and composition relationships",
    difficulty: "medium",
    marks: 1,
    estimatedTimeSeconds: 40,
    tags: ["analogies", "reasoning"],
    locale: "en-AU",
    source: "original",
    schemaVersion: 1,
  },
};

export const TEST_SCHOLARSHIP_VR_2: Question = {
  id: "test-scholarship-y6-vr-002",
  type: "multiple_choice",
  yearLevel: 6,
  examStyle: "scholarship_style",
  status: "published",
  origin: "original_seed",
  prompt: "Find the odd one out among the following words.",
  visuals: [],
  options: [
    { id: "a", text: "Whisper" },
    { id: "b", text: "Mumble" },
    { id: "c", text: "Grumble" },
    { id: "d", text: "Shout" },
    { id: "e", text: "Mutter" },
  ],
  answerKey: {
    kind: "single_option",
    optionId: "d",
  },
  explanation:
    "Whisper, mumble, mutter, and grumble are all quiet or low-volume vocal sounds; shout is uniquely loud.",
  metadata: {
    subject: "verbal_reasoning",
    strand: "verbal_reasoning",
    topic: "Classification",
    skill: "Identifying categorical odd-one-out",
    difficulty: "easy",
    marks: 1,
    estimatedTimeSeconds: 35,
    tags: ["classification"],
    locale: "en-AU",
    source: "original",
    schemaVersion: 1,
  },
};

export const TEST_SCHOLARSHIP_NR_1: Question = {
  id: "test-scholarship-y6-nr-001",
  type: "multiple_choice",
  yearLevel: 6,
  examStyle: "scholarship_style",
  status: "published",
  origin: "original_seed",
  prompt: "What is the next number in the series: 4, 9, 16, 25, 36, ___?",
  visuals: [],
  options: [
    { id: "a", text: "45" },
    { id: "b", text: "47" },
    { id: "c", text: "49" },
    { id: "d", text: "50" },
    { id: "e", text: "52" },
  ],
  answerKey: {
    kind: "single_option",
    optionId: "c",
  },
  explanation:
    "The terms are consecutive squares: 2² = 4, 3² = 9, 4² = 16, 5² = 25, 6² = 36. The next term is 7² = 49.",
  metadata: {
    subject: "numerical_reasoning",
    strand: "numerical_reasoning",
    topic: "Number Series",
    skill: "Square number sequences",
    difficulty: "medium",
    marks: 1,
    estimatedTimeSeconds: 45,
    tags: ["number-series", "squares"],
    locale: "en-AU",
    source: "original",
    schemaVersion: 1,
  },
};

export const TEST_PRACTICE_Q1: Question = {
  ...TEST_SCHOLARSHIP_VR_1,
  id: "test-practice-q-001",
  yearLevel: 3,
  examStyle: "naplan_style",
  metadata: {
    ...TEST_SCHOLARSHIP_VR_1.metadata,
    subject: "numeracy",
    strand: "Number",
  },
};

export const TEST_PRACTICE_Q2: Question = {
  ...TEST_SCHOLARSHIP_VR_2,
  id: "test-practice-q-002",
  yearLevel: 3,
  examStyle: "naplan_style",
  metadata: {
    ...TEST_SCHOLARSHIP_VR_2.metadata,
    subject: "numeracy",
    strand: "Number",
  },
};

export const TEST_PRACTICE_QUESTIONS: Question[] = [
  TEST_PRACTICE_Q1,
  TEST_PRACTICE_Q2,
  ...Array.from({ length: 10 }, (_, i) => ({
    ...TEST_PRACTICE_Q1,
    id: `test-practice-q-extra-${i + 1}`,
  })),
];

export const ALL_TEST_SCHOLARSHIP_QUESTIONS: readonly Question[] = [
  TEST_SCHOLARSHIP_VR_1,
  TEST_SCHOLARSHIP_VR_2,
  TEST_SCHOLARSHIP_NR_1,
  ...TEST_PRACTICE_QUESTIONS,
];
