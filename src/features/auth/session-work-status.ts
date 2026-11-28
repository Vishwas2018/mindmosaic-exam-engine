/**
 * What can honestly be said about a student's work when their session ends.
 *
 * Once a session has expired the server can no longer be asked anything
 * about the person — the request is unauthenticated — so the only thing that
 * can be reported is what the server itself last told this browser. This
 * module is that memory. It records exactly three facts, each only when the
 * server said so:
 *
 *   confirmed  the server accepted an autosave, and returned this time
 *   empty      the server confirmed there is no open sitting (none exists, or
 *              the last one was submitted and accepted)
 *   (unknown)  everything else — including a sitting the server reports open
 *              but has not confirmed a save for, a record that is stale, and
 *              no record at all
 *
 * "Saved" may only ever be worded for `confirmed`, "nothing was in progress"
 * only for `empty`. `unknown` is never rounded to either.
 */

const KEY = "mm.work-status";
/** A record older than this may no longer describe the server (another device, another tab). */
export const WORK_STATUS_MAX_AGE_MS = 12 * 60 * 60 * 1000;

type Stored =
  | { kind: "confirmed"; savedAt: string; recordedAt: number }
  | { kind: "empty"; recordedAt: number }
  | { kind: "open"; recordedAt: number };

export type WorkStatus =
  | { kind: "confirmed"; savedAt: string }
  | { kind: "empty" }
  | { kind: "unknown" };

function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function write(value: Stored): void {
  try {
    store()?.setItem(KEY, JSON.stringify(value));
  } catch {
    /* Storage can be unavailable (private mode, quota). The status then reads as unknown, which is safe. */
  }
}

/** Call with the `savedAt` the server returned from an accepted autosave. Anything unparseable is ignored. */
export function recordConfirmedSave(savedAt: unknown, now: number = Date.now()): void {
  if (typeof savedAt !== "string" || Number.isNaN(Date.parse(savedAt))) return;
  write({ kind: "confirmed", savedAt, recordedAt: now });
}

/** Call when the server confirmed there is no open sitting. */
export function recordNoOpenWork(now: number = Date.now()): void {
  write({ kind: "empty", recordedAt: now });
}

/** Call when the server reports a sitting is open but has not confirmed a save time. */
export function recordOpenWorkUnconfirmed(now: number = Date.now()): void {
  write({ kind: "open", recordedAt: now });
}

export function clearWorkStatus(): void {
  try {
    store()?.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

/** Pure given its inputs: `raw` is the stored string, `now` the current time. */
export function interpretWorkStatus(raw: string | null, now: number): WorkStatus {
  if (!raw) return { kind: "unknown" };
  let parsed: Partial<Stored> | null;
  try {
    parsed = JSON.parse(raw) as Partial<Stored> | null;
  } catch {
    return { kind: "unknown" };
  }
  if (!parsed || typeof parsed.recordedAt !== "number") return { kind: "unknown" };
  if (now - parsed.recordedAt > WORK_STATUS_MAX_AGE_MS || parsed.recordedAt > now + 60_000) {
    return { kind: "unknown" };
  }
  if (parsed.kind === "confirmed" && typeof (parsed as { savedAt?: unknown }).savedAt === "string") {
    const savedAt = (parsed as { savedAt: string }).savedAt;
    return Number.isNaN(Date.parse(savedAt)) ? { kind: "unknown" } : { kind: "confirmed", savedAt };
  }
  if (parsed.kind === "empty") return { kind: "empty" };
  return { kind: "unknown" };
}

export function readWorkStatus(now: number = Date.now()): WorkStatus {
  let raw: string | null = null;
  try {
    raw = store()?.getItem(KEY) ?? null;
  } catch {
    raw = null;
  }
  return interpretWorkStatus(raw, now);
}
