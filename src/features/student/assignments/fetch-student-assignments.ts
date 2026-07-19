import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import {
  assignmentConfigSchema,
  assignmentStatusSchema,
  attemptScoreSchema,
  type StudentAssignment,
} from "./types";

/**
 * Reads the signed-in student's assignments. RLS scopes every query:
 * assignment_students to student_id = auth.uid(), assignments to rows the
 * student is assigned to, classes to classes they are a member of, and
 * exam_attempts to their own attempts. The teacher's profile is NOT
 * readable under RLS, so cards show the class name, never "Assigned by".
 */

const rowSchema = z.object({
  status: assignmentStatusSchema,
  attempt_id: z.string().nullable(),
  assignment: z.object({
    id: z.string(),
    config: z.unknown(),
    due_at: z.string().nullable(),
    created_at: z.string(),
    class: z.object({ name: z.string() }).nullable(),
  }),
});

const attemptRowSchema = z.object({
  id: z.string(),
  submitted_at: z.string(),
  result: z.unknown(),
});

export type FetchAssignmentsResult =
  | { ok: true; assignments: StudentAssignment[] }
  | { ok: false };

export async function fetchStudentAssignments(
  studentId: string,
): Promise<FetchAssignmentsResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assignment_students")
    .select(
      "status, attempt_id, assignment:assignments!inner(id, config, due_at, created_at, class:classes(name))",
    )
    .eq("student_id", studentId);
  if (error || !data) return { ok: false };

  const rows = z.array(rowSchema).safeParse(data);
  if (!rows.success) return { ok: false };

  /* Scores for submitted assignments come from the linked attempt rows. */
  const attemptIds = rows.data
    .map((row) => row.attempt_id)
    .filter((id): id is string => id !== null);
  const attempts = new Map<
    string,
    { submittedAt: string; result: unknown }
  >();
  if (attemptIds.length > 0) {
    const { data: attemptData, error: attemptError } = await supabase
      .from("exam_attempts")
      .select("id, submitted_at, result")
      .in("id", attemptIds);
    if (attemptError) return { ok: false };
    for (const raw of attemptData ?? []) {
      const parsed = attemptRowSchema.safeParse(raw);
      if (parsed.success) {
        attempts.set(parsed.data.id, {
          submittedAt: parsed.data.submitted_at,
          result: parsed.data.result,
        });
      }
    }
  }

  const assignments = rows.data.map((row): StudentAssignment => {
    const attempt = row.attempt_id ? attempts.get(row.attempt_id) : undefined;
    const score = attempt
      ? attemptScoreSchema.safeParse(attempt.result)
      : undefined;
    const config = assignmentConfigSchema.safeParse(row.assignment.config);
    return {
      assignmentId: row.assignment.id,
      status: row.status,
      /* Malformed config never breaks the page — render what we can. */
      config: config.success ? config.data : {},
      className: row.assignment.class?.name ?? null,
      dueAt: row.assignment.due_at,
      createdAt: row.assignment.created_at,
      submittedAt: attempt?.submittedAt ?? null,
      score: score?.success ? score.data : null,
    };
  });

  return { ok: true, assignments };
}
