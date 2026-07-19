import "server-only";

import { redirect } from "next/navigation";
import { z } from "zod";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

import type { StudentAttempt } from "./analytics";
import { ASSIGNMENT_STUDENT_STATUSES } from "./assignment-contract";

/**
 * Read-side data access for the teacher views. Every query here runs as
 * the signed-in teacher through the anon-key server client, so Row Level
 * Security is the enforcement mechanism: the class_students/classes
 * policies (docs/DATA_MODEL_AND_ROLES.md) scope every row to classes this
 * teacher owns. No service-role key is ever used on these paths.
 *
 * Rows are zod-parsed at the boundary because the Supabase client is
 * untyped here; malformed rows fail loudly in one place instead of deep
 * inside a page render.
 */

type Supabase = SupabaseClient;

export interface TeacherIdentity {
  userId: string;
  displayName: string | null;
}

/**
 * Resolve the signed-in teacher's identity. Auth + the teacher-role gate
 * already ran in src/app/teacher/layout.tsx before this renders, so this
 * only resolves display data for the confirmed teacher.
 */
export async function requireTeacher(): Promise<TeacherIdentity> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    /* Unreachable once the layout gate has run; kept for type safety. */
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return { userId: user.id, displayName: profile?.display_name ?? null };
}

const classRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  year_level: z.number().nullable(),
});

export interface TeacherClass {
  id: string;
  name: string;
  yearLevel: number | null;
}

export async function listTeacherClasses(supabase: Supabase): Promise<TeacherClass[]> {
  const { data, error } = await supabase
    .from("classes")
    .select("id, name, year_level")
    .order("name");
  if (error) throw new Error(`classes query failed: ${error.message}`);
  return z
    .array(classRowSchema)
    .parse(data ?? [])
    .map((row) => ({ id: row.id, name: row.name, yearLevel: row.year_level }));
}

const rosterRowSchema = z.object({
  student_id: z.uuid(),
  profiles: z
    .object({
      display_name: z.string().nullable(),
      year_level: z.number().nullable(),
    })
    .nullable(),
});

export interface RosterStudent {
  studentId: string;
  displayName: string | null;
  yearLevel: number | null;
}

export async function getClassRoster(
  supabase: Supabase,
  classId: string,
): Promise<RosterStudent[]> {
  const { data, error } = await supabase
    .from("class_students")
    .select("student_id, profiles(display_name, year_level)")
    .eq("class_id", classId);
  if (error) throw new Error(`roster query failed: ${error.message}`);
  return z
    .array(rosterRowSchema)
    .parse(data ?? [])
    .map((row) => ({
      studentId: row.student_id,
      displayName: row.profiles?.display_name ?? null,
      yearLevel: row.profiles?.year_level ?? null,
    }))
    .sort((a, b) => (a.displayName ?? "").localeCompare(b.displayName ?? ""));
}

const attemptRowSchema = z.object({
  student_id: z.uuid(),
  submitted_at: z.string(),
  result: z.unknown(),
});

/**
 * All attempts for the given students (RLS re-checks each row against the
 * teacher's own classes — passing an out-of-class id returns nothing for
 * it rather than leaking).
 */
export async function listStudentAttempts(
  supabase: Supabase,
  studentIds: readonly string[],
): Promise<StudentAttempt[]> {
  if (studentIds.length === 0) return [];
  const { data, error } = await supabase
    .from("exam_attempts")
    .select("student_id, submitted_at, result")
    .in("student_id", [...studentIds])
    .order("submitted_at", { ascending: false });
  if (error) throw new Error(`attempts query failed: ${error.message}`);
  return z
    .array(attemptRowSchema)
    .parse(data ?? [])
    .map((row) => ({
      studentId: row.student_id,
      submittedAt: row.submitted_at,
      result: row.result,
    }));
}

const assignmentStudentStatusSchema = z.enum(ASSIGNMENT_STUDENT_STATUSES);

