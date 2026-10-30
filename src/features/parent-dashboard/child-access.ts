import "server-only";

import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";

import { isArchivedUser } from "@/lib/supabase/archived-session";
import { SUPABASE_URL } from "@/lib/supabase/config";

export { isArchivedUser };

/**
 * Child account access: archive (pause) and restore.
 *
 * QA-003: "Archive" used to delete the parent_children link and nothing else, so the child could still
 * sign in while their parent lost sight of them, their results and the ability to reset a PIN.
 *
 * Archive is now a reversible DEACTIVATION of the child's login that keeps every relationship and every
 * record: the parent_children link(s) stay (so each guardian keeps seeing past results and can restore),
 * the auth user and all attempts stay, and nothing is deleted.
 *
 * Mechanism (no schema change): Supabase Auth's own ban plus a marker in app_metadata.
 *   - `ban_duration` makes GoTrue refuse password sign-in and refresh-token use with `user_banned`.
 *     Hosted Supabase also rejects an already-issued access token for a banned user, but a local stack does
 *     not, so the application enforces it itself: createClient() in lib/supabase/server.ts reports an
 *     archived user as signed out, so every page and API route treats the child as signed out at once.
 *   - `app_metadata.archived` records the intent so the parent UI can list archived children without
 *     reading banned_until. app_metadata is writable only with the service-role key; a user cannot edit it.
 * Residual risk, documented in the PR: PostgREST validates a JWT locally, so an access token issued
 * before archiving still works for direct database calls (RLS-scoped to the child's own rows) until it
 * expires (default 1 hour). It cannot be used through the app.
 *
 * Policy decision flagged for the owner: a child can have more than one guardian. Archive and restore are
 * account-level and shared: ANY linked guardian may archive or restore, and the child is paused for all.
 */

/** About 100 years: effectively "until restored", and reversible with `ban_duration: "none"`. */
export const ARCHIVE_BAN_DURATION = "876000h";

export type ChildAccessResult =
  | { ok: true; alreadyInState: boolean }
  | { ok: false; reason: "not_found" | "not_student" | "update_failed"; message: string };

export function createServiceRoleClient(env: Readonly<Record<string, string | undefined>> = process.env): SupabaseClient | null {
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key || !SUPABASE_URL.trim()) return null;
  return createAdminClient(SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/**
 * Archive (`archived: true`) or restore (`archived: false`) a student's login. The caller must already have
 * confirmed, through the RLS-scoped session, that the signed-in parent is linked to this child.
 * Idempotent: repeating the same request succeeds and reports `alreadyInState`.
 */
export async function setChildArchived(
  admin: Pick<SupabaseClient, "auth" | "from">,
  childId: string,
  archived: boolean,
  actorId: string,
  now: () => Date = () => new Date(),
): Promise<ChildAccessResult> {
  /* Never ban anything that is not a student account, whatever id was supplied. */
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", childId)
    .maybeSingle();
  if (profileError || !profile) return { ok: false, reason: "not_found", message: "Child not found." };
  if (profile.role !== "student") return { ok: false, reason: "not_student", message: "Only a student account can be archived." };

  const { data: found, error: lookupError } = await admin.auth.admin.getUserById(childId);
  if (lookupError || !found?.user) return { ok: false, reason: "not_found", message: "Child not found." };

  const alreadyInState = isArchivedUser(found.user) === archived;
  if (alreadyInState) return { ok: true, alreadyInState };

  const stamp = now().toISOString();
  const appMetadata = {
    ...(found.user.app_metadata ?? {}),
    archived,
    ...(archived
      ? { archived_at: stamp, archived_by: actorId }
      : { restored_at: stamp, restored_by: actorId }),
  };
  const { error } = await admin.auth.admin.updateUserById(childId, {
    ban_duration: archived ? ARCHIVE_BAN_DURATION : "none",
    app_metadata: appMetadata,
  });
  if (error) return { ok: false, reason: "update_failed", message: archived ? "Could not archive this child. Please try again." : "Could not restore this child. Please try again." };
  return { ok: true, alreadyInState: false };
}

/**
 * Which of these children are archived, for display only (enforcement is the ban itself). Uses the
 * service-role key to read auth metadata; on any failure returns an empty map, so the UI shows children
 * as active rather than failing the page.
 */
export async function loadArchivedChildIds(childIds: readonly string[]): Promise<Set<string>> {
  const archived = new Set<string>();
  if (childIds.length === 0) return archived;
  const admin = createServiceRoleClient();
  if (!admin) return archived;
  await Promise.all(
    childIds.map(async (id) => {
      try {
        const { data } = await admin.auth.admin.getUserById(id);
        if (isArchivedUser(data?.user)) archived.add(id);
      } catch {
        /* display only */
      }
    }),
  );
  return archived;
}
