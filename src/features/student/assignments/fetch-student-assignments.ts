import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { fetchSittingRowsWithIdentity } from "@/server/assessment/read-dispatch";

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
  /* The target model's counterpart, added by 20260816110000. Mutually exclusive
     with attempt_id by check constraint, which is what makes "resolve whichever
     one is set" unambiguous rather than a preference. */
  session_id: z.string().nullable(),
  assignment: z.object({
    id: z.string(),
    config: z.unknown(),
    due_at: z.string().nullable(),
    created_at: z.string(),
    class: z.object({ name: z.string() }).nullable(),
  }),
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
      "status, attempt_id, session_id, assignment:assignments!inner(id, config, due_at, created_at, class:classes(name))",
    )
    .eq("student_id", studentId);
  if (error || !data) return { ok: false };

  const rows = z.array(rowSchema).safeParse(data);
  if (!rows.success) return { ok: false };

  /* Scores for submitted assignments come from the linked sitting, on whichever
     model created it (§12.7 step 8, ADR-005 §7 workflow move 5). One lookup
     serves both: `fetchSittingRowsWithIdentity` resolves through
     `visible_sittings`, which already contains each sitting exactly once from
     its origin — so a backfilled sitting is resolved from its legacy source and
     its target-model copy is not a second row here either.
     `assignment_students` carries at most one of the two ids per row by check
     constraint, so nothing can be attributed twice from this side. */
  const linked = new Map<string, { submittedAt: string; result: unknown }>();
  const wanted = new Set(
    rows.data.flatMap((row) => [row.attempt_id, row.session_id].filter((id) => id !== null)),
  );
  if (wanted.size > 0) {
    for (const sitting of await fetchSittingRowsWithIdentity(supabase, { limit: null })) {
      /* Keyed by whichever identity the assignment row holds. A sitting is
         reachable under its session id on both models and additionally under
         its attempt id on the legacy one, which is exactly the pair of columns
         `assignment_students` can carry. */
      for (const id of [sitting.attemptId, sitting.sessionId]) {
        if (id !== null && wanted.has(id)) {
          linked.set(id, {
            submittedAt: sitting.row.submitted_at,
            result: sitting.row.result,
          });
        }
      }
    }
  }

  const assignments = rows.data.map((row): StudentAssignment => {
    const key = row.attempt_id ?? row.session_id;
    const sitting = key ? linked.get(key) : undefined;
    const score = sitting ? attemptScoreSchema.safeParse(sitting.result) : undefined;
    const config = assignmentConfigSchema.safeParse(row.assignment.config);
    return {
      assignmentId: row.assignment.id,
      /* Derived from the sitting rather than from the stored column when there
         is one, because nothing advances that column after the teacher creates
         the row: an assignment whose sitting has been submitted IS submitted,
         and reporting "assigned" beside a score would be the screen disagreeing
         with itself. Unlinked rows keep the stored value, unchanged. */
      status: sitting ? "submitted" : row.status,
      /* Malformed config never breaks the page — render what we can. */
      config: config.success ? config.data : {},
      className: row.assignment.class?.name ?? null,
      dueAt: row.assignment.due_at,
      createdAt: row.assignment.created_at,
      submittedAt: sitting?.submittedAt ?? null,
      score: score?.success ? score.data : null,
    };
  });

  return { ok: true, assignments };
}
