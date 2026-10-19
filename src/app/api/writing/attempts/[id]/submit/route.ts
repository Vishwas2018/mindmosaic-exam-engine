import { NextResponse } from "next/server";

import { submitWritingAttemptRequestSchema } from "@/features/writing/contracts";
import { isResponse, readWritingRequest, writingError } from "@/server/writing/route-helpers";
import { submitWritingAttempt, toAttemptDto } from "@/server/writing/service";

/**
 * Submits an attempt. The reason is advisory: at or after the stored deadline
 * the database records `timer_expired` whatever was sent, and clamps the
 * recorded time to the deadline (the same rule as state/deadline.ts).
 * Submitting twice is harmless.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const ctx = await readWritingRequest(request, submitWritingAttemptRequestSchema);
  if (isResponse(ctx)) return ctx;

  const { id } = await params;
  const outcome = await submitWritingAttempt(ctx.supabase, id, ctx.body);
  if (!outcome.ok) return writingError(outcome.status, outcome.code);

  return NextResponse.json({ attempt: toAttemptDto(outcome.value) });
}
