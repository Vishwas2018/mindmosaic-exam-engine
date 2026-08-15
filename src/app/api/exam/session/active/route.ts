import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { fetchActiveSitting } from "@/server/assessment/read-dispatch";

/**
 * Resume lookup for a signed-in student: "what, if anything, is my active
 * exam session?" A browser refresh wipes the client's in-memory session
 * id along with everything else in the Zustand store, so resume cannot
 * start from a known session id the way autosave/submit do — it has to
 * start here. Returns the most recently created, not-yet-expired,
 * not-yet-submitted session, reconstructed from the server's own stored
 * selection plus whatever the debounced autosave last recorded (both
 * server-side, never trusted from anything the client might still hold).
 *
 * The lookup itself moved to `@/server/assessment/read-dispatch` at §12.7 step
 * 7, because a student's resumable sitting may now be on either storage model
 * and the client must not be the thing that finds out which. The dispatcher
 * resolves it by origin and returns one payload; this route is the same
 * contract it always was, and a legacy session still travels the same tables in
 * the same order to reach it.
 */
export async function GET(): Promise<NextResponse> {
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

  const outcome = await fetchActiveSitting(supabase, user.id);

  if (outcome.kind === "none") {
    return NextResponse.json({ error: "no_active_session" }, { status: 404 });
  }
  if (outcome.kind === "corrupt") {
    return NextResponse.json({ error: "corrupt_session" }, { status: 500 });
  }
  return NextResponse.json(outcome.payload);
}
