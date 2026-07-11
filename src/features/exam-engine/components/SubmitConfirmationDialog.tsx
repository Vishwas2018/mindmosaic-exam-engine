"use client";

import { useEffect, useRef } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui";

export interface SubmitConfirmationDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  flaggedCount: number;
  manualReviewCount: number;
}

/**
 * The submission confirmation dialog is a native `<dialog>` opened with
 * `showModal()`, not a styled `<div>`. That gets focus trapping, background
 * inertness and top-layer stacking from the browser for free — no hand-rolled
 * Tab-cycling logic to get subtly wrong. React only needs to: open/close it
 * imperatively in response to the `open` prop, keep its own state in sync
 * when the browser closes it natively (Escape), and restore focus to
 * whichever control opened it.
 */
export function SubmitConfirmationDialog({
  open,
  onCancel,
  onConfirm,
  totalQuestions,
  answeredCount,
  unansweredCount,
  flaggedCount,
  manualReviewCount,
}: SubmitConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<Element | null>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  /* Read via a ref inside the effect below so the effect's only real
     dependency is `open` — see the comment on that effect for why. */
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    /* Escape triggers the browser's native close, which fires "close" —
       this is the one place that keeps React state and the dialog's own
       open/closed state in agreement, and the right moment to restore
       focus to whatever opened it. The listener is attached *before* the
       possible dialog.close() call below, in the same effect, so a
       synchronously dispatched "close" is never missed: splitting this
       into two effects keyed on different dependencies (open vs onCancel)
       previously let React tear down and rebuild the listener in a
       separate pass from the close() call, so the very close() that was
       supposed to trigger it could fire while nothing was listening. */
    const handleClose = () => {
      onCancelRef.current();
      if (openerRef.current instanceof HTMLElement) {
        openerRef.current.focus();
      }
    };
    dialog.addEventListener("close", handleClose);

    if (open && !dialog.open) {
      openerRef.current = document.activeElement;
      dialog.showModal();
      /*
       * The dialog's content stays mounted whether or not it is open (so
       * imperative open/close can toggle it), so React's own `autoFocus`
       * prop would fire once at mount time rather than each time the
       * dialog actually opens. Focusing explicitly here, right after
       * `showModal()`, lands on the non-destructive "Keep working" button
       * — never "Submit now" — so a stray Enter key right after opening
       * can't submit.
       */
      initialFocusRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return () => dialog.removeEventListener("close", handleClose);
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="submit-dialog-title"
      aria-describedby="submit-dialog-description"
      data-testid="submit-dialog"
      className="w-full max-w-md rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-ink/40 [&::backdrop]:bg-ink/40"
      onClick={(event) => {
        /* A click that lands on the <dialog> element itself (rather than
           any child) is a click on the backdrop area — treat it as Cancel. */
        if (event.target === dialogRef.current) onCancel();
      }}
    >
      <div className="p-6 sm:p-8">
        <h2 id="submit-dialog-title" className="text-xl font-black text-ink">
          Ready to submit?
        </h2>
        <p
          id="submit-dialog-description"
          className="mt-2 text-sm leading-6 text-muted"
        >
          Once submitted, your answers are locked and your results are shown.
        </p>
        <dl className="mt-5 space-y-2 rounded-xl bg-page p-4 text-sm">
          <div className="flex justify-between">
            <dt className="font-semibold text-muted">Total questions</dt>
            <dd className="font-black tabular-nums text-ink" data-testid="summary-total">
              {totalQuestions}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-semibold text-muted">Answered</dt>
            <dd
              className="font-black tabular-nums text-success"
              data-testid="summary-answered"
            >
              {answeredCount}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-semibold text-muted">Not answered</dt>
            <dd
              className={`font-black tabular-nums ${unansweredCount > 0 ? "text-error" : "text-ink"}`}
              data-testid="summary-unanswered"
            >
              {unansweredCount}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-semibold text-muted">Flagged for review</dt>
            <dd
              className="font-black tabular-nums text-warning"
              data-testid="summary-flagged"
            >
              {flaggedCount}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-semibold text-muted">Marked by a person</dt>
            <dd className="font-black tabular-nums text-ink" data-testid="summary-manual">
              {manualReviewCount}
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            ref={initialFocusRef}
            variant="secondary"
            onClick={onCancel}
            data-testid="return-to-exam"
          >
            Keep working
          </Button>
          <Button variant="orange" onClick={onConfirm} data-testid="confirm-submit">
            <Send aria-hidden="true" className="h-4 w-4" />
            Submit now
          </Button>
        </div>
      </div>
    </dialog>
  );
}
