import { NextResponse } from "next/server";
import { checkOrigin } from "@/features/auth/require-origin";
import { scoreQuestion, isUnanswered } from "@/features/exam-engine/scoring";
import {
  formatCorrectAnswer,
  formatResponse,
} from "@/features/exam-engine/components/answer-format";
import type { CandidateAnswer } from "@/features/exam-engine/types";
import { getExamBank } from "@/server/exam-bank";
import { getSignedInUserId } from "@/server/practice-session-user";
import { verifyPracticeToken } from "@/server/practice-session-token";

export interface PracticeCheckRequestBody {
  questionId: string;
  answer: CandidateAnswer;
  /** Token returned by /api/practice/session/questions for the set this question was served in. */
  practiceToken: string;
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

/** One indistinguishable refusal for every "you may not check this id" case, so the route is not an existence oracle. */
function notCheckable(): NextResponse {
  return NextResponse.json({ error: "question_not_found" }, { status: 404 });
}

/**
 * Server-authoritative per-question scoring for practice sessions (C15).
 *
 * The browser posts { questionId, answer, practiceToken }. The server:
 *   1. requires a valid, unexpired practice token (issued by /api/practice/session/questions) whose delivered
 *      question ids include `questionId` — so only questions the server itself served in a live set can be checked;
 *   2. resolves the question from the publication-gated served bank only (never the raw authored bank), so an
 *      unapproved item can never be scored or disclosed on a deployed build;
 *   3. requires the signed-in user the token was bound to for signed-in-only (scholarship-style) content;
 *   4. refuses an empty answer, so the answer key and explanation are disclosed only after an attempt.
 *
 * Answer keys and explanations are never transmitted before the student submits their answer (C10, C15). Defect A-01.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const originCheck = checkOrigin(request);
  if (!originCheck.ok) return originCheck.response;

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

  if (typeof questionId !== "string" || !questionId || questionId.length > 200) {
    return NextResponse.json({ error: "missing_question_id" }, { status: 400 });
  }

  const verdict = verifyPracticeToken(record.practiceToken);
  if (!verdict.ok) {
    if (verdict.reason === "unavailable") {
      return NextResponse.json({ error: "practice_unavailable" }, { status: 503 });
    }
    return NextResponse.json({ error: "invalid_practice_session" }, { status: 403 });
  }
  if (!verdict.claims.ids.includes(questionId)) return notCheckable();

  // Publication-gated bank only: an unapproved item is not served, so it cannot be checked either.
  const question = getExamBank("practice").find((q) => q.id === questionId);
  if (!question) return notCheckable();

  if (question.examStyle === "scholarship_style") {
    const userId = await getSignedInUserId();
    if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    if (verdict.claims.sub !== userId) return notCheckable();
  }

  if (answer === undefined || answer === null || isUnanswered(answer)) {
    return NextResponse.json({ error: "answer_required" }, { status: 400 });
  }

  const score = scoreQuestion(question, answer);
  const isCorrect = score.status === "correct";

  const responsePayload: PracticeCheckResponseBody = {
    questionId: question.id,
    status: score.status,
    correct: isCorrect,
    awardedMarks: score.awardedMarks,
    availableMarks: score.availableMarks,
    explanation: question.explanation ?? null,
    correctAnswer: formatCorrectAnswer(question),
    yourAnswer: formatResponse(question, answer),
  };

  return NextResponse.json(responsePayload);
}
