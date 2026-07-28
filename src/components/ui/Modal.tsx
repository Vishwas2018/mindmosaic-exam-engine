"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { twMerge } from "tailwind-merge";

export type ModalSize = "sm" | "md" | "lg";

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export interface ModalProps {
  open: boolean;
  /** Called whenever the dialog closes — Escape, backdrop click, or the × button. */
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Footer actions (buttons). Rendered right-aligned below the body. */
  footer?: ReactNode;
  size?: ModalSize;
  /**
   * Focused after the dialog opens. Point this at the least destructive
   * control so a stray Enter can't trigger a dangerous action. Falls back to
   * the close button.
   */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Set false to hide the × button and ignore backdrop clicks (Escape still works natively). */
  dismissable?: boolean;
  testId?: string;
  className?: string;
}

/**
 * A reusable modal built on the native `<dialog>` element opened with
 * `showModal()`. Focus trapping, background inertness, top-layer stacking and
 * Escape-to-close all come from the browser — there is no hand-rolled
 * Tab-cycling. React only opens/closes it imperatively, keeps its own state in
 * sync when the browser closes it natively, and restores focus to whatever
 * opened it. This mirrors the exam-engine SubmitConfirmationDialog so the two
 * behave identically.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  initialFocusRef,
  dismissable = true,
  testId = "modal",
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<Element | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();

  /* Read onClose through a ref so the open/close effect depends only on
     `open` — the same reasoning as SubmitConfirmationDialog: keeping the
     native "close" listener and the imperative close() in one effect keyed
     on `open` avoids a torn-down listener missing a synchronous close. */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onCloseRef.current();
      if (openerRef.current instanceof HTMLElement) {
        openerRef.current.focus();
      }
    };
    dialog.addEventListener("close", handleClose);

    if (open && !dialog.open) {
      openerRef.current = document.activeElement;
      dialog.showModal();
      (initialFocusRef?.current ?? closeButtonRef.current)?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return () => dialog.removeEventListener("close", handleClose);
  }, [open, initialFocusRef]);

  const titleId = `${baseId}-title`;
  const descriptionId = description ? `${baseId}-description` : undefined;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-testid={testId}
      className={twMerge(
        "w-full rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-ink/40 [&::backdrop]:bg-ink/40",
        sizeClasses[size],
        className,
      )}
      onClick={(event) => {
        if (dismissable && event.target === dialogRef.current) onClose();
      }}
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-black text-ink">
            {title}
          </h2>
          {dismissable && (
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              data-testid={`${testId}-close`}
              aria-label="Close"
              className="-mr-1 -mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-lg text-muted transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          )}
        </div>
        {description && (
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">
            {description}
          </p>
        )}
        {children && <div className="mt-5">{children}</div>}
        {footer && (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
