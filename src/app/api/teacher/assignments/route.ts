import { NextResponse } from "next/server";

import { createAssignmentRequestSchema } from "@/features/teacher/assignment-contract";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Creates a teacher assignment: one `assignments` row plus one
 * `assignment_students` row per recipient — exactly the columns in
 * docs/DATA_MODEL_AND_ROLES.md. Runs as the signed-in teacher under RLS
 * ("assignments: teacher creates for own class" / "assignment_students:
 * teacher assigns own"), so the database independently re-checks class
 * ownership; the checks here exist to return clear errors and to restrict
 * recipients to the class roster before RLS is ever consulted.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "teacher") {
    return NextResponse.json({ error: "teachers_only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createAssignmentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { classId, config, dueAt, studentIds } = parsed.data;

  /* RLS hides classes the caller doesn't teach, so a foreign class id
     reads as absent rather than forbidden. */
  const { data: ownedClass } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .maybeSingle();
  if (!ownedClass) {
    return NextResponse.json({ error: "class_not_found" }, { status: 404 });
  }

  /* Recipients must be members of this class: the DB policy alone would
     accept any profile id, so the roster intersection is the guardrail
     that keeps assignments inside the teacher's own class. */
  const { data: roster, error: rosterError } = await supabase
    .from("class_students")
    .select("student_id")
    .eq("class_id", classId);
  if (rosterError) {
    return NextResponse.json({ error: "roster_unavailable" }, { status: 500 });
  }
  const rosterIds = new Set((roster ?? []).map((row) => row.student_id as string));
  const recipients = [...new Set(studentIds)].filter((id) => rosterIds.has(id));
  if (recipients.length === 0 || recipients.length !== new Set(studentIds).size) {
    return NextResponse.json({ error: "students_not_in_class" }, { status: 422 });
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .insert({
      class_id: classId,
      created_by: user.id,
      config,
      due_at: dueAt,
    })
    .select("id")
    .single();
  if (assignmentError || !assignment) {
    return NextResponse.json({ error: "assignment_not_created" }, { status: 500 });
  }

  const { error: studentsError } = await supabase.from("assignment_students").insert(
    recipients.map((studentId) => ({
      assignment_id: assignment.id,
      student_id: studentId,
    })),
  );
  if (studentsError) {
    /* Best-effort rollback so a half-created assignment never lingers;
       the teacher-delete policy covers this. */
    await supabase.from("assignments").delete().eq("id", assignment.id);
    return NextResponse.json({ error: "students_not_assigned" }, { status: 500 });
  }

  return NextResponse.json(
    { assignmentId: assignment.id, assignedCount: recipients.length },
    { status: 201 },
  );
}
