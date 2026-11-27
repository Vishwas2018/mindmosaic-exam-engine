"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Crosshair,
  FileText,
  Mic,
  MicOff,
  RotateCcw,
  Wand2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

import {
  clearUatDraft,
  getUatDraft,
  saveUatDraft,
  saveUatIssue,
} from "../storage/uat-idb";
import {
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  UAT_ISSUE_CATEGORIES,
  UAT_ISSUE_SEVERITIES,
  type UatAiDraft,
  type UatElementCapture,
  type UatEnvironmentContext,
  type UatIssue,
  type UatIssueCategory,
  type UatIssueSeverity,
  type UatScreenshotCapture,
} from "../types";
import { buildLocalStructuredDraft } from "../utils/exporters";
import { redactSensitiveText, sanitizeUrlForReport } from "../utils/redaction";
import { ScreenshotAnnotator } from "./ScreenshotAnnotator";
import { useSpeechToText } from "./useSpeechToText";

export interface ReportIssueModalProps {
  open: boolean;
  onClose: () => void;
  onStartElementPick: () => void;
  pickedElement: UatElementCapture | null;
  onClearElement: () => void;
  environment: UatEnvironmentContext;
  aiConfigured: boolean;
  onSaved: (issue: UatIssue) => void;
}

export function ReportIssueModal({
  open,
  onClose,
  onStartElementPick,
  pickedElement,
  onClearElement,
  environment,
  aiConfigured,
  onSaved,
}: ReportIssueModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const descId = useId();

  const [originalNotes, setOriginalNotes] = useState("");
  const [notesTouched, setNotesTouched] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [actualResult, setActualResult] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [severity, setSeverity] = useState<UatIssueSeverity>("medium");
  const [category, setCategory] = useState<UatIssueCategory>("functional");
  const [inputMethod, setInputMethod] = useState<"text" | "voice" | "mixed">("text");
  const [aiDraft, setAiDraft] = useState<UatAiDraft | null>(null);
  const [screenshot, setScreenshot] = useState<UatScreenshotCapture | null>(null);

  const [isImproving, setIsImproving] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{
    tone: "info" | "warning" | "error";
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const speech = useSpeechToText({
    onFinalTranscript: (chunk) => {
      setOriginalNotes((prev) => {
        const separator = prev.trim().length > 0 ? " " : "";
        return `${prev}${separator}${chunk}`;
      });
      setNotesError(null);
      setInputMethod((prev) => (prev === "text" && originalNotes.trim().length > 0 ? "mixed" : "voice"));
    },
  });

  // Restore persisted draft once on mount so browser restarts never lose notes.
  useEffect(() => {
    let active = true;
    getUatDraft()
      .then((draft) => {
        if (!active || !draft) {
          setDraftLoaded(true);
          return;
        }
        setOriginalNotes(draft.originalNotes);
        setTitle(draft.title);
        setDescription(draft.description);
        setStepsText(draft.stepsText);
        setActualResult(draft.actualResult);
        setExpectedResult(draft.expectedResult);
        setSeverity(draft.severity);
        setCategory(draft.category);
        setInputMethod(draft.inputMethod);
        setAiDraft(draft.aiDraft);
        setScreenshot(draft.screenshot);
        setDraftLoaded(true);
      })
      .catch(() => setDraftLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  // Debounced auto-save of draft to IndexedDB.
  useEffect(() => {
    if (!draftLoaded) return;
    const handle = setTimeout(() => {
      const hasContent =
        originalNotes.trim().length > 0 ||
        title.trim().length > 0 ||
        pickedElement !== null ||
        screenshot !== null;
      if (!hasContent) return;
      void saveUatDraft({
        id: "active-draft",
        title,
        originalNotes,
        description,
        stepsText,
        actualResult,
        expectedResult,
        severity,
        category,
        inputMethod,
        element: pickedElement,
        aiDraft,
        screenshot,
        updatedAt: new Date().toISOString(),
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [
    draftLoaded,
    title,
    originalNotes,
    description,
    stepsText,
    actualResult,
    expectedResult,
    severity,
    category,
    inputMethod,
    pickedElement,
    aiDraft,
    screenshot,
  ]);

  // Native <dialog> modal sync.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = "";
      speech.stopListening();
      onClose();
    };
    dialog.addEventListener("close", handleClose);

    if (open && !dialog.open) {
      dialog.showModal();
      notesRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return () => dialog.removeEventListener("close", handleClose);
  }, [open, onClose, speech]);

  const applyDraftFields = (draft: UatAiDraft) => {
    setTitle(draft.title);
    setDescription(draft.description);
    setStepsText(draft.stepsToReproduce.join("\n"));
    setActualResult(draft.actualResult);
    setExpectedResult(draft.expectedResult);
    setSeverity(draft.severity);
    setCategory(draft.category);
    setAiDraft(draft);
  };

  const handleImproveWithAi = async () => {
    if (originalNotes.trim().length < 3) {
      setNotesTouched(true);
      setNotesError("Describe what you observed first (at least a short phrase) so AI has factual notes to format.");
      notesRef.current?.focus();
      return;
    }

    setNotesError(null);
    setAiFeedback(null);
    setIsImproving(true);

    try {
      const response = await fetch("/api/uat/improve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          originalNotes,
          route: environment.route,
          pageUrl: environment.pageUrl,
          portal: environment.portal,
          browser: environment.browser,
          viewport: {
            width: environment.viewport.width,
            height: environment.viewport.height,
          },
          element: pickedElement,
        }),
      });

      const payload = (await response.json()) as
        | { ok: true; draft: UatAiDraft }
        | { ok: false; code?: string; message?: string };

      if (!response.ok || !payload.ok) {
        const localFallback = buildLocalStructuredDraft(originalNotes, environment, pickedElement);
        applyDraftFields(localFallback);
        setAiFeedback({
          tone: "warning",
          message:
            ("message" in payload && payload.message
              ? `${payload.message} `
              : "AI service was unavailable. ") +
            "Structured locally from your verbatim notes — review and edit any field below.",
        });
        return;
      }

      applyDraftFields(payload.draft);
      setAiFeedback({
        tone: "info",
        message:
          "Suggested by MindMosaic's UAT helper from your notes. Review and edit before saving — AI can make mistakes.",
      });
    } catch {
      const localFallback = buildLocalStructuredDraft(originalNotes, environment, pickedElement);
      applyDraftFields(localFallback);
      setAiFeedback({
        tone: "warning",
        message:
          "Could not reach the server AI endpoint. Structured locally from your verbatim notes — your work is safe.",
      });
    } finally {
      setIsImproving(false);
    }
  };

  const handleResetForm = async () => {
    speech.stopListening();
    setOriginalNotes("");
    setNotesTouched(false);
    setNotesError(null);
    setTitle("");
    setDescription("");
    setStepsText("");
    setActualResult("");
    setExpectedResult("");
    setSeverity("medium");
    setCategory("functional");
    setInputMethod("text");
    setAiDraft(null);
    setScreenshot(null);
    setAiFeedback(null);
    onClearElement();
    await clearUatDraft();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    speech.stopListening();

    const trimmedNotes = originalNotes.trim();
    if (trimmedNotes.length < 3) {
      setNotesTouched(true);
      setNotesError("Enter or dictate your observation notes before saving this defect.");
      notesRef.current?.focus();
      return;
    }

    setIsSaving(true);
    try {
      const fallback = buildLocalStructuredDraft(trimmedNotes, environment, pickedElement);
      const parsedSteps = stepsText
        .split(/\r?\n/)
        .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
        .filter(Boolean);

      const nowIso = new Date().toISOString();
      const issueId = `DEF-${nowIso.slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const issue: UatIssue = {
        id: issueId,
        status: "open",
        title: redactSensitiveText(title.trim() || fallback.title).slice(0, 200),
        originalNotes: redactSensitiveText(trimmedNotes),
        description: redactSensitiveText(description.trim() || trimmedNotes),
        stepsToReproduce: (parsedSteps.length > 0 ? parsedSteps : fallback.stepsToReproduce).map((s) =>
          redactSensitiveText(s),
        ),
        actualResult: redactSensitiveText(actualResult.trim() || trimmedNotes),
        expectedResult: redactSensitiveText(expectedResult.trim() || fallback.expectedResult),
        severity,
        category,
        inputMethod,
        element: pickedElement,
        environment: {
          ...environment,
          timestamp: nowIso,
          pageUrl: sanitizeUrlForReport(environment.pageUrl),
        },
        aiDraft,
        screenshot,
        githubIssue: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await saveUatIssue(issue);
      await clearUatDraft();
      await handleResetForm();
      onSaved(issue);
    } finally {
      setIsSaving(false);
    }
  };

  const showStructuredSection =
    aiDraft !== null ||
    title.trim().length > 0 ||
    description.trim().length > 0 ||
    stepsText.trim().length > 0;

  return (
    <dialog
      ref={dialogRef}
      data-uat-assistant="true"
      data-testid="uat-report-dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto rounded-2xl border border-mm-line bg-mm-surface p-0 font-[family-name:var(--font-geist)] text-mm-ink shadow-[0_24px_60px_rgba(24,21,31,0.22)] backdrop:bg-mm-ink/40"
    >
      <form method="post" action="/api/uat/improve" onSubmit={(e) => void handleSubmit(e)} noValidate className="p-5 sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1
                id={titleId}
                className="font-[family-name:var(--font-instrument-sans)] text-2xl font-semibold tracking-[-0.028em] text-mm-ink"
              >
                Report UAT issue
              </h1>
              <Badge variant="purple">DEV only</Badge>
            </div>
            <p id={descId} className="mt-1 text-sm text-mm-muted">
              Capture an element, dictate or type your observation, and refine into a structured defect saved locally in IndexedDB.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report dialog"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-mm-muted transition hover:bg-mm-tint hover:text-mm-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {/* Auto-captured context strip */}
        <div
          data-testid="uat-context-strip"
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-mm-line bg-mm-page px-3.5 py-2.5 text-xs text-mm-muted tabular-nums"
        >
          <span>
            <strong className="font-semibold text-mm-ink-soft">Portal:</strong> {environment.portal}
          </span>
          <span>
            <strong className="font-semibold text-mm-ink-soft">Route:</strong>{" "}
            <code className="font-mono text-mm-ink">{environment.route}</code>
          </span>
          <span>
            <strong className="font-semibold text-mm-ink-soft">Viewport:</strong>{" "}
            {environment.viewport.width}×{environment.viewport.height}
          </span>
          <span>
            <strong className="font-semibold text-mm-ink-soft">Browser:</strong> {environment.browser}
          </span>
          <span>
            <strong className="font-semibold text-mm-ink-soft">Session:</strong> {environment.testSessionId}
          </span>
        </div>

        {/* Step 1: Element selection */}
        <div className="mt-5 rounded-2xl border border-mm-line bg-mm-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-mm-ink">Target element</p>
              <p className="text-xs text-mm-muted">
                Selecting highlights the element and records a stable locator without triggering page controls.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {pickedElement && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-testid="uat-clear-element"
                  onClick={onClearElement}
                >
                  Clear
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                data-testid="uat-pick-element-btn"
                onClick={onStartElementPick}
              >
                <Crosshair aria-hidden="true" className="h-4 w-4" />
                <span>{pickedElement ? "Re-select element" : "Select element"}</span>
              </Button>
            </div>
          </div>

          {pickedElement && (
            <div
              data-testid="uat-picked-element-card"
              className="mt-3 rounded-xl border border-mm-tint-line bg-mm-tint-soft px-3.5 py-2.5 text-xs"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-mm-brand px-1.5 py-0.5 font-mono font-semibold text-white">
                  &lt;{pickedElement.tagName}&gt;
                </span>
                <code
                  data-testid="uat-picked-locator"
                  className="font-mono font-medium text-mm-ink break-all"
                >
                  {pickedElement.locator}
                </code>
              </div>
              <p className="mt-1.5 text-mm-ink-soft">
                <strong className="font-semibold">Visible summary:</strong> {pickedElement.visibleSnippet}
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Voice or text observation (Original Notes — always preserved) */}
        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="uat-original-notes" className="text-sm font-bold text-mm-ink">
              Your observation notes (preserved verbatim) <span aria-hidden="true" className="text-error">*</span>
            </label>

            {speech.supported ? (
              <button
                type="button"
                data-testid="uat-voice-toggle"
                aria-pressed={speech.state === "listening"}
                onClick={() =>
                  speech.state === "listening" ? speech.stopListening() : speech.startListening()
                }
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand ${
                  speech.state === "listening"
                    ? "border-mm-coral-text bg-mm-alert text-mm-coral-deep"
                    : "border-mm-line bg-mm-surface text-mm-brand hover:border-mm-brand/40 hover:bg-mm-tint-soft"
                }`}
              >
                {speech.state === "listening" ? (
                  <>
                    <MicOff aria-hidden="true" className="h-4 w-4" />
                    <span>Stop dictation</span>
                  </>
                ) : (
                  <>
                    <Mic aria-hidden="true" className="h-4 w-4" />
                    <span>Dictate by voice</span>
                  </>
                )}
              </button>
            ) : (
              <span
                data-testid="uat-voice-unsupported"
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-mm-line bg-mm-page px-2.5 py-1 text-xs text-mm-muted"
              >
                <MicOff aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                <span>Voice unsupported in this browser — type notes below</span>
              </span>
            )}
          </div>

          {speech.statusMessage && (
            <p
              role={speech.state === "denied" || speech.state === "error" ? "alert" : "status"}
              data-testid="uat-voice-status"
              className={`mb-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                speech.state === "denied" || speech.state === "error" || speech.state === "no-mic"
                  ? "border-error/25 bg-mm-alert text-error"
                  : "border-mm-tint-line bg-mm-tint-soft text-mm-ink-soft"
              }`}
            >
              {speech.statusMessage}
              {speech.interimTranscript ? ` "${speech.interimTranscript}"` : ""}
            </p>
          )}

          <Textarea
            id="uat-original-notes"
            name="originalNotes"
            ref={notesRef}
            required
            rows={4}
            value={originalNotes}
            placeholder="Describe what looks wrong or behaved unexpectedly (e.g. 'On 375px mobile, the Submit button overlaps the question stem on Question 3')."
            error={notesError ?? undefined}
            hint="Your exact words are always saved alongside any AI-formatted fields."
            onBlur={() => {
              setNotesTouched(true);
              if (originalNotes.trim().length > 0 && originalNotes.trim().length < 3) {
                setNotesError("Please enter at least 3 characters describing the discrepancy.");
              }
            }}
            onChange={(event) => {
              const val = event.target.value;
              setOriginalNotes(val);
              if (notesError && val.trim().length >= 3) {
                setNotesError(null);
              }
              setInputMethod((prev) => (prev === "voice" ? "mixed" : prev));
            }}
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                data-testid="uat-improve-ai-btn"
                isLoading={isImproving}
                loadingLabel="Formatting report…"
                onClick={() => void handleImproveWithAi()}
              >
                <Wand2 aria-hidden="true" className="h-4 w-4" />
                <span>{aiConfigured ? "Improve with AI" : "Improve / structure report"}</span>
              </Button>

              {!showStructuredSection && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-testid="uat-edit-manual-fields-btn"
                  onClick={() => {
                    const draft = buildLocalStructuredDraft(
                      originalNotes.trim() || "Manual defect observation",
                      environment,
                      pickedElement,
                    );
                    applyDraftFields(draft);
                  }}
                >
                  <FileText aria-hidden="true" className="h-4 w-4" />
                  <span>Edit structured fields</span>
                </Button>
              )}
            </div>

            {(originalNotes || title || pickedElement || screenshot) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-testid="uat-reset-draft-btn"
                onClick={() => void handleResetForm()}
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                <span>Clear draft</span>
              </Button>
            )}
          </div>
        </div>

        {/* AI / Structuring feedback banner */}
        {aiFeedback && (
          <div
            role="status"
            data-testid="uat-ai-feedback"
            className={`mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs leading-5 ${
              aiFeedback.tone === "warning"
                ? "border-amber-300 bg-amber-50 text-warning"
                : aiFeedback.tone === "error"
                  ? "border-error/25 bg-mm-alert text-error"
                  : "border-mm-tint-line bg-mm-tint-soft text-mm-ink-soft"
            }`}
          >
            {aiFeedback.tone === "info" ? (
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-mm-brand" />
            ) : (
              <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{aiFeedback.message}</span>
          </div>
        )}

        {/* Step 3: Editable structured report fields */}
        {showStructuredSection && (
          <fieldset className="mt-5 space-y-4 rounded-2xl border border-mm-line bg-mm-page/70 p-4">
            <legend className="px-1 text-sm font-bold text-mm-ink">
              Structured defect report (editable)
            </legend>

            <Input
              id="uat-field-title"
              name="title"
              label="Defect title"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                id="uat-field-severity"
                name="severity"
                label="Severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as UatIssueSeverity)}
              >
                {UAT_ISSUE_SEVERITIES.map((sev) => (
                  <option key={sev} value={sev}>
                    {SEVERITY_LABELS[sev]}
                  </option>
                ))}
              </Select>

              <Select
                id="uat-field-category"
                name="category"
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value as UatIssueCategory)}
              >
                {UAT_ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </Select>
            </div>

            <Textarea
              id="uat-field-description"
              name="description"
              label="Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Textarea
              id="uat-field-steps"
              name="stepsToReproduce"
              label="Steps to reproduce (one step per line)"
              rows={3}
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Textarea
                id="uat-field-actual"
                name="actualResult"
                label="Actual result"
                rows={3}
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
              />
              <Textarea
                id="uat-field-expected"
                name="expectedResult"
                label="Expected result"
                rows={3}
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
              />
            </div>
          </fieldset>
        )}

        {/* Step 4: Optional Screenshot & Annotations */}
        <div className="mt-5">
          <ScreenshotAnnotator
            screenshot={screenshot}
            onChange={setScreenshot}
            selectedElementBox={pickedElement?.boundingBox}
          />
        </div>

        {/* Submit row */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-mm-line pt-4">
          <p className="text-xs text-mm-muted">
            {notesTouched && !notesError ? "Draft auto-saved locally." : "Saved locally in browser IndexedDB."}
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              data-testid="uat-save-issue-btn"
              isLoading={isSaving}
              loadingLabel="Saving defect…"
            >
              Save defect
            </Button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
