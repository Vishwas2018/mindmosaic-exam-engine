"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { BatchSummary, ReviewDecision, ReviewItem } from "../types";
import { computeBatchSummary } from "../batch-summary";
import { serializeReviewCsv } from "../csv-writer";
import { PinnedStimulus } from "./PinnedStimulus";
import { QuestionViewer } from "./QuestionViewer";
import { BatchSummaryView } from "./BatchSummaryView";

export interface BatchOption {
  id: string;
  title: string;
  description: string;
  type: string;
  itemCount: number;
}

export interface ReviewConsoleProps {
  initialBatchId?: string;
}

export function ReviewConsole({ initialBatchId = "governed-year3" }: ReviewConsoleProps) {
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false);

  // Timing state
  const [timeOnCurrentItemSeconds, setTimeOnCurrentItemSeconds] = useState<number>(0);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState<number>(0);
  const [itemTimes, setItemTimes] = useState<Record<string, number>>({});

  // Export feedback modal
  const [exportResult, setExportResult] = useState<{
    csv: string;
    filePath?: string;
    relativeFilePath?: string;
    recordCommand?: string;
    publishCommand?: string;
    fileName?: string;
  } | null>(null);

  // Fetch available batches
  useEffect(() => {
    let active = true;
    fetch("/api/dev/review-console?action=list")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (active && data.ok && Array.isArray(data.batches)) {
          setBatches(data.batches);
        }
      })
      .catch((err) => {
        if (active) setError(String(err));
      });
    return () => {
      active = false;
    };
  }, []);

  // Load selected batch
  useEffect(() => {
    let cancelled = false;
    const fetchBatch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dev/review-console?action=load&batch=${encodeURIComponent(selectedBatchId)}`);
        if (!res.ok) throw new Error(`Failed to load batch: HTTP ${res.status}`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? "Failed to load batch");

        if (!cancelled) {
          setItems(data.items ?? []);
          setCurrentIndex(0);
          setTimeOnCurrentItemSeconds(0);
          setItemTimes({});
          setSummary(data.summary ?? computeBatchSummary(data.items ?? []));
        }
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBatch();
    return () => {
      cancelled = true;
    };
  }, [selectedBatchId]);

  // Timers
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeOnCurrentItemSeconds((prev) => prev + 1);
      setTotalElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentItem = items[currentIndex];

  const handleIndexChange = useCallback(
    (newIndex: number) => {
      if (currentItem) {
        setItemTimes((prev) => ({
          ...prev,
          [currentItem.id]: (prev[currentItem.id] ?? 0) + timeOnCurrentItemSeconds,
        }));
      }
      setCurrentIndex(newIndex);
      setTimeOnCurrentItemSeconds(0);
    },
    [currentItem, timeOnCurrentItemSeconds],
  );

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      handleIndexChange(currentIndex + 1);
    }
  }, [currentIndex, items.length, handleIndexChange]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      handleIndexChange(currentIndex - 1);
    }
  }, [currentIndex, handleIndexChange]);

  const handleDecisionChange = useCallback(
    (id: string, decision: ReviewDecision) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                decision,
                checks: {
                  correctness: decision === "approve",
                  originality: decision === "approve",
                  ageAppropriateness: decision === "approve",
                },
              }
            : item,
        ),
      );
    },
    [],
  );

  const handleNotesChange = useCallback((id: string, notes: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, notes } : item)));
  }, []);

  // Export CSV handler
  const handleExportCsv = useCallback(async () => {
    if (items.length === 0) return;
    try {
      const res = await fetch("/api/dev/review-console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: selectedBatchId,
          items,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setExportResult({
          csv: data.csv,
          filePath: data.filePath,
          relativeFilePath: data.relativeFilePath,
          recordCommand: data.recordCommand,
          fileName: data.fileName,
        });

        // Trigger browser download
        const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", data.fileName || "review.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(`Export failed: ${data.error}`);
      }
    } catch {
      // Client-side fallback download
      const csv = serializeReviewCsv(items);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "review.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportResult({
        csv,
        fileName: "review.csv",
        recordCommand: 'npm run content:record-approvals -- --sheet "review.csv" --reviewer "Your Full Name"',
      });
    }
  }, [items, selectedBatchId]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is focused inside a textarea or input:
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "textarea" || activeTag === "input") {
        if (e.key === "Escape") {
          (document.activeElement as HTMLElement)?.blur();
          e.preventDefault();
        }
        return;
      }

      const key = e.key.toLowerCase();

      if (key === "a") {
        e.preventDefault();
        if (currentItem) handleDecisionChange(currentItem.id, "approve");
      } else if (key === "r") {
        e.preventDefault();
        if (currentItem) handleDecisionChange(currentItem.id, "reject");
      } else if (key === "v") {
        e.preventDefault();
        if (currentItem) handleDecisionChange(currentItem.id, "revise");
      } else if (key === "u") {
        e.preventDefault();
        if (currentItem) handleDecisionChange(currentItem.id, "");
      } else if (key === "n" || e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (key === "p" || e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (key === "e" || key === "/") {
        e.preventDefault();
        const textarea = document.querySelector<HTMLTextAreaElement>("#reviewer-notes");
        if (textarea) textarea.focus();
      } else if (key === "s") {
        e.preventDefault();
        setShowSummary((prev) => !prev);
      } else if (key === "x") {
        e.preventDefault();
        handleExportCsv();
      } else if (e.key === "?") {
        e.preventDefault();
        setShowShortcutsHelp((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentItem, handleDecisionChange, handleNext, handlePrev, handleExportCsv]);

  // Passage groupings & range detection
  const passageInfo = useMemo(() => {
    if (!currentItem?.question.stimulus) {
      return { passageIndex: 0, totalPassages: 0, range: "" };
    }

    const currentTitle = currentItem.question.stimulus.title || currentItem.question.stimulus.body;
    const passageKeys: string[] = [];
    items.forEach((item) => {
      if (item.question.stimulus) {
        const key = item.question.stimulus.title || item.question.stimulus.body;
        if (!passageKeys.includes(key)) passageKeys.push(key);
      }
    });

    const passageIndex = passageKeys.indexOf(currentTitle) + 1;
    const itemsInPassage = items.filter(
      (item) => (item.question.stimulus?.title || item.question.stimulus?.body) === currentTitle,
    );
    const range = `Questions ${itemsInPassage[0]?.index + 1}–${
      itemsInPassage[itemsInPassage.length - 1]?.index + 1
    } of this passage`;

    return {
      passageIndex,
      totalPassages: passageKeys.length,
      range,
    };
  }, [currentItem, items]);

  // Summary counts
  const approvedCount = items.filter((i) => i.decision === "approve").length;
  const rejectedCount = items.filter((i) => i.decision === "reject").length;
  const revisedCount = items.filter((i) => i.decision === "revise").length;
  const undecidedCount = items.filter((i) => !i.decision).length;

  const averageTimeSeconds = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const sec of Object.values(itemTimes)) {
      if (sec > 0) {
        total += sec;
        count++;
      }
    }
    if (currentItem && timeOnCurrentItemSeconds > 0) {
      total += timeOnCurrentItemSeconds;
      count++;
    }
    return count > 0 ? total / count : 0;
  }, [itemTimes, currentItem, timeOnCurrentItemSeconds]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}s`;
  };

  if (loading && items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[600px] w-full max-w-7xl items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-royal border-t-transparent" />
          <h2 className="text-lg font-bold text-ink">Loading Review Batch...</h2>
          <p className="text-xs text-muted">Reading governed review artifacts from disk</p>
        </div>
      </main>
    );
  }

  if (error && items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-4xl p-8">
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-6 text-rose-950">
          <h2 className="text-lg font-bold">Failed to load batch</h2>
          <p className="mt-2 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              setSelectedBatchId((prev) => `${prev}`);
            }}
            className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-xs"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-4 sm:p-6">
      {/* Top Navigation & Status Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-royal/15 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-royal px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
            REVIEW CONSOLE
          </span>

          {/* Batch Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="batch-select" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Batch:
            </label>
            <select
              id="batch-select"
              data-testid="batch-select"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-xs focus:border-royal focus:outline-hidden"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.itemCount} items)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress & Decision Counters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span
              data-testid="counter-approved"
              className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-800"
            >
              {approvedCount} Approved
            </span>
            <span
              data-testid="counter-rejected"
              className="rounded bg-rose-100 px-2 py-0.5 text-rose-800"
            >
              {rejectedCount} Rejected
            </span>
            <span
              data-testid="counter-revised"
              className="rounded bg-amber-100 px-2 py-0.5 text-amber-800"
            >
              {revisedCount} Revision
            </span>
            <span
              data-testid="counter-undecided"
              className="rounded bg-slate-100 px-2 py-0.5 text-slate-600"
            >
              {undecidedCount} Undecided
            </span>
          </div>

          <div className="h-5 w-px bg-slate-200" />

          {/* Total session timer display */}
          <span className="text-xs font-medium text-slate-500">
            Session: <strong className="text-ink">{formatSeconds(totalElapsedSeconds)}</strong>
          </span>

          <div className="h-5 w-px bg-slate-200" />

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="btn-toggle-summary"
              onClick={() => setShowSummary((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold shadow-xs transition-colors ${
                showSummary
                  ? "border-royal bg-royal text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>Summary</span>
              <kbd className="rounded bg-black/10 px-1 font-mono">S</kbd>
            </button>

            <button
              type="button"
              data-testid="btn-export-csv"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
            >
              <span>Export CSV</span>
              <kbd className="rounded bg-white/20 px-1 font-mono">X</kbd>
            </button>

            <button
              type="button"
              data-testid="btn-shortcuts-help"
              onClick={() => setShowShortcutsHelp(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50"
              title="Keyboard Shortcuts (?)"
            >
              ?
            </button>
          </div>
        </div>
      </header>

      {/* Main Review View / Summary View */}
      {showSummary && summary ? (
        <BatchSummaryView
          summary={summary}
          onClose={() => setShowSummary(false)}
        />
      ) : currentItem ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Left Pane: Pinned Passage Stimulus */}
          <div className="min-w-0">
            <PinnedStimulus
              stimulus={currentItem.question.stimulus}
              passageIndex={passageInfo.passageIndex}
              totalPassages={passageInfo.totalPassages}
              passageQuestionRange={passageInfo.range}
            />
          </div>

          {/* Right Pane: Current Question & Review Controls */}
          <div className="min-w-0">
            <QuestionViewer
              item={currentItem}
              totalItems={items.length}
              timeOnItemSeconds={timeOnCurrentItemSeconds}
              averageTimeSeconds={averageTimeSeconds}
              onDecisionChange={handleDecisionChange}
              onNotesChange={handleNotesChange}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted">No questions available in this batch.</div>
      )}

      {/* Export Feedback Modal */}
      {exportResult ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            data-testid="export-success-modal"
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl sm:p-7"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">CSV Successfully Exported</h3>
                <p className="text-xs text-muted">
                  Your review decisions were formatted into the governed CSV consumed by content:record-approvals.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-sand-light/30 p-4 text-xs">
              <div>
                <span className="font-semibold text-slate-600">Saved to disk: </span>
                <code className="font-mono text-slate-800">{exportResult.relativeFilePath ?? exportResult.fileName}</code>
              </div>

              <div>
                <span className="font-semibold text-slate-600">Review Summary: </span>
                <span className="font-medium text-slate-800">
                  {approvedCount} approved, {rejectedCount} rejected, {revisedCount} revised, {undecidedCount} undecided (blank)
                </span>
              </div>

              <div className="rounded-lg bg-amber-50 p-3 text-amber-900 border border-amber-200">
                <p className="font-bold">Next Step: Mandatory Human Gate</p>
                <p className="mt-1">
                  The console records nothing by itself. Run the governed command for your batch:
                </p>
                {exportResult.publishCommand ? (
                  <div className="mt-2">
                    <p className="text-[11px] font-semibold text-slate-700">For publishing staged candidates:</p>
                    <pre className="mt-1 overflow-x-auto rounded bg-black p-2 font-mono text-[11px] text-emerald-400">
                      {exportResult.publishCommand}
                    </pre>
                  </div>
                ) : null}
                <div className="mt-2">
                  <p className="text-[11px] font-semibold text-slate-700">For recording approvals on published items:</p>
                  <pre className="mt-1 overflow-x-auto rounded bg-black p-2 font-mono text-[11px] text-emerald-400">
                    {exportResult.recordCommand}
                  </pre>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                data-testid="btn-close-export-modal"
                onClick={() => setExportResult(null)}
                className="rounded-xl bg-royal px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-royal-dark"
              >
                Close &amp; Resume
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Shortcuts Guide Modal */}
      {showShortcutsHelp ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-ink">Keyboard Shortcuts</h3>
            <p className="mt-1 text-xs text-muted">Designed for rapid mouse-free review throughput (&lt;1 min/item):</p>

            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
              <dt><kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold">A</kbd></dt>
              <dd>Approve current item (sets 3 checks to yes)</dd>

              <dt><kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold">R</kbd></dt>
              <dd>Reject current item</dd>

              <dt><kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold">V</kbd></dt>
              <dd>Mark item as Needs Revision</dd>

              <dt><kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold">U</kbd></dt>
              <dd>Clear decision (undecided, exports as blank row)</dd>

              <dt><kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold">N / →</kbd></dt>
              <dd>Navigate to next item</dd>

              <dt><kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold">P / ←</kbd></dt>
              <dd>Navigate to previous item</dd>

              <dt><kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold">E / /</kbd></dt>
              <dd>Focus reviewer note field</dd>

              <dt><kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold">Esc</kbd></dt>
              <dd>Exit note field and return to hotkey navigation</dd>

              <dt><kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold">S</kbd></dt>
              <dd>Toggle one-page pre-review batch summary</dd>

              <dt><kbd className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold">X</kbd></dt>
              <dd>Export decisions to governed CSV</dd>
            </dl>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowShortcutsHelp(false)}
                className="rounded-xl bg-royal px-4 py-2 text-xs font-bold text-white"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
