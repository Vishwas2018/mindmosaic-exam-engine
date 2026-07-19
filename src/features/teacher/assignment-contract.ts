import { z } from "zod";

import {
  examBankIdSchema,
  examSelectionConfigSchema,
} from "@/features/exam-engine/scoring/server-scoring-contract";

/**
 * Request/response contract for teacher assignment creation. Client-safe:
 * only zod schemas and types — never a question bank or Supabase import.
 *
 * The `assignments.config` jsonb deliberately mirrors the shape already
 * stored in `exam_sessions.config` ({ ...ExamSelectionConfig, bankId }) so
 * the student-side read path can hand it straight to the existing
 * server-session endpoint; `examSelectionConfigSchema.safeParse` strips the
 * extra presentation keys (`title`) without complaint. Table columns are
 * exactly the ones in docs/DATA_MODEL_AND_ROLES.md — nothing new.
 */

export const assignmentConfigSchema = examSelectionConfigSchema.extend({
  bankId: examBankIdSchema.default("curated"),
  /** Display name shown to teacher and students; presentation-only. */
  title: z.string().trim().min(1).max(120),
});

export type AssignmentConfig = z.infer<typeof assignmentConfigSchema>;

export const createAssignmentRequestSchema = z.object({
  classId: z.uuid(),
  config: assignmentConfigSchema,
  /** ISO timestamp; null means no due date. */
  dueAt: z.iso.datetime({ offset: true }).nullable().default(null),
  /**
   * Explicit roster selection. Empty is rejected — an assignment nobody
   * receives is always a form mistake. The server additionally intersects
   * these ids with the class roster so a request can never attach a
   * student from outside the teacher's own class.
   */
  studentIds: z.array(z.uuid()).min(1).max(200),
});

export type CreateAssignmentRequest = z.infer<typeof createAssignmentRequestSchema>;

export interface CreateAssignmentResponse {
  assignmentId: string;
  assignedCount: number;
}

/** Statuses a row in assignment_students can hold (mirrors the DB check). */
export const ASSIGNMENT_STUDENT_STATUSES = [
  "assigned",
  "in_progress",
  "submitted",
] as const;

export type AssignmentStudentStatus = (typeof ASSIGNMENT_STUDENT_STATUSES)[number];
