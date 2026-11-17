import { NextResponse } from "next/server";
import { z } from "zod";

import { checkOrigin } from "@/features/auth/require-origin";
import { createServiceRoleClient, setChildArchived } from "@/features/parent-dashboard/child-access";
import { createClient } from "@/lib/supabase/server";

/**
 * Pause (or resume) EVERY linked child's login at once — the account-level
 * "take a break" in the parent's settings. It is exactly the per-child
 * archive/restore (features/parent-dashboard/child-access.ts) applied to each
 * link, so it is reversible and deletes nothing: results, links and the
 * subscription are untouched, and a single child can still be restored from
 * Manage children.
 *
 * Shared-guardian caveat, same as per-child archive: a child with a second
 * guardian is paused for both.
 */
const requestSchema = z.object({ paused: z.boolean() }).strict();

export async function POST(request: Request): Promise<NextResponse> {
  const originCheck = checkOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Sign in as a parent." }, { status: 401 });
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "parent") {
    return NextResponse.json({ ok: false, message: "Only a parent account can do this." }, { status: 403 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "This isn't configured on the server yet." }, { status: 503 });
  }

  // Through the RLS-scoped client: the caller's own links only.
  const { data: links, error: linkError } = await supabase
    .from("parent_children")
    .select("child_id")
    .eq("parent_id", user.id);
  if (linkError) {
    return NextResponse.json({ ok: false, message: "Could not load your children." }, { status: 500 });
  }

  const childIds = (links ?? []).map((link) => link.child_id as string);
  let changed = 0;
  let failed = 0;
  for (const childId of childIds) {
    const result = await setChildArchived(admin, childId, parsed.data.paused, user.id);
    if (!result.ok) failed += 1;
    else if (!result.alreadyInState) changed += 1;
  }

  if (failed > 0) {
    return NextResponse.json(
      {
        ok: false,
        message: `Could not update ${failed} of ${childIds.length} children. Please try again.`,
      },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, total: childIds.length, changed });
}
