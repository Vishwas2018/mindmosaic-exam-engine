import { NextResponse } from "next/server";
import { z } from "zod";

import { checkOrigin } from "@/features/auth/require-origin";
import { RATE_LIMITS, rateLimitResponse } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

/**
 * "Delete my child's data" — a parent asks for full erasure of one linked
 * child. Unlike DELETE /api/parent/children/[childId] (which only unlinks),
 * this calls public.parent_request_child_erasure
 * (supabase/migrations/20261016091000), which:
 *
 *   - checks, inside the database and on auth.uid(), that the caller is a
 *     parent linked to THIS child — this route's own checks are a courtesy
 *     for clean status codes, not the boundary;
 *   - records a pending erasure request due in 30 days and revokes the
 *     child's access immediately (sign-in blocked, live sessions ended);
 *   - deletes nothing itself — the existing processor runs erase_student
 *     when the window closes (all sittings, results, marks, writing, the
 *     profile and the auth user).
 *
 * It runs through the caller's own RLS-scoped session, never the service-role
 * key: the SECURITY DEFINER function is the only privileged step.
 *
 * The body must carry `confirm: true` so a stray request or a replayed link
 * cannot trigger it; the UI sends it only after a confirmation dialog.
 */

const bodySchema = z.object({ confirm: z.literal(true) }).strict();

interface RouteContext {
  params: Promise<{ childId: string }>;
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  const originCheck = checkOrigin(request);
  if (!originCheck.ok) {
    return originCheck.response;
  }

  const { childId } = await context.params;
  if (!z.string().uuid().safeParse(childId).success) {
    return NextResponse.json({ ok: false, message: "Child not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!bodySchema.safeParse(body).success) {
    return NextResponse.json(
      { ok: false, message: "Confirmation is required to delete a child's data." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Sign in as a parent." }, { status: 401 });
  }

  const limited = rateLimitResponse(RATE_LIMITS.childErase, user.id);
  if (limited) return limited;

  const { data, error } = await supabase.rpc("parent_request_child_erasure", { p_child: childId });

  if (error) {
    /* MM250: not a parent. MM251: not linked to this child (or no such
       child) — deliberately indistinguishable to the caller. */
    if (error.code === "MM250") {
      return NextResponse.json(
        { ok: false, message: "Only a parent account can delete a child's data." },
        { status: 403 },
      );
    }
    if (error.code === "MM251") {
      return NextResponse.json({ ok: false, message: "Child not found." }, { status: 404 });
    }
    console.error("POST /api/parent/children/[childId]/erase: rpc failed", error);
    return NextResponse.json(
      { ok: false, message: "Could not schedule deletion. Please try again." },
      { status: 500 },
    );
  }

  const result = (data ?? {}) as { executeAfter?: string; alreadyRequested?: boolean };
  return NextResponse.json(
    {
      ok: true,
      executeAfter: result.executeAfter ?? null,
      alreadyRequested: result.alreadyRequested === true,
    },
    { status: 200 },
  );
}
