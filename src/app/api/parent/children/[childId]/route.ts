import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { z } from "zod";
import { yearLevelSchema } from "@/schemas/question.schema";

import { checkOrigin } from "@/features/auth/require-origin";
import { isValidPin } from "@/features/auth/student-alias";
import { setChildArchived } from "@/features/parent-dashboard/child-access";
import { learnerCurriculumPreferenceSchema } from "@/features/curriculum/contracts";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Rename / year-level / PIN-reset / archive-or-restore (PATCH) and archive (DELETE) for one
 * linked child. Mirrors provisionChild's privilege boundary
 * (src/features/auth/provision-child.ts): a parent has no RLS update policy
 * on a child's profiles row ("profiles: update own row" only matches
 * id = auth.uid()) and no delete policy on parent_children at all, so both
 * writes need the service-role client — but only after this route has
 * confirmed, through the normal RLS-scoped client, that the caller is a
 * parent actually linked to this child. That confirmation step is what
 * stands in for a policy here.
 *
 * Archive (DELETE, or PATCH { archived: true }) is a reversible DEACTIVATION of the child's login: the
 * auth user is banned and marked archived (see features/parent-dashboard/child-access.ts). The
 * parent_children link, the auth user and every attempt are kept, so every linked guardian still sees past
 * results and can restore (PATCH { archived: false }). Nothing is deleted and no schema change is needed.
 * It is shared across guardians: any linked guardian may archive or restore, and it applies to the child.
 */

const patchRequestSchema = z.object({
  displayName: z.string().optional(),
  yearLevel: yearLevelSchema.nullable().optional(),
  curriculumPreference: learnerCurriculumPreferenceSchema.nullable().optional(),
  pin: z.string().optional(),
  /** true = archive (pause sign-in), false = restore. */
  archived: z.boolean().optional(),
}).strict().refine(
  (value) => Object.values(value).some((entry) => entry !== undefined),
  "at least one child field is required",
);

function accessFailureStatus(reason: "not_found" | "not_student" | "update_failed"): number {
  return reason === "not_found" ? 404 : reason === "not_student" ? 400 : 500;
}

interface RouteContext {
  params: Promise<{ childId: string }>;
}

async function requireLinkedChild(childId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ ok: false, message: "Sign in as a parent." }, { status: 401 }) };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "parent") {
    return { ok: false as const, response: NextResponse.json({ ok: false, message: "Only a parent account can manage children." }, { status: 403 }) };
  }

  const { data: link } = await supabase
    .from("parent_children")
    .select("child_id")
    .eq("parent_id", user.id)
    .eq("child_id", childId)
    .maybeSingle();
  if (!link) {
    return { ok: false as const, response: NextResponse.json({ ok: false, message: "Child not found." }, { status: 404 }) };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey.trim().length === 0) {
    return { ok: false as const, response: NextResponse.json({ ok: false, message: "This isn't configured on the server yet." }, { status: 503 }) };
  }

  const admin = createAdminClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return { ok: true as const, parentId: user.id, admin };
}

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  const originCheck = checkOrigin(request);
  if (!originCheck.ok) {
    return originCheck.response;
  }

  const { childId } = await context.params;

  const body = await request.json().catch(() => null);
  const parsed = patchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const displayName = parsed.data.displayName?.trim();
  if (parsed.data.displayName !== undefined && !displayName) {
    return NextResponse.json({ ok: false, message: "A name is required." }, { status: 400 });
  }
  if (parsed.data.pin !== undefined && !isValidPin(parsed.data.pin)) {
    return NextResponse.json({ ok: false, message: "PIN must be exactly 6 digits." }, { status: 400 });
  }

  const gate = await requireLinkedChild(childId);
  if (!gate.ok) return gate.response;

  /* Archive state first, so "restore and set a new PIN" in one request ends with a working account. */
  if (parsed.data.archived !== undefined) {
    const state = await setChildArchived(gate.admin, childId, parsed.data.archived, gate.parentId);
    if (!state.ok) {
      return NextResponse.json({ ok: false, message: state.message }, { status: accessFailureStatus(state.reason) });
    }
  }

  const profileUpdate: Record<string, string | number | null> = {};
  if (displayName !== undefined) profileUpdate.display_name = displayName;
  if (parsed.data.yearLevel !== undefined) profileUpdate.year_level = parsed.data.yearLevel;
  if (parsed.data.curriculumPreference !== undefined) {
    profileUpdate.curriculum_jurisdiction_code =
      parsed.data.curriculumPreference?.jurisdictionCode ?? null;
    profileUpdate.curriculum_school_sector =
      parsed.data.curriculumPreference?.schoolSector ?? null;
  }

  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileError } = await gate.admin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", childId);
    if (profileError) {
      console.error("PATCH /api/parent/children/[childId]: profiles update failed", profileError);
      return NextResponse.json({ ok: false, message: "Could not update this child. Please try again." }, { status: 500 });
    }
  }

  if (parsed.data.pin) {
    const { error: passwordError } = await gate.admin.auth.admin.updateUserById(childId, {
      password: parsed.data.pin,
    });
    if (passwordError) {
      console.error("PATCH /api/parent/children/[childId]: PIN reset failed", passwordError);
      return NextResponse.json(
        { ok: false, message: "Profile details were saved, but the PIN could not be reset." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(request: Request, context: RouteContext): Promise<NextResponse> {
  const originCheck = checkOrigin(request);
  if (!originCheck.ok) {
    return originCheck.response;
  }

  const { childId } = await context.params;

  const gate = await requireLinkedChild(childId);
  if (!gate.ok) return gate.response;

  const state = await setChildArchived(gate.admin, childId, true, gate.parentId);
  if (!state.ok) {
    console.error("DELETE /api/parent/children/[childId]: archive failed", state.message);
    return NextResponse.json({ ok: false, message: state.message }, { status: accessFailureStatus(state.reason) });
  }

  return NextResponse.json({ ok: true, archived: true }, { status: 200 });
}
