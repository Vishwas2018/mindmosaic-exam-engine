"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Check, Copy, ExternalLink, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/Button";

import type { UatGitHubLink, UatIssue } from "../types";
import { formatGitHubIssueBody } from "../utils/exporters";

export interface GitHubConfirmModalProps {
  open: boolean;
  issue: UatIssue | null;
  githubRepo: string;
  githubConfigured: boolean;
  onClose: () => void;
  onCreated: (issueId: string, link: UatGitHubLink) => void;
}

export function GitHubConfirmModal({
  open,
  issue,
  githubRepo,
  githubConfigured,
  onClose,
  onCreated,
}: GitHubConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  const [acknowledgedForKey, setAcknowledgedForKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorState, setErrorState] = useState<{ key: string; message: string } | null>(null);
  const [copiedForKey, setCopiedForKey] = useState<string | null>(null);

  const modalKey = `${issue?.id ?? "none"}:${open ? "open" : "closed"}`;
  const acknowledged = acknowledgedForKey === modalKey;
  const errorMessage = errorState?.key === modalKey ? errorState.message : null;
  const copied = copiedForKey === modalKey;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      dialog.returnValue = "";
      onClose();
    };
    dialog.addEventListener("close", handleNativeClose);

    if (open && issue && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if ((!open || !issue) && dialog.open) {
      dialog.close();
    }

    return () => dialog.removeEventListener("close", handleNativeClose);
  }, [open, issue, onClose]);

  if (!issue) return null;

  const previewBody = formatGitHubIssueBody(issue);

  const handleConfirmCreate = async () => {
    if (!acknowledged) {
      setErrorState({
        key: modalKey,
        message: "Tick the confirmation checkbox above before creating a GitHub issue.",
      });
      return;
    }

    setErrorState(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/uat/github", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          confirmed: true,
          issueId: issue.id,
          title: issue.title,
          body: previewBody,
          severity: issue.severity,
          category: issue.category,
        }),
      });
      const payload = (await response.json()) as
        | { ok: true; githubIssue: UatGitHubLink }
        | { ok: false; message?: string };

      if (!response.ok || !payload.ok) {
        setErrorState({
          key: modalKey,
          message:
            ("message" in payload && payload.message) ||
            "Could not create GitHub issue. Your defect remains saved locally.",
        });
        return;
      }

      onCreated(issue.id, payload.githubIssue);
      onClose();
    } catch {
      setErrorState({
        key: modalKey,
        message: "Network error while contacting MindMosaic server. Your defect remains saved locally.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(`# ${issue.title}\n\n${previewBody}`);
      setCopiedForKey(modalKey);
      setTimeout(() => setCopiedForKey(null), 2000);
    } catch {
      setErrorState({
        key: modalKey,
        message: "Clipboard access was denied. Use Export Markdown in the dashboard instead.",
      });
    }
  };

  return (
    <dialog
      ref={dialogRef}
      data-uat-assistant="true"
      data-testid="uat-github-confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-mm-line bg-mm-surface p-0 font-[family-name:var(--font-geist)] text-mm-ink shadow-[0_24px_60px_rgba(24,21,31,0.24)] backdrop:bg-mm-ink/45"
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              id={titleId}
              className="font-[family-name:var(--font-instrument-sans)] text-xl font-semibold tracking-[-0.028em] text-mm-ink"
            >
              Confirm GitHub issue creation
            </h1>
            <p id={descId} className="mt-1 text-sm text-mm-muted">
              Review the exact repository, title, and redacted Markdown payload before publishing externally to{" "}
              <code className="rounded bg-mm-tint px-1.5 py-0.5 font-mono text-xs text-mm-brand">{githubRepo}</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close GitHub confirmation"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-mm-muted transition hover:bg-mm-tint hover:text-mm-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-mm-line bg-mm-tint-soft p-3.5 text-xs text-mm-ink-soft">
          <div className="flex items-center gap-2 font-semibold text-mm-ink">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-mm-brand" />
            <span>Privacy & security check</span>
          </div>
          <p className="mt-1 leading-5">
            Tokens, query codes, and credentials are automatically stripped. Local screenshot pixels stay in your
            browser IndexedDB and are not uploaded to external image hosts.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-mm-muted">Issue title</p>
            <p className="mt-1 rounded-xl border border-mm-line bg-mm-page px-3.5 py-2.5 text-sm font-medium text-mm-ink">
              {issue.title}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-mm-muted">Markdown body preview</p>
            <pre className="mt-1 max-h-56 overflow-auto rounded-xl border border-mm-line bg-mm-page p-3.5 font-mono text-xs leading-5 whitespace-pre-wrap text-mm-ink-soft">
              {previewBody}
            </pre>
          </div>
        </div>

        {!githubConfigured && (
          <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-warning">
            Server token <code className="font-mono">MM_UAT_GITHUB_TOKEN</code> is not configured in this DEV
            environment. You can copy the formatted Markdown below to paste directly into GitHub.
          </p>
        )}

        <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-mm-line bg-mm-surface px-3.5 py-2.5 text-sm text-mm-ink">
          <input
            type="checkbox"
            data-testid="uat-github-confirm-checkbox"
            checked={acknowledged}
            onChange={(event) => {
              setAcknowledgedForKey(event.target.checked ? modalKey : null);
              if (event.target.checked) setErrorState(null);
            }}
            className="h-4 w-4 accent-mm-brand"
          />
          <span>
            I have reviewed the defect details above and confirm creating an issue in{" "}
            <strong className="font-semibold">{githubRepo}</strong>.
          </span>
        </label>

        {errorMessage && (
          <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-error">
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
          <Button ref={cancelRef} type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="uat-github-copy-markdown"
            onClick={() => void handleCopyMarkdown()}
          >
            {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
            <span>{copied ? "Copied Markdown" : "Copy Markdown"}</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            data-testid="uat-github-submit-confirm"
            isLoading={isSubmitting}
            loadingLabel="Creating issue…"
            disabled={!githubConfigured}
            onClick={() => void handleConfirmCreate()}
          >
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
            <span>Confirm & create GitHub issue</span>
          </Button>
        </div>
      </div>
    </dialog>
  );
}
