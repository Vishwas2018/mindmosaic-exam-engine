"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth";
import { SessionRecoveryBanner } from "@/features/session-recovery";

import { toActiveSession } from "../state/active-session-view";
import { useExamStore } from "../state/exam-store";
import type { ActiveSessionResponse } from "../scoring/server-scoring-contract";

export interface ActiveSessionBannerProps {
  className?: string;
}

/**
 * Screens 7 & 8 "resume an in-progress session" widget. Wraps Agent F's
 * shared SessionRecoveryBanner with the exam engine's own resume lookup
 * (GET /api/exam/session/active — the same endpoint /exam's resumeServerExam
 * already uses) so a signed-in student who left mid-exam sees the same
 * banner whether they land on the dashboard or the practice catalogue.
 *
 * Guests are skipped entirely: a guest session lives only in memory and
 * cannot be looked up server-side (see the resume note on /exam).
 *
 * "Abandon" has no dedicated API today — there is no DELETE endpoint for an
 * exam_sessions row. For v1 it only dismisses the banner client-side; the
 * server session simply expires on its own `expires_at` (docs/
 * ASSESSMENT_SECURITY_MODEL.md), same as it would if the student just
 * ignored it.
 */
export function ActiveSessionBanner({ className }: ActiveSessionBannerProps) {
  const auth = useAuth();
  const router = useRouter();
  const resumeServerExam = useExamStore((state) => state.resumeServerExam);
  const [active, setActive] = useState<ActiveSessionResponse | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    let cancelled = false;
    fetch("/api/exam/session/active")
      .then((response) => (response.ok ? (response.json() as Promise<ActiveSessionResponse>) : null))
      .then((data) => {
        if (!cancelled) setActive(data);
      })
      .catch(() => {
        if (!cancelled) setActive(null);
      });
    return () => {
      cancelled = true;
    };
  }, [auth.status]);

  if (!active || dismissed) return null;

  return (
    <SessionRecoveryBanner
      className={className}
      session={toActiveSession(active)}
      onResume={() => {
        void resumeServerExam().then((resumed) => {
          if (resumed) router.push("/exam");
        });
      }}
      onAbandon={() => setDismissed(true)}
    />
  );
}
