import "server-only";

/**
 * Which storage model a NEWLY created session uses (spec §12.7 step 6, ADR-006
 * Amendment C).
 *
 * §12.7 is explicit about what this may and may not do: it "chooses the storage
 * model for a newly created session", and "once created, a session never changes
 * storage model". So it is consulted at creation and nowhere else. Reading it on
 * a resume, a submit or a result fetch would be a bug, not a feature — a session
 * already on the target model must complete there even after the flag is turned
 * off, or a rollback would strand exactly the sittings it was meant to protect.
 *
 * THERE IS ONE AUTHORITATIVE SOURCE, AND IT IS NOT THIS FILE.
 * `platform_flags.target_session_model` and its cohort decide, and
 * `public.session_storage_model_for()` is the only thing that reads them.
 * `create_assessment_session` calls that predicate itself, which is what makes
 * the gate un-bypassable: the RPC is granted to `authenticated`, so PostgREST
 * exposes it to every signed-in client, and a decision taken only in this
 * process would govern our routes while saying nothing about a learner calling
 * the function directly.
 *
 * This module therefore does not *decide*. It asks — through
 * `session_storage_model_for_caller()`, the same predicate scoped to
 * `auth.uid()` — so the application and the database cannot hold different
 * opinions. An earlier version of this file kept its own environment variable
 * as a co-equal second gate; that was three names for one flag, and ADR-006
 * Amendment C removed it.
 */
export type SessionStorageModel = "legacy" | "version_pinned";

/**
 * The one thing that survives from the old environment variable, deliberately
 * narrowed to subtract only.
 *
 * `ASSESSMENT_TARGET_MODEL_DISABLED` can **withhold** the target path: when set,
 * these routes create legacy sessions whatever the database says. It can never
 * grant the target path and never override the database gate — a request that
 * reaches the RPC is judged by the RPC, not by this process's environment.
 *
 * That asymmetry is why it is worth keeping. An operator who needs to stop
 * target-model creation immediately, without a database connection, has a lever
 * that is safe in the only direction an emergency lever is ever needed. A lever
 * that could also turn the feature *on* would be a second source of truth, which
 * is the thing Amendment C exists to remove.
 *
 * Opt-in by exact string, so every misconfiguration — unset, empty, "false",
 * "0", a typo — leaves the switch alone rather than silently withholding.
 */
const WITHHOLD_VALUE = "1";

export function targetPathWithheld(): boolean {
  return process.env.ASSESSMENT_TARGET_MODEL_DISABLED === WITHHOLD_VALUE;
}

/**
 * The minimum surface of a Supabase client this module needs.
 *
 * Structural rather than the generated client type so the routing decision can
 * be tested without standing up a client, and so this file does not acquire a
 * dependency on the database's generated types for the sake of one RPC.
 */
export interface StorageModelClient {
  rpc(
    fn: "session_storage_model_for_caller",
  ): PromiseLike<{ data: unknown; error: unknown }>;
}

/**
 * Asks the database which model a new session for the CALLING learner uses.
 *
 * Fails closed in every direction that is not an unambiguous `version_pinned`:
 * an error, a null, an unexpected value, or the withhold switch all resolve to
 * `legacy`. That is the safe default in the strong sense — legacy is the model
 * every existing reader, result screen, dashboard and export already
 * understands, so a routing failure degrades to the working path rather than to
 * a sitting nobody can display.
 */
export async function resolveSessionStorageModel(
  supabase: StorageModelClient,
): Promise<SessionStorageModel> {
  if (targetPathWithheld()) return "legacy";

  const { data, error } = await supabase.rpc("session_storage_model_for_caller");
  if (error !== null && error !== undefined) return "legacy";
  return data === "version_pinned" ? "version_pinned" : "legacy";
}
