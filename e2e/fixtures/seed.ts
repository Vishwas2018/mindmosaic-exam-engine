/**
 * Deterministic, idempotent test-data seeding for the authenticated e2e
 * suite. Safe to re-run: every identity is looked up by its fixed email
 * before being created, and every relational row is upserted or
 * existence-checked rather than blindly inserted, so a second run changes
 * nothing (see the "seed is idempotent" test in role-access.smoke.spec.ts).
 *
 * Runs entirely through the service-role client (bypasses RLS by design —
 * see ./supabase-admin.ts) against the local Supabase instance only; the
 * environment guard in createAdminClient() refuses anything else.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "./supabase-admin";
import { e2eEnv } from "./env";
import {
  ADMIN,
  PARENTS,
  STUDENTS,
  TEACHERS,
  TEACHER_WITH_STUDENTS_ROSTER,
  type ParentKey,
  type StudentKey,
} from "./identities";

export interface SeedResult {
  readonly parentIds: Record<ParentKey, string>;
  readonly studentIds: Record<StudentKey, string>;
  readonly teacherIds: Record<string, string>;
  readonly adminId: string;
}

async function findUserIdByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
  // Fixture set is small; one page comfortably covers it without needing
  // GoTrue's admin search-by-email (not available in every CLI version).
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email === email)?.id ?? null;
}

async function ensureAuthUser(
  admin: SupabaseClient,
  email: string,
  password: string,
  displayName: string,
  metadataRole: "student" | "parent",
): Promise<string> {
  const existing = await findUserIdByEmail(admin, email);
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, role: metadataRole },
  });
  if (error || !data.user) {
    throw new Error(`Failed to create fixture user ${email}: ${error?.message}`);
  }
  return data.user.id;
}

async function promoteRole(
  admin: SupabaseClient,
  userId: string,
  role: "teacher" | "admin",
): Promise<void> {
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(`Failed to promote ${userId} to ${role}: ${error.message}`);
}

async function ensureParentChild(
  admin: SupabaseClient,
  parentId: string,
  childId: string,
): Promise<void> {
  const { error } = await admin
    .from("parent_children")
    .upsert({ parent_id: parentId, child_id: childId }, { onConflict: "parent_id,child_id" });
  if (error) throw new Error(`Failed to link parent ${parentId} -> child ${childId}: ${error.message}`);
}

async function ensureClass(
  admin: SupabaseClient,
  teacherId: string,
  name: string,
): Promise<string> {
  const { data: existing, error: selectError } = await admin
    .from("classes")
    .select("id")
    .eq("teacher_id", teacherId)
    .limit(1)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return existing.id as string;

  const { data, error } = await admin
    .from("classes")
    .insert({ teacher_id: teacherId, name })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Failed to create class for ${teacherId}: ${error?.message}`);
  return data.id as string;
}

async function ensureClassStudent(
  admin: SupabaseClient,
  classId: string,
  studentId: string,
): Promise<void> {
  const { error } = await admin
    .from("class_students")
    .upsert({ class_id: classId, student_id: studentId }, { onConflict: "class_id,student_id" });
  if (error) throw new Error(`Failed to roster student ${studentId} into class ${classId}: ${error.message}`);
}

async function ensureCompletedAttempt(admin: SupabaseClient, studentId: string): Promise<void> {
  const { data: existing, error: selectError } = await admin
    .from("exam_attempts")
    .select("id")
    .eq("student_id", studentId)
    .limit(1)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return;

  const { data: session, error: sessionError } = await admin
    .from("exam_sessions")
    .insert({
      student_id: studentId,
      config: {},
      seed: "e2e-fixture",
      selected_question_ids: ["q1"],
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();
  if (sessionError || !session) {
    throw new Error(`Failed to seed exam_sessions for ${studentId}: ${sessionError?.message}`);
  }

  const { error: attemptError } = await admin.from("exam_attempts").insert({
    session_id: session.id,
    student_id: studentId,
    responses: {},
    result: {},
  });
  if (attemptError) {
    throw new Error(`Failed to seed exam_attempts for ${studentId}: ${attemptError.message}`);
  }
}

async function ensureSubscriptionState(
  admin: SupabaseClient,
  parentId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  // The on_parent_profile_created trigger has already inserted a 'trialing'
  // row (subscriptions.parent_id is unique) — override it to the desired
  // fixture state instead of inserting a second one.
  const { error } = await admin.from("subscriptions").update(patch).eq("parent_id", parentId);
  if (error) throw new Error(`Failed to set subscription state for ${parentId}: ${error.message}`);
}

export async function seed(): Promise<SeedResult> {
  const admin = createAdminClient();
  const password = e2eEnv.fixturePassword;

  const parentIds = {} as Record<ParentKey, string>;
  for (const parent of PARENTS) {
    parentIds[parent.key] = await ensureAuthUser(
      admin,
      parent.email,
      password,
      parent.displayName,
      "parent",
    );
  }

  const studentIds = {} as Record<StudentKey, string>;
  for (const student of STUDENTS) {
    studentIds[student.key] = await ensureAuthUser(
      admin,
      student.email,
      e2eEnv.fixturePin,
      student.displayName,
      "student",
    );
    await ensureParentChild(admin, parentIds[student.parent], studentIds[student.key]);
  }
  await ensureCompletedAttempt(admin, studentIds["student-completed-attempt"]);

  const teacherIds: Record<string, string> = {};
  for (const teacher of TEACHERS) {
    const id = await ensureAuthUser(admin, teacher.email, password, teacher.displayName, "student");
    await promoteRole(admin, id, "teacher");
    teacherIds[teacher.key] = id;
  }
  const withStudentsClassId = await ensureClass(
    admin,
    teacherIds["teacher-with-students"],
    "E2E Fixture Class",
  );
  for (const studentKey of TEACHER_WITH_STUDENTS_ROSTER) {
    await ensureClassStudent(admin, withStudentsClassId, studentIds[studentKey]);
  }
  // teacher-no-students gets an empty class of their own, proving "no
  // assigned students" is an empty roster, not a missing class.
  await ensureClass(admin, teacherIds["teacher-no-students"], "E2E Empty Class");

  const adminId = await ensureAuthUser(admin, ADMIN.email, password, ADMIN.displayName, "student");
  await promoteRole(admin, adminId, "admin");

  await ensureSubscriptionState(admin, parentIds["household-expired"], {
    status: "trial_expired",
    trial_end: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  });
  await ensureSubscriptionState(admin, parentIds["household-active-premium"], {
    status: "active",
    plan: "family_monthly",
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return { parentIds, studentIds, teacherIds, adminId };
}

if (require.main === module) {
  seed()
    .then((result) => {
      console.log("Seed complete:", JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
