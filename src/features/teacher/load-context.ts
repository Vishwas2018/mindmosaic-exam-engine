import "server-only";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

import {
  listTeacherClasses,
  requireTeacher,
  type TeacherClass,
  type TeacherIdentity,
} from "./data";

export interface TeacherPageContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  teacher: TeacherIdentity;
  classes: TeacherClass[];
  /** null only when the teacher has no classes at all. */
  activeClass: TeacherClass | null;
}

/**
 * Shared gate + scope resolution for every teacher page: requires a
 * signed-in teacher (anyone else is redirected away, mirroring the
 * role-routing in features/auth/roles.ts) and resolves the active class
 * from the `class` query param, defaulting to the first class.
 */
export async function loadTeacherPageContext(
  requestedClassId: string | undefined,
): Promise<TeacherPageContext> {
  /* Without Supabase there are no accounts at all; the sign-in page
     explains the missing configuration in a friendly way. */
  if (!isSupabaseConfigured) redirect("/sign-in");

  const gate = await requireTeacher();
  if (!gate.ok) {
    redirect(gate.reason === "unauthenticated" ? "/sign-in" : "/");
  }

  const supabase = await createClient();
  const classes = await listTeacherClasses(supabase);
  const activeClass =
    classes.find((teacherClass) => teacherClass.id === requestedClassId) ??
    classes[0] ??
    null;

  return { supabase, teacher: gate.teacher, classes, activeClass };
}
