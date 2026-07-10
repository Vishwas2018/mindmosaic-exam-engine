import type { CandidateAnswer } from "@/features/exam-engine/types";
import type { AnswerKey, Question } from "@/schemas/question.schema";

export type ScoreStatus =
  | "correct"
  | "incorrect"
  | "manual_review"
  | "unanswered";

/**
 * The result of scoring a single response with a pure function.
 *
 * `correct` and `earnedMarks` are `null` for responses that require manual
 * review (for example essays), where no automatic mark can be awarded.
 */
export interface ScoredResponse {
  status: ScoreStatus;
  correct: boolean | null;
  earnedMarks: number | null;
  availableMarks: number;
  manualReviewRequired: boolean;
}

/* Shared helpers */

export function isUnanswered(answer: CandidateAnswer | undefined): boolean {
  if (answer === undefined || answer === null) return true;
  if (typeof answer === "string") return answer.trim().length === 0;
  if (Array.isArray(answer)) return answer.length === 0;
  if (typeof answer === "object") return Object.keys(answer).length === 0;
  return false;
}

function isStringArray(
  answer: CandidateAnswer | undefined,
): answer is readonly string[] {
  return Array.isArray(answer) && answer.every((v) => typeof v === "string");
}

function isStringRecord(
  answer: CandidateAnswer | undefined,
): answer is Readonly<Record<string, string>> {
  return (
    typeof answer === "object" &&
    answer !== null &&
    !Array.isArray(answer) &&
    Object.values(answer).every((value) => typeof value === "string")
  );
}

function arraysMatchAsSets(
  received: readonly string[],
  expected: readonly string[],
): boolean {
  const receivedSet = new Set(received);
  const expectedSet = new Set(expected);
  return (
    receivedSet.size === received.length &&
    expectedSet.size === expected.length &&
    receivedSet.size === expectedSet.size &&
    [...expectedSet].every((value) => receivedSet.has(value))
  );
}

function arraysMatchInOrder(
  received: readonly string[],
  expected: readonly string[],
): boolean {
  return (
    received.length === expected.length &&
    expected.every((value, index) => received[index] === value)
  );
}

function recordsMatch(
  received: Readonly<Record<string, string>>,
  expected: Readonly<Record<string, string>>,
): boolean {
  const expectedEntries = Object.entries(expected);
  return (
    Object.keys(received).length === expectedEntries.length &&
    expectedEntries.every(([key, value]) => received[key] === value)
  );
}

function normaliseText(
  value: string,
  options: { caseSensitive: boolean; trimWhitespace: boolean },
): string {
  const whitespaceNormalised = options.trimWhitespace
    ? value.trim().replace(/\s+/g, " ")
    : value;
  return options.caseSensitive
    ? whitespaceNormalised
    : whitespaceNormalised.toLocaleLowerCase("en-AU");
}

function marks(question: Question): number {
  return question.metadata.marks;
}

function objective(question: Question, correct: boolean): ScoredResponse {
  const availableMarks = marks(question);
  return {
    status: correct ? "correct" : "incorrect",
    correct,
    earnedMarks: correct ? availableMarks : 0,
    availableMarks,
    manualReviewRequired: false,
  };
}

function unanswered(question: Question): ScoredResponse {
  return {
    status: "unanswered",
    correct: false,
    earnedMarks: 0,
    availableMarks: marks(question),
    manualReviewRequired: false,
  };
}

function expectKey<K extends AnswerKey["kind"]>(
  question: Question,
  kind: K,
): Extract<AnswerKey, { kind: K }> {
  if (question.answerKey.kind !== kind) {
    throw new Error(
      `Question '${question.id}' expected a '${kind}' answer key but received '${question.answerKey.kind}'.`,
    );
  }
  return question.answerKey as Extract<AnswerKey, { kind: K }>;
}

/* Objective scorers (one pure function per question type) */

export function scoreMultipleChoice(
  question: Question,
  answer: CandidateAnswer | undefined,
): ScoredResponse {
  if (isUnanswered(answer)) return unanswered(question);
  const key = expectKey(question, "single_option");
  return objective(question, typeof answer === "string" && answer === key.optionId);
}

export function scoreMultipleSelect(
  question: Question,
  answer: CandidateAnswer | undefined,
): ScoredResponse {
  if (isUnanswered(answer)) return unanswered(question);
  const key = expectKey(question, "multiple_options");
  return objective(
    question,
    isStringArray(answer) && arraysMatchAsSets(answer, key.optionIds),
  );
}

export function scoreNumberEntry(
  question: Question,
  answer: CandidateAnswer | undefined,
): ScoredResponse {
  if (isUnanswered(answer)) return unanswered(question);
  const key = expectKey(question, "number");
  const numeric =
    typeof answer === "number"
      ? answer
      : typeof answer === "string"
        ? Number(answer)
        : Number.NaN;
  return objective(
    question,
    Number.isFinite(numeric) && Math.abs(numeric - key.value) <= key.tolerance,
  );
}

export function scoreFillBlank(
  question: Question,
  answer: CandidateAnswer | undefined,
): ScoredResponse {
  if (isUnanswered(answer)) return unanswered(question);
  const key = expectKey(question, "fill_blank");
  if (!isStringRecord(answer)) return objective(question, false);

  const options = {
    caseSensitive: key.caseSensitive,
    trimWhitespace: key.trimWhitespace,
  };
  const correct = key.blanks.every((blank) => {
    const submitted = answer[blank.id];
    if (typeof submitted !== "string" || submitted.trim().length === 0) {
      return false;
    }
    const normalisedSubmission = normaliseText(submitted, options);
    return blank.acceptedAnswers
      .map((accepted) => normaliseText(accepted, options))
      .includes(normalisedSubmission);
  });
  return objective(question, correct);
}

