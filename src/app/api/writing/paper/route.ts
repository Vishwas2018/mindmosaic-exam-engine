import { NextResponse } from "next/server";

import { paperWritingAttemptRequestSchema } from "@/features/writing/contracts";
import { resolveWritingTask } from "@/features/writing/task";
import { isResponse, readWritingRequest, writingError } from "@/server/writing/route-helpers";
import { recordMarkedPaperAttempt, recordPaperWritingAttempt, toAttemptDto } from "@/server/writing/service";

/**
 * A linked parent records an attempt their child sat on paper. Typing the
 * response in is optional. With `mark`, the six rubric scores are recorded in
 * the same step ("marked on paper"); without it the attempt is left ready for
 * marking on the marking screen.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const ctx = await readWritingRequest(request, paperWritingAttemptRequestSchema);
  if (isResponse(ctx)) return ctx;

  const task = resolveWritingTask(ctx.body.taskId);
  if (!task) return writingError(404, "unknown_task");

  const durationSeconds = ctx.body.durationMinutes ? ctx.body.durationMinutes * 60 : null;
  const text = ctx.body.text && ctx.body.text.trim() !== "" ? ctx.body.text : null;
  const { mark } = ctx.body;

  const outcome = mark
    ? await recordMarkedPaperAttempt(ctx.supabase, {
        childId: ctx.body.childId,
        taskId: task.id,
        text,
        durationSeconds,
        rubricId: mark.rubricId,
        rubricVersion: mark.rubricVersion,
        scores: mark.scores,
        comments: mark.comments ?? {},
        feedback: mark.feedback ?? null,
      })
    : await recordPaperWritingAttempt(ctx.supabase, {
        childId: ctx.body.childId,
        taskId: task.id,
        text,
        durationSeconds,
      });
  if (!outcome.ok) return writingError(outcome.status, outcome.code);

  return NextResponse.json({ attempt: toAttemptDto(outcome.value) });
}
