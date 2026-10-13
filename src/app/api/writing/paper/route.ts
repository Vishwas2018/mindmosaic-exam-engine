import { NextResponse } from "next/server";

import { paperWritingAttemptRequestSchema } from "@/features/writing/contracts";
import { resolveWritingTask } from "@/features/writing/task";
import { isResponse, readWritingRequest, writingError } from "@/server/writing/route-helpers";
import { recordPaperWritingAttempt, toAttemptDto } from "@/server/writing/service";

/** A linked parent types in what their child wrote on paper, ready for marking. */
export async function POST(request: Request): Promise<NextResponse> {
  const ctx = await readWritingRequest(request, paperWritingAttemptRequestSchema);
  if (isResponse(ctx)) return ctx;

  const task = resolveWritingTask(ctx.body.taskId);
  if (!task) return writingError(404, "unknown_task");

  const outcome = await recordPaperWritingAttempt(ctx.supabase, {
    childId: ctx.body.childId,
    taskId: task.id,
    text: ctx.body.text,
    durationSeconds: ctx.body.durationMinutes ? ctx.body.durationMinutes * 60 : null,
  });
  if (!outcome.ok) return writingError(outcome.status, outcome.code);

  return NextResponse.json({ attempt: toAttemptDto(outcome.value) });
}
