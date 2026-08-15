import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { fetchSitting } from "@/server/assessment/read-dispatch";

/**
 * Get one sitting by id, from whichever model created it (§12.7 step 7).
 *
 * The resume lookup next door answers "do I have a sitting"; this answers "give
 * me *that* sitting", which is what a client holding a session id needs and had
 * no endpoint for — the legacy flow only ever received its paper at creation
 * and rebuilt it from the store thereafter. A version-pinned sitting cannot
 * work that way: its paper lives in `assessment_session_items`, which no
 * learner may query, so there has to be a server-side read that dispatches.
 *
 * The response is the same `ActiveSessionResponse` the resume route returns for
 * either model. A client cannot tell which model served it, which is the point:
 * "clients MUST NOT independently query both and merge" is not enforceable if
 * the client can see there are two.
 *
 * Ownership is not checked here and is not missing. A legacy session is scoped
 * by RLS on `exam_sessions`/`exam_responses`; a target session by
 * `get_assessment_session`, which re-derives the sitter from `auth.uid()` and
 * refuses anyone else — deliberately narrower than the session row's own read
 * policies, because a parent or teacher may see that a sitting exists without
 * being handed its paper. Both paths return "not found" for a session that
 * exists but is not the caller's, so the 404 below covers absence and denial
 * with one answer.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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

  const { id } = await context.params;
  const outcome = await fetchSitting(supabase, id, user.id);

  if (outcome.kind === "none") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (outcome.kind === "corrupt") {
    return NextResponse.json({ error: "corrupt_session" }, { status: 500 });
  }
  return NextResponse.json(outcome.payload);
}
