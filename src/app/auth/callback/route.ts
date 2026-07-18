import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isProfileRole, roleHomePath } from "@/features/auth/roles";

/**
 * OAuth / email-confirmation callback. Supabase redirects here with a `code`
 * which we exchange for a session cookie, then send the user on. An explicit
 * `next` wins; otherwise the destination is the signed-in role's home
 * (student/parent/teacher/admin placeholder routes). Failures fall back to
 * the sign-in screen.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  /* "/" is the historical default the OAuth buttons always send — treat it
     as "no explicit destination" so role routing can take over. */
  const safeNext = next && next.startsWith("/") && next !== "/" ? next : null;

  if (code && isSupabaseConfigured) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (safeNext) {
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
      const userId = data.session?.user.id;
      const { data: profile } = userId
        ? await supabase.from("profiles").select("role").eq("id", userId).single()
        : { data: null };
      const role = isProfileRole(profile?.role) ? profile.role : null;
      return NextResponse.redirect(`${origin}${roleHomePath(role)}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback`);
}
