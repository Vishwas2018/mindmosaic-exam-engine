/**
 * "Keep me signed in on this device" — the design handoff's checkbox on the
 * Log in screen, made real rather than decorative.
 *
 * Supabase's browser client persists its session in `localStorage`
 * unconditionally, and `persistSession` is fixed at client-construction
 * time, so it cannot be flipped per sign-in. Rather than ship a checkbox
 * that changes nothing, the choice is recorded at sign-in and enforced on
 * the next app boot:
 *
 *   - `localStorage` survives closing the browser.
 *   - `sessionStorage` does not.
 *
 * So writing the SAME marker to both at sign-in gives a reliable test one
 * boot later: marker in `localStorage` but NOT in `sessionStorage` means
 * this is a new browser session carrying a session the user asked not to
 * keep. That session is signed out.
 *
 * Ticking the box simply clears the marker, which is the default state and
 * the default position of the checkbox.
 *
 * Deliberately not a cookie: this must never influence the server's view of
 * the session, only the client's decision to discard it on a fresh boot.
 */

const KEY = "mm.auth.ephemeral";

function storage(kind: "local" | "session"): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    /* Storage can throw outright under strict privacy settings. Treating
       that as "no preference recorded" keeps sign-in working; the cost is
       that the box behaves as if always ticked, which is the safe default
       (nothing gets signed out unexpectedly). */
    return null;
  }
}

/** Called on every successful sign-in with the checkbox's value. */
export function recordSessionPersistence(remember: boolean): void {
  const local = storage("local");
  const session = storage("session");
  if (!local || !session) return;
  try {
    if (remember) {
      local.removeItem(KEY);
      session.removeItem(KEY);
    } else {
      local.setItem(KEY, "1");
      session.setItem(KEY, "1");
    }
  } catch {
    /* Quota or privacy-mode failure — see above. */
  }
}

/**
 * True when a session was created with "keep me signed in" unticked and the
 * browser has since been closed and reopened. The caller signs out.
 */
export function shouldDiscardStoredSession(): boolean {
  const local = storage("local");
  const session = storage("session");
  if (!local || !session) return false;
  try {
    return local.getItem(KEY) === "1" && session.getItem(KEY) !== "1";
  } catch {
    return false;
  }
}

/** Clears the marker — used after the discard has been acted on, and on sign-out. */
export function clearSessionPersistence(): void {
  const local = storage("local");
  const session = storage("session");
  try {
    local?.removeItem(KEY);
    session?.removeItem(KEY);
  } catch {
    /* Nothing to do — the marker only ever causes one extra sign-out. */
  }
}
