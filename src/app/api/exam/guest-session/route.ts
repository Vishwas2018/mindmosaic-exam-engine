import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { checkOrigin } from "@/features/auth/require-origin";
import { getExamPattern, patternExamConfig, selectPatternQuestions, sessionDurationSeconds } from "@/features/exam-engine/exam-patterns";
import { buildExamResult, isUnanswered } from "@/features/exam-engine/scoring";
import { createSessionRequestSchema, submitSessionRequestSchema } from "@/features/exam-engine/scoring/server-scoring-contract";
import { selectExamQuestions } from "@/features/exam-engine/selection";
import { toCandidateQuestions, type CandidateAnswer, type ExamResponses } from "@/features/exam-engine/types";
import { getEffectiveSubmissionReason, getEffectiveSubmittedAt } from "@/features/exam-engine/state/deadline";
import { getGuestExamBank } from "@/server/exam-bank";
import { practiceTokenKey } from "@/server/practice-session-token";

const cookieName = "mm-guest-exam";
const ttlSeconds = 4 * 60 * 60;
const startSchema = z.object({
  selection: createSessionRequestSchema,
  seed: z.string().min(1).max(200).optional(),
  confidenceMode: z.boolean().optional(),
});
const ticketSchema = startSchema.extend({
  seed: z.string().min(1).max(200),
  id: z.uuid(),
  startedAt: z.int().positive(),
  revisionHash: z.string().length(64),
});
const submitSchema = submitSessionRequestSchema.extend({ ticket: z.string().max(8192) });
const feedbackSchema = z.object({
  ticket: z.string().max(8192),
  questionId: z.string().min(1).max(200),
  answer: z.unknown(),
});

type Selection = z.infer<typeof startSchema> & { seed: string };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

function unavailable() {
  return json({ error: "session_unavailable" }, 404);
}

function allocate({ selection, seed, confidenceMode }: Selection) {
  const bankId = selection.patternId || selection.bankId !== "curated" ? "published" : "curated";
  const bank = getGuestExamBank(bankId);
  if (selection.patternId) {
    const pattern = getExamPattern(selection.patternId);
    if (!pattern || pattern.status !== "available" || pattern.guestAccess === "signed_in_only") return null;
    const picked = selectPatternQuestions(bank, pattern, seed, selection);
    if (!picked.ok) return null;
    return {
      bankId,
      questions: picked.questions,
      config: patternExamConfig(pattern, picked.questions.length, picked.reduced, confidenceMode),
    };
  }
  const requested = selection.config;
  if (!requested || requested.examStyle === "scholarship_style" || requested.patternId) return null;
  const config = {
    ...requested,
    confidenceMode: requested.timing === "untimed" && requested.confidenceMode === true,
  };
  const picked = selectExamQuestions(bank, config, seed);
  return picked.ok ? { bankId, questions: picked.questions, config } : null;
}

function fingerprint(allocation: NonNullable<ReturnType<typeof allocate>>) {
  return createHash("sha256").update(JSON.stringify(allocation)).digest("hex");
}

function signature(payload: string, browser: string, key: Buffer) {
  return createHmac("sha256", key).update("guest-exam/v1\0").update(browser)
    .update("\0").update(payload).digest();
}

