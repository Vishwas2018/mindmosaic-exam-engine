import { z } from "zod";

/**
 * Client-safe types and parsers for the student assignments view.
 *
 * The assignments/assignment_students tables exist (Phase 0 schema) but no
 * teacher tooling writes them yet — a separate thread builds that. The
 * `config` jsonb is therefore parsed deliberately loosely: the documented
 * expectation (docs/DATA_MODEL_AND_ROLES.md) is an exam-selection-style
 * config like exam_sessions.config, and an optional human `title` is
 * tolerated because a teacher UI will almost certainly want one. Every
 * field is optional and unknown keys pass through, so whatever row shape
 * the teacher-side thread settles on renders as gracefully as possible
 * until the two are reconciled.
 */

export const assignmentStatusSchema = z.enum([
  "assigned",
  "in_progress",
  "submitted",
]);

export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;

export const assignmentConfigSchema = z.looseObject({
  title: z.string().trim().min(1).optional(),
  yearLevel: z.union([z.literal(3), z.literal(5), z.literal("mixed")]).optional(),
  examStyle: z.enum(["naplan_style", "icas_style", "mixed"]).optional(),
  subject: z.enum(["numeracy", "reading", "language", "mixed"]).optional(),
  questionCount: z
    .union([z.number().int().positive(), z.literal("full")])
    .optional(),
  timing: z.enum(["timed", "untimed"]).optional(),
});

export type AssignmentConfig = z.infer<typeof assignmentConfigSchema>;

/** Subset of the stored ExamResult a completed assignment card displays. */
export const attemptScoreSchema = z.looseObject({
  objectivePercentage: z.number().min(0).max(100),
  correctCount: z.number().int().min(0),
  totalQuestions: z.number().int().min(0),
});

export type AttemptScore = z.infer<typeof attemptScoreSchema>;

/** View model the assignments page renders. Fully serialisable. */
export interface StudentAssignment {
  assignmentId: string;
  status: AssignmentStatus;
  config: AssignmentConfig;
  /** Name of the class the assignment was made through, when readable. */
  className: string | null;
  /** ISO timestamps (or null when the column is null). */
  dueAt: string | null;
  createdAt: string;
  submittedAt: string | null;
  score: AttemptScore | null;
}
