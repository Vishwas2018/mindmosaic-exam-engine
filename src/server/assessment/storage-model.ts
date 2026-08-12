import "server-only";

/**
 * Which storage model a NEWLY created session uses (spec §12.7 step 6).
 *
 * §12.7 is explicit about what this flag may and may not do: it "chooses the
 * storage model for a newly created session", and "once created, a session
 * never changes storage model". So this is consulted at creation and nowhere
 * else. Reading it on a resume, a submit or a result fetch would be a bug, not
 * a feature — a session already on the target model must complete there even
 * after the flag is turned off, or a rollback would strand exactly the sittings
 * it was meant to protect.
 *
 * THIS IS THE SECOND OF TWO GATES, NOT THE ONLY ONE. The first is
 * `platform_flags.target_session_model` (20260812120000), which
 * `create_assessment_session` reads for itself. That one is authoritative,
 * because the RPC is granted to `authenticated` and PostgREST therefore exposes
 * it to every signed-in client directly — a flag that lived only here would be
 * true of our routes and false of the database. This one exists so that our own
 * code makes the choice explicitly rather than by attempting a call and
 * interpreting an error.
 *
 * Both are off. Turning the target model on means flipping the database flag
 * AND setting this variable; turning it off means either.
 */
export type SessionStorageModel = "legacy" | "version_pinned";

/**
 * The environment variable is opt-IN and compared against one exact string, so
 * every misconfiguration — unset, empty, "false", "0", a typo — resolves to the
 * legacy model. A flag whose default depends on parsing is a flag that will one
 * day be on by accident.
 */
const ENABLED_VALUE = "version_pinned";

export function sessionStorageModel(): SessionStorageModel {
  return process.env.ASSESSMENT_SESSION_STORAGE_MODEL === ENABLED_VALUE
    ? "version_pinned"
    : "legacy";
}

/** Convenience for the create path, which is the only legitimate caller. */
export function targetSessionModelEnabled(): boolean {
  return sessionStorageModel() === "version_pinned";
}