const assignmentRowSchema = z.object({
  id: z.uuid(),
  class_id: z.uuid(),
  config: z.unknown(),
  due_at: z.string().nullable(),
  created_at: z.string(),
  assignment_students: z.array(
    z.object({
      student_id: z.uuid(),
      status: assignmentStudentStatusSchema,
      attempt_id: z.uuid().nullable(),
    }),
  ),
});

export interface AssignmentWithProgress {
  id: string;
  classId: string;
  config: unknown;
  dueAt: string | null;
  createdAt: string;
  students: {
    studentId: string;
    status: z.infer<typeof assignmentStudentStatusSchema>;
    attemptId: string | null;
  }[];
}

export async function listClassAssignments(
  supabase: Supabase,
  classId: string,
): Promise<AssignmentWithProgress[]> {
  const { data, error } = await supabase
    .from("assignments")
    .select(
      "id, class_id, config, due_at, created_at, assignment_students(student_id, status, attempt_id)",
    )
    .eq("class_id", classId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`assignments query failed: ${error.message}`);
  return z
    .array(assignmentRowSchema)
    .parse(data ?? [])
    .map((row) => ({
      id: row.id,
      classId: row.class_id,
      config: row.config,
      dueAt: row.due_at,
      createdAt: row.created_at,
      students: row.assignment_students.map((student) => ({
        studentId: student.student_id,
        status: student.status,
        attemptId: student.attempt_id,
      })),
    }));
}

const membershipRowSchema = z.object({
  class_id: z.uuid(),
  classes: z.object({ id: z.uuid(), name: z.string() }).nullable(),
});

export interface StudentMembership {
  classId: string;
  className: string;
}

/**
 * The classes (of this teacher's) that a student belongs to. Empty means
 * the student is not in any of the teacher's classes — the detail page
 * treats that as not-found, which is also all RLS would ever reveal.
 */
export async function getStudentMembership(
  supabase: Supabase,
  studentId: string,
): Promise<StudentMembership[]> {
  const { data, error } = await supabase
    .from("class_students")
    .select("class_id, classes(id, name)")
    .eq("student_id", studentId);
  if (error) throw new Error(`membership query failed: ${error.message}`);
  return z
    .array(membershipRowSchema)
    .parse(data ?? [])
    .filter((row) => row.classes !== null)
    .map((row) => ({ classId: row.class_id, className: row.classes!.name }));
}

const profileRowSchema = z.object({
  id: z.uuid(),
  display_name: z.string().nullable(),
  year_level: z.number().nullable(),
});

export async function getStudentProfile(
  supabase: Supabase,
  studentId: string,
): Promise<RosterStudent | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, year_level")
    .eq("id", studentId)
    .maybeSingle();
  if (!data) return null;
  const row = profileRowSchema.parse(data);
  return {
    studentId: row.id,
    displayName: row.display_name,
    yearLevel: row.year_level,
  };
}

const studentAssignmentRowSchema = z.object({
  assignment_id: z.uuid(),
  status: assignmentStudentStatusSchema,
  attempt_id: z.uuid().nullable(),
  assignments: z
    .object({
      id: z.uuid(),
      config: z.unknown(),
      due_at: z.string().nullable(),
      created_at: z.string(),
    })
    .nullable(),
});

export interface StudentAssignmentRow {
  assignmentId: string;
  status: z.infer<typeof assignmentStudentStatusSchema>;
  attemptId: string | null;
  config: unknown;
  dueAt: string | null;
  createdAt: string;
}

export async function listStudentAssignments(
  supabase: Supabase,
  studentId: string,
): Promise<StudentAssignmentRow[]> {
  const { data, error } = await supabase
    .from("assignment_students")
    .select("assignment_id, status, attempt_id, assignments(id, config, due_at, created_at)")
    .eq("student_id", studentId);
  if (error) throw new Error(`student assignments query failed: ${error.message}`);
  return z
    .array(studentAssignmentRowSchema)
    .parse(data ?? [])
    .filter((row) => row.assignments !== null)
    .map((row) => ({
      assignmentId: row.assignment_id,
      status: row.status,
      attemptId: row.attempt_id,
      config: row.assignments!.config,
      dueAt: row.assignments!.due_at,
      createdAt: row.assignments!.created_at,
    }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
