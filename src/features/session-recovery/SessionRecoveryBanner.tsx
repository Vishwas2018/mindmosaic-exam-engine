"use client";

import { RotateCcw } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { Button, ConfirmDialog } from "@/components/ui";

import { useActiveSession } from "./useActiveSession";
import type { ActiveSession } from "./types";

export interface SessionRecoveryBannerProps {
  session: ActiveSession;
  onResume: () => void;
  onAbandon: () => void;
  className?: string;
}

export function SessionRecoveryBanner({
  session,
  onResume,
  onAbandon,
  className,
}: SessionRecoveryBannerProps) {
  const { isAbandonConfirmOpen, resume, requestAbandon, confirmAbandon, cancelAbandon } =
    useActiveSession(session, { onResume, onAbandon });

  const progress =
    session.questionsAnswered != null && session.totalQuestions != null
      ? `${session.questionsAnswered} of ${session.totalQuestions} questions answered`
      : undefined;

  return (
    <>
      <section
        role="region"
        aria-label="Resume previous session"
        className={twMerge(
          "flex flex-col gap-4 rounded-2xl border border-royal-orange/20 bg-[linear-gradient(145deg,#FFFFFF_0%,#FFF7EC_100%)] p-5 sm:flex-row sm:items-center sm:justify-between",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <RotateCcw aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-royal-orange" />
          <div>
            <p className="text-sm font-extrabold text-ink">
              You have an unfinished session: {session.examTitle}
            </p>
            {progress && <p className="mt-0.5 text-sm text-muted">{progress}</p>}
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button type="button" variant="secondary" onClick={requestAbandon}>
            Abandon
          </Button>
          <Button type="button" variant="orange" onClick={resume}>
            Resume
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={isAbandonConfirmOpen}
        title="Abandon this session?"
        description="Your progress on this attempt will be lost and can't be recovered."
        confirmLabel="Abandon session"
        cancelLabel="Keep working"
        variant="danger"
        onConfirm={confirmAbandon}
        onCancel={cancelAbandon}
      />
    </>
  );
}
