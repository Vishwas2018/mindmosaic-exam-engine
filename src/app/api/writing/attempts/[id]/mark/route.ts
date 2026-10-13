import { NextResponse } from "next/server";

import { markWritingAttemptRequestSchema } from "@/features/writing/contracts";
import { isResponse, readWritingRequest, writingError } from "@/server/writing/route-helpers";
import { markWritingAttempt } from "@/server/writing/service";

/**
 * A linked parent records rubric scores. No AI is involved anywhere on this
 * path (docs/design.md section 29.3): the scores are the parent's, the total
 * and ceiling are computed by the database from the stored rubric, and a caller
 * who is not linked to the child gets the same 404 as a missing attempt.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const ctx = await readWritingRequest(request, markWritingAttemptRequestSchema);
  if (isResponse(ctx)) return ctx;

  const { id } = await params;
  const outcome = await markWritingAttempt(ctx.supabase, id, {
    rubricId: ctx.body.rubricId,
    rubricVersion: ctx.body.rubricVersion,
    scores: ctx.body.scores,
    comments: ctx.body.comments ?? {},
    feedback: ctx.body.feedback ?? null,
  });
  if (!outcome.ok) return writingError(outcome.status, outcome.code);

  return NextResponse.json({ ok: true });
}
