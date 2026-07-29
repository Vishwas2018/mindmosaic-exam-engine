import type { AssignmentStudentStatus } from "./assignment-contract";

/**
 * Pure lifecycle classification for the Assignment Management board's
 * Active/Upcoming/Completed tabs, plus a mocked archive action (there is
 * no `archived_at` column yet — archiving hides an assignment client-side
 * for the session, same "mocked behind a typed function" approach as
 * mock-notes.ts).
 */

export type AssignmentLifecycleStatus = "upcoming" | "active" | "completed";

export interface LifecycleAssignmentInput {
  dueAt: string | null;
  students: readonly { status: AssignmentStudentStatus }[];
}

export function categorizeAssignment(
  assignment: LifecycleAssignmentInput,
  now: number = Date.now(),
): AssignmentLifecycleStatus {
  const { students, dueAt } = assignment;
  const allSubmitted =
    students.length > 0 && students.every((student) => student.status === "submitted");
  if (allSubmitted) return "completed";

  const dueTime = dueAt ? Date.parse(dueAt) : NaN;
  const notYetDue = !Number.isNaN(dueTime) && dueTime > now;
  const noneStarted = students.every((student) => student.status === "assigned");
  if (notYetDue && noneStarted) return "upcoming";

  return "active";
}

export interface ArchiveResult {
  assignmentId: string;
  archivedAt: string;
}

/** Mocked archive action — resolves immediately, no persistence layer yet. */
export async function archiveAssignment(assignmentId: string): Promise<ArchiveResult> {
  return { assignmentId, archivedAt: new Date().toISOString() };
}
