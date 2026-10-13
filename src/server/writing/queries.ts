import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { WritingAttemptDto, WritingMarkDto } from "@/features/writing/contracts";

import { MARK_SELECT, toAttemptDto, toMarkDto, type WritingAttemptRow } from "./service";

/**
 * Read paths for the writing pages. Every query runs as the signed-in user
 * through RLS, so a child sees their own attempts and marks, a parent sees
 * their linked children's, and nobody else sees anything. Nothing here
 * touches exam_attempts, assessment_results or any numeracy/reading summary,
 * which is how writing stays out of those results.
 */

export interface WritingHistoryItem {
  attempt: WritingAttemptDto;
  mark: WritingMarkDto | null;
}

type AttemptWithMark = WritingAttemptRow & {
  student_id: string;
  writing_marks: Parameters<typeof toMarkDto>[0] | Parameters<typeof toMarkDto>[0][] | null;
};

const ATTEMPT_SELECT = `id, student_id, task_id, mode, duration_seconds, started_at, deadline_at, response_text,
  response_source, submitted_at, submission_reason, writing_marks(${MARK_SELECT})`;

function toHistoryItem(row: AttemptWithMark, serverNow: number): WritingHistoryItem & { studentId: string } {
  const markRow = Array.isArray(row.writing_marks) ? (row.writing_marks[0] ?? null) : row.writing_marks;
  return {
    studentId: row.student_id,
    attempt: toAttemptDto(row, serverNow),
    mark: markRow ? toMarkDto(markRow) : null,
  };
}

/** Newest first. `studentIds` narrows to specific children; RLS decides what is visible regardless. */
export async function loadWritingHistory(
  supabase: SupabaseClient,
  options: { studentIds?: string[]; taskId?: string; submittedOnly?: boolean } = {},
): Promise<(WritingHistoryItem & { studentId: string })[]> {
  let query = supabase.from("writing_attempts").select(ATTEMPT_SELECT).order("started_at", { ascending: false }).limit(200);
  if (options.studentIds) query = query.in("student_id", options.studentIds);
  if (options.taskId) query = query.eq("task_id", options.taskId);
  if (options.submittedOnly) query = query.not("submitted_at", "is", null);
  const { data, error } = await query;
  if (error || !data) return [];
  const serverNow = Date.now();
  return (data as unknown as AttemptWithMark[]).map((row) => toHistoryItem(row, serverNow));
}

export async function loadOpenWritingAttempt(
  supabase: SupabaseClient,
  studentId: string,
  taskId: string,
): Promise<WritingAttemptDto | null> {
  const { data } = await supabase
    .from("writing_attempts")
    .select(ATTEMPT_SELECT)
    .eq("student_id", studentId)
    .eq("task_id", taskId)
    .is("submitted_at", null)
    .maybeSingle();
  return data ? toAttemptDto(data as unknown as AttemptWithMark) : null;
}

export async function loadWritingAttempt(
  supabase: SupabaseClient,
  attemptId: string,
): Promise<(WritingHistoryItem & { studentId: string }) | null> {
  const { data } = await supabase.from("writing_attempts").select(ATTEMPT_SELECT).eq("id", attemptId).maybeSingle();
  return data ? toHistoryItem(data as unknown as AttemptWithMark, Date.now()) : null;
}

export interface LinkedChild {
  id: string;
  name: string;
}

/** The signed-in parent's linked children, via the same RLS the dashboard uses. */
export async function loadLinkedChildren(supabase: SupabaseClient, parentId: string): Promise<LinkedChild[]> {
  const { data: links } = await supabase.from("parent_children").select("child_id").eq("parent_id", parentId);
  const ids = (links ?? []).map((link) => link.child_id as string);
  if (ids.length === 0) return [];
  const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", ids);
  return (profiles ?? []).map((profile) => ({
    id: profile.id as string,
    name: (profile.display_name as string | null) ?? "Your child",
  }));
}
