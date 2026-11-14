import { AuthSessionMissingError, type SupabaseClient, type User } from "@supabase/supabase-js";

/**
 * Archived child accounts (QA-003) are denied by the application as well as by the auth server.
 *
 * Archiving bans the auth user and sets `app_metadata.archived`. Hosted Supabase also rejects an
 * already-issued access token for a banned user, but that is the auth server's behaviour, not a
 * guarantee: a local `supabase start` stack (used by CI) keeps honouring the token until it expires. The
 * application must not depend on it, so every server-side `auth.getUser()` result for an archived user is
 * turned into "no user", exactly as if the session had expired.
 *
 * `app_metadata` can be written only with the service-role key, so a user cannot clear their own flag.
 */
export function isArchivedUser(user: Pick<User, "app_metadata"> | null | undefined): boolean {
  return user?.app_metadata?.archived === true;
}

/** Returns the same client with `auth.getUser` refusing archived accounts. Every other method is untouched. */
export function denyArchivedSessions<T extends SupabaseClient>(client: T): T {
  const original = client.auth.getUser.bind(client.auth);
  client.auth.getUser = (async (jwt?: string) => {
    const result = await original(jwt);
    if (isArchivedUser(result.data.user)) {
      return { data: { user: null }, error: new AuthSessionMissingError() };
    }
    return result;
  }) as typeof client.auth.getUser;
  return client;
}
