import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { z } from "zod";
import { yearLevelSchema } from "@/schemas/question.schema";

import { checkOrigin } from "@/features/auth/require-origin";
import { isValidPin } from "@/features/auth/student-alias";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Rename / year-level / PIN-reset (PATCH) and archive (DELETE) for one
 * linked child. Mirrors provisionChild's privilege boundary
 * (src/features/auth/provision-child.ts): a parent has no RLS update policy
 * on a child's profiles row ("profiles: update own row" only matches
 * id = auth.uid()) and no delete policy on parent_children at all, so both
 * writes need the service-role client — but only after this route has
 * confirmed, through the normal RLS-scoped client, that the caller is a
 * parent actually linked to this child. That confirmation step is what
 * stands in for a policy here.
 *
 * DELETE removes the parent_children link rather than deleting the child's
 * auth user or any exam history — an "archive", not a hard delete, and it
 * requires no schema change (there is no archived-flag column).
 */

const patchRequestSchema = z.object({
  displayName: z.string(),
  yearLevel: yearLevelSchema.nullable().optional(),
  pin: z.string().optional(),
});

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

  const displayName = parsed.data.displayName.trim();
  if (!displayName) {
    return NextResponse.json({ ok: false, message: "A name is required." }, { status: 400 });
  }
  if (parsed.data.pin !== undefined && !isValidPin(parsed.data.pin)) {
    return NextResponse.json({ ok: false, message: "PIN must be exactly 6 digits." }, { status: 400 });
  }

  const gate = await requireLinkedChild(childId);
  if (!gate.ok) return gate.response;

  const { error: profileError } = await gate.admin
    .from("profiles")
    .update({ display_name: displayName, year_level: parsed.data.yearLevel ?? null })
    .eq("id", childId);
  if (profileError) {
    console.error("PATCH /api/parent/children/[childId]: profiles update failed", profileError);
    return NextResponse.json({ ok: false, message: "Could not update this child. Please try again." }, { status: 500 });
  }

  if (parsed.data.pin) {
    const { error: passwordError } = await gate.admin.auth.admin.updateUserById(childId, {
      password: parsed.data.pin,
    });
    if (passwordError) {
      console.error("PATCH /api/parent/children/[childId]: PIN reset failed", passwordError);
      return NextResponse.json(
        { ok: false, message: "Name and year level were saved, but the PIN could not be reset." },
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

  const { error } = await gate.admin
    .from("parent_children")
    .delete()
    .eq("parent_id", gate.parentId)
    .eq("child_id", childId);
  if (error) {
    console.error("DELETE /api/parent/children/[childId]: unlink failed", error);
    return NextResponse.json({ ok: false, message: "Could not archive this child. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