function verify(ticket: string, browser: string, key: Buffer) {
  const parts = ticket.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [payload, encoded] = parts;
  const received = Buffer.from(encoded, "base64url");
  const expected = signature(payload, browser, key);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const parsed = ticketSchema.safeParse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    if (!parsed.success || Date.now() - parsed.data.startedAt >= ttlSeconds * 1000) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function readJson(request: Request) {
  try {
    return await request.json() as unknown;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (!origin.ok) return origin.response;
  const key = practiceTokenKey();
  if (!key) return json({ error: "guest_session_unavailable" }, 503);
  const input = startSchema.safeParse(await readJson(request));
  if (!input.success) return json({ error: "invalid_request" }, 400);

  if (input.data.selection.bankId === "practice") return json({ error: "invalid_bank" }, 400);
  const seed = input.data.seed ?? randomUUID();
  const allocation = allocate({ ...input.data, seed });
  if (!allocation) return unavailable();

  const cookieStore = await cookies();
  const browser = cookieStore.get(cookieName)?.value || randomUUID();
  const claims = {
    ...input.data, seed, id: randomUUID(), startedAt: Date.now(), revisionHash: fingerprint(allocation),
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const response = json({
    ticket: payload + "." + signature(payload, browser, key).toString("base64url"),
    sessionId: claims.id,
    startedAt: claims.startedAt,
    bankId: allocation.bankId,
    config: allocation.config,
    durationSeconds: sessionDurationSeconds(allocation.config, allocation.questions),
    questions: toCandidateQuestions(allocation.questions),
  }, 201);
  response.cookies.set(cookieName, browser, {
    httpOnly: true, sameSite: "strict", secure: new URL(request.url).protocol === "https:", path: "/api/exam/guest-session", maxAge: ttlSeconds,
  });
  return response;
}

async function resolve(ticket: string) {
  const browser = (await cookies()).get(cookieName)?.value;
  const key = practiceTokenKey();
  const claims = browser && key ? verify(ticket, browser, key) : null;
  const allocation = claims && allocate(claims);
  return claims && allocation && fingerprint(allocation) === claims.revisionHash
    ? { claims, allocation }
    : null;
}

export async function PUT(request: Request) {
  const origin = checkOrigin(request);
  if (!origin.ok) return origin.response;
  const input = submitSchema.safeParse(await readJson(request));
  if (!input.success) return json({ error: "invalid_request" }, 400);
  const session = await resolve(input.data.ticket);
  if (!session) return unavailable();

  const { claims, allocation } = session;
  const ids = new Set(allocation.questions.map(({ id }) => id));
  const responses = input.data.responses as ExamResponses;
  if (Object.keys(responses).some((id) => !ids.has(id))) return json({ error: "invalid_request" }, 400);
  const duration = sessionDurationSeconds(allocation.config, allocation.questions);
  const deadline = duration === null ? null : claims.startedAt + duration * 1000;
  const now = Date.now();
  /*
   * A guest sitting is never persisted, so the candidate's own report that the
   * timer ran out is honoured for a timed ticket (the e2e clock and a skewed
   * device clock both reach here before the server clock does). Otherwise the
   * server clock decides, exactly as the signed-in submit route does.
   */
  const claimedExpiry = input.data.submissionReason === "timer_expired" && deadline !== null;
  const submittedAt = claimedExpiry ? deadline : getEffectiveSubmittedAt(now, deadline);
  const submissionReason = claimedExpiry
    ? "timer_expired"
    : getEffectiveSubmissionReason("user_submitted", deadline, now);
  const result = buildExamResult(allocation.questions, responses, {
    startedAt: claims.startedAt, submittedAt, submissionReason,
  });
  const attempted = new Set(result.questionDetails.filter((detail) => detail.attempted).map((detail) => detail.questionId));
  return json({
    result,
    reviewQuestions: allocation.questions.filter(({ id }) => attempted.has(id)),
  });
}

export async function PATCH(request: Request) {
  const origin = checkOrigin(request);
  if (!origin.ok) return origin.response;
  const input = feedbackSchema.safeParse(await readJson(request));
  if (!input.success || isUnanswered(input.data.answer as CandidateAnswer)) return json({ error: "answer_required" }, 400);
  const session = await resolve(input.data.ticket);
  if (!session || session.allocation.config.timing !== "untimed" || !session.allocation.config.confidenceMode) return unavailable();
  const question = session.allocation.questions.find(({ id }) => id === input.data.questionId);
  if (!question) return unavailable();
  return json({ explanation: question.explanation ?? null });
}
