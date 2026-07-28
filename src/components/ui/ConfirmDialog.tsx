"use client";

import { useRef } from "react";
import { AlertTriangle } from "lucide-react";

import { Button, type ButtonVariant } from "./Button";
import { Modal } from "./Modal";

export type ConfirmTone = "default" | "danger";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: ConfirmTone;
  /** Shows a spinner on the confirm button and disables both actions. */
  isLoading?: boolean;
  testId?: string;
}

/**
 * A generic yes/no confirmation built on {@link Modal}. Initial focus lands on
 * the Cancel button — never Confirm — so a stray Enter immediately after the
 * dialog opens can't trigger the (possibly destructive) action.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  tone = "default",
  isLoading = false,
  testId = "confirm-dialog",
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmVariant: ButtonVariant = tone === "danger" ? "danger" : "primary";

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      testId={testId}
      initialFocusRef={cancelRef}
      dismissable={!isLoading}
      footer={
        <>
          <Button
            ref={cancelRef}
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            data-testid={`${testId}-cancel`}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isLoading}
            data-testid={`${testId}-confirm`}
          >
            {tone === "danger" && (
              <AlertTriangle aria-hidden="true" className="h-4 w-4" />
            )}
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
