import { NextResponse } from "next/server";

import { startWritingAttemptRequestSchema } from "@/features/writing/contracts";
import { resolveWritingTask } from "@/features/writing/task";
import { isResponse, readWritingRequest, writingError } from "@/server/writing/route-helpers";
import { startWritingAttempt, toAttemptDto } from "@/server/writing/service";

/**
 * Starts (or resumes) a child's writing attempt. The time limit comes from the
 * task the SERVER resolves, never from the request, and the deadline is then
 * fixed by the database. A task id that is not published (or not the dev
 * fixture while the preview gate is open) is a 404: fail closed.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const ctx = await readWritingRequest(request, startWritingAttemptRequestSchema);
  if (isResponse(ctx)) return ctx;

  const task = resolveWritingTask(ctx.body.taskId);
  if (!task) return writingError(404, "unknown_task");

  const outcome = await startWritingAttempt(ctx.supabase, {
    taskId: task.id,
    mode: ctx.body.mode,
    durationSeconds: ctx.body.mode === "timed" ? task.timeLimitMinutes * 60 : null,
  });
  if (!outcome.ok) return writingError(outcome.status, outcome.code);

  return NextResponse.json({ attempt: toAttemptDto(outcome.value) });
}
