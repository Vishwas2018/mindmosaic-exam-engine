import { NextResponse } from "next/server";
import { z } from "zod";

import { checkOrigin } from "@/features/auth/require-origin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { issueRecoveryGrant, recoveryGrantConfigured } from "@/server/auth/recovery-grant";
import { noStore, resolveLiveSession, setGrantCookie } from "@/server/auth/recovery-session";

/**
 * POST /api/auth/recovery/verify { tokenHash }
 *
 * Device-independent recovery: the browser that opened the emailed link hands us the one-time `token_hash`, and THE
 * SERVER verifies it with the Auth service. Only after that succeeds does it issue a recovery grant bound to the
 * user and session that verification created (src/server/auth/recovery-grant.ts).
 *
 * The token travels in the POST body, so it is in no URL log. Nothing here logs; an error never echoes the token or
 * the Auth service's message (which can name the token's state).
 *
 * The configuration check comes BEFORE the verification: a one-time token must never be spent on a request that can
 * then issue no grant.
 */
const bodySchema = z.object({ tokenHash: z.string().min(8).max(512) }).strict();

export async function POST(request: Request): Promise<NextResponse> {
  const originCheck = checkOrigin(request);
  if (!originCheck.ok) return originCheck.response;
  if (!isSupabaseConfigured || !recoveryGrantConfigured()) return noStore({ error: "not_configured" }, 503);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return noStore({ error: "invalid_request" }, 400);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: parsed.data.tokenHash, type: "recovery" });
  if (error) return noStore({ error: "invalid_or_expired_link" }, 400);

  /* Bind the grant to what the server can now vouch for, read back from the Auth service, not assumed. */
  const live = await resolveLiveSession(supabase);
  if (!live) return noStore({ error: "invalid_or_expired_link" }, 400);
  const grant = issueRecoveryGrant(live.binding);
  if (!grant.ok) return noStore({ error: "not_configured" }, 503);

  const response = noStore({ ok: true, csrfToken: grant.csrfToken, expiresAt: grant.expiresAt });
  setGrantCookie(response, request, grant.cookieValue);
  return response;
}
