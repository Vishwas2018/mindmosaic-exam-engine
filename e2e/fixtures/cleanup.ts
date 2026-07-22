/**
 * Deletes every fixture identity this suite created — and nothing else.
 * Scoped strictly to the two email patterns seed.ts ever writes: the
 * `@e2e.mindmosaic.local` domain (parents/teachers/admin) and the
 * `childcode+e2stud...@students.mindmosaic.internal` student aliases. A real
 * household can never end up matching either pattern, so this is safe to run
 * against the local instance at any time without first knowing what else is
 * in it (see the "cleanup does not affect non-test records" test).
 *
 * Every `public.*` row for these users (profiles, parent_children, classes,
 * class_students, exam_sessions, exam_attempts, subscriptions, ...) cascades
 * away via `on delete cascade` foreign keys once the auth.users row is
 * deleted — see supabase/migrations/20260718090000_phase0_roles_and_exam_schema.sql
 * and .../20260720100000_subscriptions.sql. Nothing here touches those
 * tables directly.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "./supabase-admin";
import { FIXTURE_EMAIL_DOMAIN } from "./identities";

const STUDENT_ALIAS_PREFIX_PATTERN = /^childcode\+e2stud/i;
const STUDENT_ALIAS_DOMAIN = "students.mindmosaic.internal";

function isFixtureEmail(email: string | undefined): boolean {
  if (!email) return false;
  const [local, domain] = email.split("@");
  if (domain === FIXTURE_EMAIL_DOMAIN) return true;
  if (domain === STUDENT_ALIAS_DOMAIN && STUDENT_ALIAS_PREFIX_PATTERN.test(local)) return true;
  return false;
}

export async function cleanup(): Promise<{ deleted: string[] }> {
  const admin: SupabaseClient = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;

  const toDelete = data.users.filter((u) => isFixtureEmail(u.email));
  const deleted: string[] = [];
  for (const user of toDelete) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      throw new Error(`Failed to delete fixture user ${user.email}: ${deleteError.message}`);
    }
    deleted.push(user.email ?? user.id);
  }
  return { deleted };
}

if (require.main === module) {
  cleanup()
    .then((result) => {
      console.log(`Cleanup complete: removed ${result.deleted.length} fixture users.`);
      console.log(result.deleted.join("\n"));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
