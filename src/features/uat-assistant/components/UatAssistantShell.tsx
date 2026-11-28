"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Bug, ClipboardList, Power, X } from "lucide-react";

import {
  getOrCreateUatTestSession,
  listUatIssues,
  subscribeToUatStoreChanges,
} from "../storage/uat-idb";
import type {
  UatElementCapture,
  UatEnvironmentContext,
  UatTestSession,
} from "../types";
import {
  resolveWorkspaceContext,
  sanitizeUrlForReport,
  summarizeBrowserUserAgent,
} from "../utils/redaction";
import { DefectDashboard } from "./DefectDashboard";
import { ElementInspectorOverlay } from "./ElementInspectorOverlay";
import { ReportIssueModal } from "./ReportIssueModal";

export interface UatSessionConfig {
  readonly primaryRole: string;
  readonly entitledRoles: readonly string[];
  readonly aiConfigured: boolean;
  readonly githubConfigured: boolean;
  readonly githubRepo: string;
}

export function UatAssistantShell({
  config,
  onSessionEnded,
}: {
  config: UatSessionConfig;
  /** Called after the server has dropped the tester credential, so the host can unmount the assistant. */
  onSessionEnded?: () => void;
}) {
  const pathname = usePathname() || "/";
  const dashboardDialogRef = useRef<HTMLDialogElement>(null);
  const dashboardTitleId = useId();
  const endTitleId = useId();
  const endDescId = useId();

  const [dockSide, setDockSide] = useState<"right" | "left">("right");
  const [inspectorActive, setInspectorActive] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [pickedElement, setPickedElement] = useState<UatElementCapture | null>(null);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [endBusy, setEndBusy] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);

  const endSession = async () => {
    setEndBusy(true);
    setEndError(null);
    try {
      const res = await fetch("/api/uat/session", { method: "DELETE", credentials: "same-origin" });
      if (!res.ok) throw new Error(String(res.status));
      setEndConfirmOpen(false);
      setReportModalOpen(false);
      setDashboardModalOpen(false);
      setInspectorActive(false);
      setPickedElement(null);
      onSessionEnded?.();
    } catch {
      setEndError("Could not end the UAT session. Check your connection and try again.");
    } finally {
      setEndBusy(false);
    }
  };

  const [openCount, setOpenCount] = useState(0);
  const [testSession, setTestSession] = useState<UatTestSession>({
    id: "UAT-SESSION",
    label: "DEV Session",
    startedAt: new Date(0).toISOString(),
  });
  const [viewport, setViewport] = useState(() =>
    typeof window !== "undefined"
      ? {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: Math.round((window.devicePixelRatio || 1) * 100) / 100,
        }
      : { width: 1280, height: 800, devicePixelRatio: 1 },
  );
  const [browserSummary] = useState(() =>
    typeof navigator !== "undefined" ? summarizeBrowserUserAgent(navigator.userAgent) : "Browser",
  );

  useEffect(() => {
    let active = true;
    const syncSummary = () => {
      void Promise.all([listUatIssues(), getOrCreateUatTestSession()]).then(
        ([allIssues, session]) => {
          if (!active) return;
          setOpenCount(allIssues.filter((i) => i.status === "open" || i.status === "retest").length);
          setTestSession(session);
        },
      );
    };
    syncSummary();
    const unsubscribe = subscribeToUatStoreChanges(syncSummary);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: Math.round((window.devicePixelRatio || 1) * 100) / 100,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentUrl =
    typeof window !== "undefined" ? sanitizeUrlForReport(window.location.href) : pathname;

  useEffect(() => {
    const dialog = dashboardDialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = "";
      setDashboardModalOpen(false);
    };
    dialog.addEventListener("close", handleClose);

    if (dashboardModalOpen && !dialog.open) {
      dialog.showModal();
    } else if (!dashboardModalOpen && dialog.open) {
      dialog.close();
    }

    return () => dialog.removeEventListener("close", handleClose);
  }, [dashboardModalOpen]);

  const workspace = resolveWorkspaceContext(pathname, config.primaryRole, config.entitledRoles);
  const environmentContext: UatEnvironmentContext = {
    browser: browserSummary,
    viewport,
    timestamp: new Date().toISOString(),
    route: pathname,
    pageUrl: currentUrl,
    ...workspace,
    testSessionId: testSession.id,
    testSessionLabel: testSession.label,
    primaryRole: config.primaryRole,
    entitledRoles: [...config.entitledRoles],
  };

  return (
    <>
      {/* Compact floating launcher — safe-area aware and dockable left/right so it never blocks exam controls */}
      {!inspectorActive && (
        <aside
          aria-label="MindMosaic UAT Assistant"
          data-uat-assistant="true"
          data-testid="uat-floating-launcher"
          style={{
            bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
            ...(dockSide === "right"
              ? { right: "max(1rem, env(safe-area-inset-right, 0px))" }
              : { left: "max(1rem, env(safe-area-inset-left, 0px))" }),
          }}
          className="fixed z-[90] flex items-center gap-1 rounded-2xl border border-mm-line bg-mm-surface/95 p-1 font-[family-name:var(--font-geist)] shadow-[0_14px_34px_rgba(24,21,31,0.16)] backdrop-blur-sm print:hidden"
        >
          <button
            type="button"
            data-testid="uat-launcher-report-btn"
            onClick={() => {
              setReportModalOpen(true);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-mm-brand px-3.5 py-2 text-xs font-semibold tracking-[-0.01em] text-white transition hover:bg-mm-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
          >
            <Bug aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>Report Issue</span>
          </button>

          <button
            type="button"
            data-testid="uat-launcher-dashboard-btn"
            aria-label={`Open UAT defect dashboard (${openCount} open or retest)`}
            onClick={() => setDashboardModalOpen(true)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-mm-ink-soft tabular-nums transition hover:bg-mm-tint-soft hover:text-mm-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
          >
            <ClipboardList aria-hidden="true" className="h-4 w-4 shrink-0 text-mm-brand" />
            <span>{openCount}</span>
          </button>

          <button
            type="button"
            data-testid="uat-launcher-dock-btn"
            aria-label={dockSide === "right" ? "Move UAT control to bottom left" : "Move UAT control to bottom right"}
            onClick={() => setDockSide((prev) => (prev === "right" ? "left" : "right"))}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-mm-muted transition hover:bg-mm-tint-soft hover:text-mm-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
          >
            <ArrowLeftRight aria-hidden="true" className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            data-testid="uat-launcher-end-btn"
            aria-label="End UAT session"
            onClick={() => {
              setEndError(null);
              setEndConfirmOpen(true);
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-error transition hover:bg-mm-alert focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
          >
            <Power aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span>End</span>
          </button>
        </aside>
      )}

      {endConfirmOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={endTitleId}
          aria-describedby={endDescId}
          data-uat-assistant="true"
          data-testid="uat-end-confirm"
          className="fixed inset-x-3 bottom-[max(5rem,env(safe-area-inset-bottom,0px))] z-[95] mx-auto max-w-md rounded-2xl border border-mm-line bg-mm-surface p-5 font-[family-name:var(--font-geist)] text-mm-ink shadow-[0_24px_60px_rgba(24,21,31,0.24)] print:hidden"
        >
          <h2 id={endTitleId} className="text-base font-semibold tracking-[-0.02em]">
            End UAT session?
          </h2>
          <p id={endDescId} className="mt-1.5 text-sm leading-6 text-mm-muted">
            This turns the UAT Assistant off in this browser and removes its tester credential. Defects you already
            saved stay in this browser — export a backup from the dashboard first if you want a copy. You can start
            a new session from the UAT dashboard.
          </p>
          {endError && (
            <p role="alert" className="mt-2 text-xs font-semibold text-error">
              {endError}
            </p>
          )}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              data-testid="uat-end-cancel"
              onClick={() => setEndConfirmOpen(false)}
              className="inline-flex min-h-11 items-center rounded-xl border border-mm-line px-4 text-sm font-semibold text-mm-ink-soft transition hover:bg-mm-tint-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
            >
              Keep testing
            </button>
            <button
              type="button"
              data-testid="uat-end-confirm-btn"
              disabled={endBusy}
              onClick={() => void endSession()}
              className="inline-flex min-h-11 items-center rounded-xl bg-error px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
            >
              {endBusy ? "Ending…" : "End session"}
            </button>
          </div>
        </div>
      )}

      {/* Element Selection Overlay */}
      <ElementInspectorOverlay
        active={inspectorActive}
        onSelect={(capture) => {
          setPickedElement(capture);
          setInspectorActive(false);
          setReportModalOpen(true);
        }}
        onCancel={() => {
          setInspectorActive(false);
          setReportModalOpen(true);
        }}
      />

      {/* Report Issue Modal */}
      <ReportIssueModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onStartElementPick={() => {
          setReportModalOpen(false);
          setInspectorActive(true);
        }}
        pickedElement={pickedElement}
        onClearElement={() => setPickedElement(null)}
        environment={environmentContext}
        aiConfigured={config.aiConfigured}
        onSaved={() => {
          setPickedElement(null);
          setReportModalOpen(false);
          setDashboardModalOpen(true);
        }}
      />

      {/* Quick Defect Dashboard Modal */}
      <dialog
        ref={dashboardDialogRef}
        data-uat-assistant="true"
        data-testid="uat-dashboard-dialog"
        aria-labelledby={dashboardTitleId}
        className="m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-6xl overflow-y-auto rounded-2xl border border-mm-line bg-mm-page p-0 font-[family-name:var(--font-geist)] text-mm-ink shadow-[0_24px_60px_rgba(24,21,31,0.24)] backdrop:bg-mm-ink/45"
      >
        <div className="p-5 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-mm-line pb-4">
            <div>
              <h1
                id={dashboardTitleId}
                className="font-[family-name:var(--font-instrument-sans)] text-2xl font-semibold tracking-[-0.028em] text-mm-ink"
              >
                UAT defect dashboard
              </h1>
              <p className="mt-1 text-sm text-mm-muted">
                Triage local IndexedDB defects across Open, Fixed, Retest, and Closed states, or export reports.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDashboardModalOpen(false)}
              aria-label="Close defect dashboard"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-mm-muted transition hover:bg-mm-tint hover:text-mm-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          {dashboardModalOpen && (
            <DefectDashboard
              mode="modal"
              githubRepo={config.githubRepo}
              githubConfigured={config.githubConfigured}
              onNewIssue={() => {
                setDashboardModalOpen(false);
                setReportModalOpen(true);
              }}
            />
          )}
        </div>
      </dialog>
    </>
  );
}
