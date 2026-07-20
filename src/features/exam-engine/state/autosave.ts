/**
 * Hand-rolled autosave debouncing. This is deliberately a pure decision
 * function of explicit timestamps — no internal setTimeout/setInterval —
 * mirroring deadline.ts's pattern of taking an injected `now` rather than
 * reading an ambient clock, so it is fully unit-testable without fake
 * timers. Production code drives it with a real, periodic poll (see
 * exam-store.ts); tests just call it directly with chosen instants.
 */

/**
 * True once `debounceMs` has elapsed since the last change and that
 * change has not already been flushed (saved) since it happened. A change
 * followed by more changes keeps pushing the due time out, exactly like a
 * standard debounce — only a quiet period of `debounceMs` triggers a save.
 */
export function isAutosaveDue(
  lastChangeAt: number | null,
  lastFlushedAt: number | null,
  now: number,
  debounceMs: number,
): boolean {
  if (lastChangeAt === null) return false;
  if (lastFlushedAt !== null && lastFlushedAt >= lastChangeAt) return false;
  return now - lastChangeAt >= debounceMs;
}
