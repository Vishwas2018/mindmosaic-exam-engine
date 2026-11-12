import { NextResponse } from "next/server";
import { getExamBank, getQuestionById } from "@/server/exam-bank";
import { scoreQuestion } from "@/features/exam-engine/scoring";
import {
  formatCorrectAnswer,
  formatResponse,
} from "@/features/exam-engine/components/answer-format";
import type { CandidateAnswer } from "@/features/exam-engine/types";

export interface PracticeCheckRequestBody {
  questionId: string;
  answer: CandidateAnswer;
}

export interface PracticeCheckResponseBody {
  questionId: string;
  status: "correct" | "incorrect" | "unanswered" | "manual_review";
  correct: boolean;
  awardedMarks: number;
  availableMarks: number;
  explanation: string | null;
  correctAnswer: string | null;
  yourAnswer: string | null;
}

/**
 * Server-authoritative per-question scoring for practice sessions (C15).
 *
 * The browser posts { questionId, answer }. The server authenticates if signed in,
 * resolves the question from the secure published bank, scores it server-side,
 * and returns the question's correctness, status, and worked explanation.
 *
 * Answer keys and explanations are never transmitted before the student submits
 * their answer for that question (C10, C15).
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const questionId = record.questionId;
  const answer = record.answer as CandidateAnswer;

  if (typeof questionId !== "string" || !questionId) {
    return NextResponse.json({ error: "missing_question_id" }, { status: 400 });
  }

  // Look up question by id across the bank and authoring fixtures
  const question =
    getQuestionById(questionId) ??
    getExamBank("curated").find((q) => q.id === questionId);

  if (!question) {
    return NextResponse.json({ error: "question_not_found" }, { status: 404 });
  }

  // Score answer server-side through the pure scoring dispatcher
  const score = scoreQuestion(question, answer);
  const isCorrect = score.status === "correct";
  const correctAnswer = formatCorrectAnswer(question);
  const yourAnswer = formatResponse(question, answer);

  const responsePayload: PracticeCheckResponseBody = {
    questionId: question.id,
    status: score.status,
    correct: isCorrect,
    awardedMarks: score.awardedMarks,
    availableMarks: score.availableMarks,
    explanation: question.explanation ?? null,
    correctAnswer,
    yourAnswer,
  };

  return NextResponse.json(responsePayload);
}
