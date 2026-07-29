"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { twMerge } from "tailwind-merge";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  /** Element focused once the dialog opens; defaults to the dialog's own heading. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  hideCloseButton?: boolean;
}

/**
 * Native `<dialog>` opened with `showModal()` — see
 * SubmitConfirmationDialog for the pattern this generalises: the browser
 * gives us focus trapping, background inertness and top-layer stacking, so
 * React only has to keep `open` in sync with the dialog's own open/closed
 * state (Escape triggers a native "close" the effect listens for) and
 * restore focus to whatever opened it.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  initialFocusRef,
  hideCloseButton = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<Element | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const titleId = useId();
  const descriptionId = useId();

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
      (initialFocusRef?.current ?? titleRef.current)?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return () => dialog.removeEventListener("close", handleClose);
  }, [open, initialFocusRef]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={twMerge(
        "w-full max-w-md rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-ink/40 [&::backdrop]:bg-ink/40",
        className,
      )}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2
            ref={titleRef}
            id={titleId}
            tabIndex={-1}
            className="text-xl font-black text-ink outline-none"
          >
            {title}
          </h2>
          {!hideCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-full p-1.5 text-muted transition hover:bg-royal/8 hover:text-ink"
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
      </div>
    </dialog>
  );
}
