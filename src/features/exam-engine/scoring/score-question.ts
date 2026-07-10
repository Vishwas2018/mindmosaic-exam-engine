import type { CandidateAnswer } from "@/features/exam-engine/types";
import type { AnswerKey, Question } from "@/schemas/question.schema";

export type ScoreStatus =
  | "correct"
  | "incorrect"
  | "manual_review"
  | "unanswered";

export interface QuestionScore {
  questionId: string;
  status: ScoreStatus;
  awardedMarks: number;
  availableMarks: number;
}

function isUnanswered(answer: CandidateAnswer | undefined): boolean {
  if (answer === undefined || answer === null) return true;
  if (typeof answer === "string") return answer.trim().length === 0;
  if (Array.isArray(answer)) return answer.length === 0;
  if (typeof answer === "object") return Object.keys(answer).length === 0;

  return false;
}

function arraysMatchAsSets(
  received: readonly string[],
  expected: readonly string[],
): boolean {
  if (received.length !== expected.length) return false;

  const receivedValues = new Set(received);
  const expectedValues = new Set(expected);
  return (
    receivedValues.size === received.length &&
    expectedValues.size === expected.length &&
    expected.every((value) => receivedValues.has(value))
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

function isStringRecord(
  answer: CandidateAnswer,
): answer is Readonly<Record<string, string>> {
  return (
    typeof answer === "object" &&
    answer !== null &&
    !Array.isArray(answer) &&
    Object.values(answer).every((value) => typeof value === "string")
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
  answerKey: Extract<AnswerKey, { kind: "text" }>,
): string {
  const whitespaceNormalised = answerKey.trimWhitespace
    ? value.trim().replace(/\s+/g, " ")
    : value;

  return answerKey.caseSensitive
    ? whitespaceNormalised
    : whitespaceNormalised.toLocaleLowerCase("en-AU");
}

function answerMatches(
  answerKey: AnswerKey,
  answer: CandidateAnswer,
): boolean {
  switch (answerKey.kind) {
    case "single_option":
      return typeof answer === "string" && answer === answerKey.optionId;
    case "multiple_options":
      return Array.isArray(answer) && arraysMatchAsSets(answer, answerKey.optionIds);
    case "number": {
      const numericAnswer =
        typeof answer === "number"
          ? answer
          : typeof answer === "string"
            ? Number(answer)
            : Number.NaN;

      return (
        Number.isFinite(numericAnswer) &&
        Math.abs(numericAnswer - answerKey.value) <= answerKey.tolerance
      );
    }
    case "text":
      return (
        typeof answer === "string" &&
        answerKey.acceptableAnswers
          .map((expected) => normaliseText(expected, answerKey))
          .includes(normaliseText(answer, answerKey))
      );
    case "boolean":
      return typeof answer === "boolean" && answer === answerKey.value;
    case "matching":
      return (
        isStringRecord(answer) &&
        recordsMatch(
          answer,
          Object.fromEntries(
            answerKey.pairs.map((pair) => [pair.sourceId, pair.targetId]),
          ),
        )
      );
    case "ordering":
      return Array.isArray(answer) && arraysMatchInOrder(answer, answerKey.optionIds);
    case "hotspot":
      return Array.isArray(answer) && arraysMatchAsSets(answer, answerKey.regionIds);
    case "drag_drop":
      return isStringRecord(answer) && recordsMatch(answer, answerKey.placements);
    case "manual":
      return false;
  }
}

export function scoreQuestion(
  question: Question,
  answer: CandidateAnswer | undefined,
): QuestionScore {
  const availableMarks = question.metadata.marks;

  if (isUnanswered(answer)) {
    return {
      questionId: question.id,
      status: "unanswered",
      awardedMarks: 0,
      availableMarks,
    };
  }

  if (question.answerKey.kind === "manual") {
    return {
      questionId: question.id,
      status: "manual_review",
      awardedMarks: 0,
      availableMarks,
    };
  }

  const isCorrect = answerMatches(question.answerKey, answer as CandidateAnswer);

  return {
    questionId: question.id,
    status: isCorrect ? "correct" : "incorrect",
    awardedMarks: isCorrect ? availableMarks : 0,
    availableMarks,
  };
}
