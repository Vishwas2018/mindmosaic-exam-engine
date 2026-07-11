"use client";

import { useEffect, useState } from "react";
import type { useRouter } from "next/navigation";

type Router = ReturnType<typeof useRouter>;
type NavigationMode = "push" | "replace";

export interface BoundedNavigationOptions {
  /** Total navigation attempts before giving up. Default 6. */
  maxAttempts?: number;
  /** Delay between attempts in milliseconds. Default 400. */
  intervalMs?: number;
}

export interface BoundedNavigationResult {
  /** True once the attempt budget is exhausted with the caller still mounted. */
  exhausted: boolean;
  /** One more manual attempt, for a user-triggered retry after `exhausted`. */
  retry: () => void;
}

/**
 * Navigate with a small number of bounded retries, to work around an
 * App Router quirk on this Windows host where a push/replace can
 * occasionally be dropped when it races a concurrent route fetch (see
 * playwright.config.ts). This is deliberately bounded, not the unbounded
 * `setInterval` this replaces:
 *
 * - Retries stop the instant the component unmounts — which is exactly
 *   what happens when the navigation actually commits, since the caller
 *   is replaced by the destination route.
 * - Retries also stop once `maxAttempts` is reached, or immediately when
 *   `active` becomes false. Exhausting the budget while still mounted
 *   means the navigation never completed; `exhausted` lets the caller
 *   show a recoverable error instead of retrying forever.
 * - `retry()` lets the learner trigger one more manual attempt without
 *   re-running whatever produced `active` (so it can never create a
 *   second session, a second submission, etc.).
 */
export function useBoundedNavigation(
  router: Router,
  path: string,
  active: boolean,
  mode: NavigationMode = "push",
  { maxAttempts = 6, intervalMs = 400 }: BoundedNavigationOptions = {},
): BoundedNavigationResult {
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    /* `active` only ever transitions false -> true once per mounted
       instance for both current callers (a session start, an exam
       submission), so `exhausted` never needs resetting here — it starts
       false and is only ever set from inside the interval callback below. */
    if (!active) return;

    let attempts = 0;
    const navigate = () => {
      attempts += 1;
      router[mode](path);
    };

    navigate();
    const interval = window.setInterval(() => {
      if (attempts >= maxAttempts) {
        window.clearInterval(interval);
        setExhausted(true);
        return;
      }
      navigate();
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [active, path, mode, router, maxAttempts, intervalMs]);

  return {
    exhausted,
    retry: () => router[mode](path),
  };
}
