import type { ActiveSession } from "./types";

/**
 * Whether a new exam session may start, given whatever session is already
 * recorded as active. An expired session (past its `expiresAt`) no longer
 * blocks a new one — only a live one does.
 */
export function preventDuplicateActiveSession(
  existing: ActiveSession | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!existing) return true;
  if (existing.expiresAt && new Date(existing.expiresAt).getTime() <= now.getTime()) {
    return true;
  }
  return false;
}