export function scoreDropdown(
  question: Question,
  answer: CandidateAnswer | undefined,
): ScoredResponse {
  if (isUnanswered(answer)) return unanswered(question);
  const key = expectKey(question, "dropdown");
  if (!isStringRecord(answer)) return objective(question, false);
  const correct =
    Object.keys(answer).length === key.fields.length &&
    key.fields.every((field) => answer[field.id] === field.correctOptionId);
  return objective(question, correct);
}

export function scoreTrueFalse(
  question: Question,
  answer: CandidateAnswer | undefined,
): ScoredResponse {
  if (isUnanswered(answer)) return unanswered(question);
  const key = expectKey(question, "boolean");
  return objective(question, typeof answer === "boolean" && answer === key.value);
}

export function scoreMatching(
  question: Question,
  answer: CandidateAnswer | undefined,
): ScoredResponse {
  if (isUnanswered(answer)) return unanswered(question);
  const key = expectKey(question, "matching");
  const expected = Object.fromEntries(
    key.pairs.map((pair) => [pair.sourceId, pair.targetId]),
  );
  return objective(
    question,
    isStringRecord(answer) && recordsMatch(answer, expected),
  );
}

export function scoreOrdering(
  question: Question,
  answer: CandidateAnswer | undefined,
): ScoredResponse {
  if (isUnanswered(answer)) return unanswered(question);
  const key = expectKey(question, "ordering");
  return objective(
    question,
    isStringArray(answer) && arraysMatchInOrder(answer, key.optionIds),
  );
}

export function scoreShortAnswer(
  question: Question,
  answer: CandidateAnswer | undefined,
): ScoredResponse {
  if (question.answerKey.kind === "manual") return scoreEssay(question, answer);
  if (isUnanswered(answer)) return unanswered(question);
  const key = expectKey(question, "text");
  if (typeof answer !== "string") return objective(question, false);
  const options = {
    caseSensitive: key.caseSensitive,
    trimWhitespace: key.trimWhitespace,
  };
  const normalisedSubmission = normaliseText(answer, options);
  return objective(
    question,
    key.acceptableAnswers
      .map((accepted) => normaliseText(accepted, options))
      .includes(normalisedSubmission),
  );
}

export function scoreLabelDiagram(
  question: Question,
  answer: CandidateAnswer | undefined,
): ScoredResponse {
  if (isUnanswered(answer)) return unanswered(question);
  const key = expectKey(question, "matching");
  const expected = Object.fromEntries(
    key.pairs.map((pair) => [pair.sourceId, pair.targetId]),
  );
  return objective(
    question,
    isStringRecord(answer) && recordsMatch(answer, expected),
  );
}

export function scoreHotspot(
  question: Question,
  answer: CandidateAnswer | undefined,
): ScoredResponse {
  if (isUnanswered(answer)) return unanswered(question);
  const key = expectKey(question, "hotspot");
  return objective(
    question,
    isStringArray(answer) && arraysMatchAsSets(answer, key.regionIds),
  );
}

export function scoreDragDrop(
  question: Question,
  answer: CandidateAnswer | undefined,
): ScoredResponse {
  if (isUnanswered(answer)) return unanswered(question);
  const key = expectKey(question, "drag_drop");
  return objective(
    question,
    isStringRecord(answer) && recordsMatch(answer, key.placements),
  );
}

/**
 * Reading comprehension delegates to the scorer matching its configured
 * answer key rather than re-implementing option or text logic.
 */
export function scoreReadingComprehension(
  question: Question,
  answer: CandidateAnswer | undefined,
): ScoredResponse {
  switch (question.answerKey.kind) {
    case "single_option":
      return scoreMultipleChoice(question, answer);
    case "multiple_options":
      return scoreMultipleSelect(question, answer);
    case "boolean":
      return scoreTrueFalse(question, answer);
    case "text":
      return scoreShortAnswer(question, answer);
    default:
      return scoreEssay(question, answer);
  }
}

/**
 * Essays are never auto-marked. They always return a manual-review outcome so
 * an assessor can award marks later.
 */
export function scoreEssay(
  question: Question,
  _answer: CandidateAnswer | undefined,
): ScoredResponse {
  void _answer;
  return {
    status: "manual_review",
    correct: null,
    earnedMarks: null,
    availableMarks: marks(question),
    manualReviewRequired: true,
  };
}

/* Dispatcher */

const scorersByType: Record<
  Question["type"],
  (question: Question, answer: CandidateAnswer | undefined) => ScoredResponse
> = {
  multiple_choice: scoreMultipleChoice,
  multiple_select: scoreMultipleSelect,
  number_entry: scoreNumberEntry,
  fill_blank: scoreFillBlank,
  dropdown: scoreDropdown,
  true_false: scoreTrueFalse,
  matching: scoreMatching,
  ordering: scoreOrdering,
  short_answer: scoreShortAnswer,
  reading_comprehension: scoreReadingComprehension,
  essay: scoreEssay,
  label_diagram: scoreLabelDiagram,
  hotspot: scoreHotspot,
  drag_drop: scoreDragDrop,
};

export function scoreResponse(
  question: Question,
  answer: CandidateAnswer | undefined,
): ScoredResponse {
  return scorersByType[question.type](question, answer);
}
