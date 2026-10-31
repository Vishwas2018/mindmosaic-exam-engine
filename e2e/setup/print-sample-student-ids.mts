/**
 * Seeds the (local-only) fixture identities, then prints the auth user ids the Scholarship sample preview E2E
 * needs before the app server starts: one student who is allowlisted for the preview and one who is not.
 * Idempotent; refuses to run against anything but a loopback Supabase (see ../fixtures/environment-guard.ts).
 */
import { assertLocalSupabaseEnvironment } from "../fixtures/environment-guard";
import { seed } from "../fixtures/seed";

assertLocalSupabaseEnvironment();
const result = await seed();
process.stdout.write(
  JSON.stringify({
    allowed: result.studentIds["student-no-attempts"],
    notAllowed: result.studentIds["student-second-child"],
  }),
);
