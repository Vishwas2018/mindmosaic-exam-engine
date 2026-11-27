"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  Bug,
  Check,
  CheckCircle2,
  CircleDot,
  Copy,
  Download,
  ExternalLink,
  FileJson,
  FileText,
  FolderUp,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

import {
  deleteUatIssue,
  getOrCreateUatTestSession,
  importUatIssues,
  listUatIssues,
  saveUatIssue,
  startNewUatTestSession,
  subscribeToUatStoreChanges,
} from "../storage/uat-idb";
import {
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  UAT_ISSUE_CATEGORIES,
  UAT_ISSUE_SEVERITIES,
  UAT_ISSUE_STATUSES,
  type UatGitHubLink,
  type UatIssue,
  type UatIssueCategory,
  type UatIssueSeverity,
  type UatIssueStatus,
  type UatTestSession,
} from "../types";
import {
  formatIssueMarkdown,
  formatIssuesReportMarkdown,
  parseImportBundle,
  serializeExportBundle,
} from "../utils/exporters";
import { GitHubConfirmModal } from "./GitHubConfirmModal";

const STATUS_BADGE_VARIANT: Record<UatIssueStatus, BadgeVariant> = {
  open: "error",
  retest: "warning",
  fixed: "success",
  closed: "neutral",
};

const SEVERITY_BADGE_VARIANT: Record<UatIssueSeverity, BadgeVariant> = {
  critical: "error",
  high: "warning",
  medium: "purple",
  low: "neutral",
};

function StatusIcon({ status }: { status: UatIssueStatus }) {
  if (status === "open") return <CircleDot aria-hidden="true" className="h-3.5 w-3.5" />;
  if (status === "retest") return <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />;
  if (status === "fixed") return <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />;
  return <Archive aria-hidden="true" className="h-3.5 w-3.5" />;
}

function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface DefectDashboardProps {
  mode: "modal" | "page";
  githubRepo: string;
  githubConfigured: boolean;
  onNewIssue?: () => void;
}

export function DefectDashboard({
  mode,
  githubRepo,
  githubConfigured,
  onNewIssue,
}: DefectDashboardProps) {
  const importInputId = useId();
  const baseControlId = useId();

  const [issues, setIssues] = useState<UatIssue[]>([]);
  const [session, setSession] = useState<UatTestSession | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | UatIssueStatus>("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | UatIssueSeverity>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | UatIssueCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSteps, setEditSteps] = useState("");
  const [editActual, setEditActual] = useState("");
  const [editExpected, setEditExpected] = useState("");
  const [editSeverity, setEditSeverity] = useState<UatIssueSeverity>("medium");
  const [editCategory, setEditCategory] = useState<UatIssueCategory>("functional");

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [githubConfirmIssue, setGithubConfirmIssue] = useState<UatIssue | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadFromStore = () => {
      void Promise.all([listUatIssues(), getOrCreateUatTestSession()]).then(
        ([loadedIssues, activeSession]) => {
          if (!active) return;
          setIssues(loadedIssues);
          setSession(activeSession);
        },
      );
    };
    loadFromStore();
    const unsubscribe = subscribeToUatStoreChanges(loadFromStore);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const counts = useMemo(() => {
    const map: Record<"all" | UatIssueStatus, number> = {
      all: issues.length,
      open: 0,
      fixed: 0,
      retest: 0,
      closed: 0,
    };
    for (const issue of issues) {
      map[issue.status] += 1;
    }
    return map;
  }, [issues]);

  const filteredIssues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return issues.filter((issue) => {
      if (statusFilter !== "all" && issue.status !== statusFilter) return false;
      if (severityFilter !== "all" && issue.severity !== severityFilter) return false;
      if (categoryFilter !== "all" && issue.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.originalNotes.toLowerCase().includes(q) ||
        issue.environment.route.toLowerCase().includes(q) ||
        issue.id.toLowerCase().includes(q) ||
        (issue.element?.locator.toLowerCase().includes(q) ?? false)
      );
    });
  }, [issues, statusFilter, severityFilter, categoryFilter, searchQuery]);

  const selectedIssue = useMemo(
    () => issues.find((item) => item.id === selectedId) ?? filteredIssues[0] ?? null,
    [issues, selectedId, filteredIssues],
  );

  const beginEdit = (issue: UatIssue) => {
    setIsEditingDetail(true);
    setEditTitle(issue.title);
    setEditDescription(issue.description);
    setEditSteps(issue.stepsToReproduce.join("\n"));
    setEditActual(issue.actualResult);
    setEditExpected(issue.expectedResult);
    setEditSeverity(issue.severity);
    setEditCategory(issue.category);
  };

  const handleSaveDetailEdits = async () => {
    if (!selectedIssue) return;
    const steps = editSteps
      .split(/\r?\n/)
      .map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim())
      .filter(Boolean);
    const updated: UatIssue = {
      ...selectedIssue,
      title: editTitle.trim() || selectedIssue.title,
      description: editDescription.trim() || selectedIssue.originalNotes,
      stepsToReproduce: steps.length > 0 ? steps : selectedIssue.stepsToReproduce,
      actualResult: editActual.trim() || selectedIssue.actualResult,
      expectedResult: editExpected.trim() || selectedIssue.expectedResult,
      severity: editSeverity,
      category: editCategory,
      updatedAt: new Date().toISOString(),
    };
    await saveUatIssue(updated);
    setIsEditingDetail(false);
    setBannerMessage({ tone: "success", text: `Saved edits to ${updated.id}.` });
  };

  const handleStatusChange = async (issue: UatIssue, nextStatus: UatIssueStatus) => {
    const updated: UatIssue = {
      ...issue,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };
    await saveUatIssue(updated);
    setBannerMessage({
      tone: "success",
      text: `Marked ${issue.id} as ${STATUS_LABELS[nextStatus]}.`,
    });
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setBannerMessage(null);
    try {
      const text = await file.text();
      const parsed = parseImportBundle(text);
      if (!parsed.ok) {
        setBannerMessage({ tone: "error", text: parsed.message });
        return;
      }
      const stats = await importUatIssues(parsed.bundle.issues);
      setBannerMessage({
        tone: "success",
        text: `Import complete: ${stats.added} added, ${stats.updated} updated (${stats.total} total defects).`,
      });
    } catch {
      setBannerMessage({
        tone: "error",
        text: "Could not read the selected JSON file. Your existing defects were not changed.",
      });
    }
  };

  const handleGitHubCreated = async (issueId: string, link: UatGitHubLink) => {
    const target = issues.find((item) => item.id === issueId);
    if (!target) return;
    await saveUatIssue({
      ...target,
      githubIssue: link,
      updatedAt: new Date().toISOString(),
    });
    setBannerMessage({
      tone: "success",
      text: `Created GitHub issue #${link.number} in ${link.repo}.`,
    });
  };

  const dateStamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5 font-[family-name:var(--font-geist)] text-mm-ink">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-mm-muted tabular-nums">
          <span>
            Active session:{" "}
            <strong className="font-semibold text-mm-ink">{session?.label ?? "Loading…"}</strong>
          </span>
          {session && (
            <button
              type="button"
              data-testid="uat-new-session-btn"
              onClick={() => {
                void startNewUatTestSession().then((next) => {
                  setSession(next);
                  setBannerMessage({
                    tone: "success",
                    text: `Started new test session ${next.id}. Existing defects remain saved.`,
                  });
                });
              }}
              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-mm-line bg-mm-surface px-2.5 py-1 text-xs font-semibold text-mm-brand transition hover:border-mm-brand/40 hover:bg-mm-tint-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
            >
              <RefreshCw aria-hidden="true" className="h-3 w-3" />
              <span>New session</span>
            </button>
          )}
          {mode === "modal" && (
            <Link
              href="/dev/uat"
              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-mm-line bg-mm-surface px-2.5 py-1 text-xs font-semibold text-mm-brand transition hover:border-mm-brand/40 hover:bg-mm-tint-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
            >
              <ExternalLink aria-hidden="true" className="h-3 w-3" />
              <span>Open full page (/dev/uat)</span>
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNewIssue && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              data-testid="uat-dashboard-new-issue"
              onClick={onNewIssue}
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              <span>Report issue</span>
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="uat-export-markdown"
            disabled={filteredIssues.length === 0}
            onClick={() => {
              const md = formatIssuesReportMarkdown(filteredIssues);
              downloadBlob(`mindmosaic-uat-report-${dateStamp}.md`, md, "text/markdown;charset=utf-8");
              setBannerMessage({
                tone: "success",
                text: `Exported ${filteredIssues.length} defect(s) to Markdown.`,
              });
            }}
          >
            <FileText aria-hidden="true" className="h-4 w-4" />
            <span>Export Markdown</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="uat-export-json"
            disabled={issues.length === 0}
            onClick={() => {
              const json = serializeExportBundle(issues, { includeScreenshots: true });
              downloadBlob(`mindmosaic-uat-issues-${dateStamp}.json`, json, "application/json;charset=utf-8");
              setBannerMessage({
                tone: "success",
                text: `Exported ${issues.length} defect(s) to JSON backup.`,
              });
            }}
          >
            <FileJson aria-hidden="true" className="h-4 w-4" />
            <span>Export JSON</span>
          </Button>

          <label
            htmlFor={importInputId}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-royal/15 bg-white px-4 py-2 text-sm font-bold text-royal shadow-[0_8px_20px_color-mix(in_srgb,var(--purple)_8%,transparent)] transition hover:border-royal/30 hover:bg-soft-purple focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-mm-brand"
          >
            <FolderUp aria-hidden="true" className="h-4 w-4" />
            <span>Import JSON</span>
            <input
              id={importInputId}
              data-testid="uat-import-json-input"
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                void handleImportFile(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {bannerMessage && (
        <div
          role={bannerMessage.tone === "error" ? "alert" : "status"}
          data-testid="uat-dashboard-banner"
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium ${
            bannerMessage.tone === "error"
              ? "border-error/25 bg-mm-alert text-error"
              : "border-mm-tint-line bg-mm-tint-soft text-mm-ink"
          }`}
        >
          <span className="flex items-center gap-2">
            {bannerMessage.tone === "error" ? (
              <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-success" />
            )}
            <span>{bannerMessage.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-xs font-semibold underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Status filter pills (Open, Fixed, Retest, Closed) */}
      <div
        role="group"
        aria-label="Filter defects by status"
        className="flex flex-wrap items-center gap-2"
      >
        {(["all", ...UAT_ISSUE_STATUSES] as const).map((statusKey) => {
          const active = statusFilter === statusKey;
          const label = statusKey === "all" ? "All defects" : STATUS_LABELS[statusKey];
          return (
            <button
              key={statusKey}
              type="button"
              data-testid={`uat-filter-status-${statusKey}`}
              aria-pressed={active}
              onClick={() => setStatusFilter(statusKey)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold tabular-nums transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand ${
                active
                  ? "border-mm-brand bg-mm-brand text-white"
                  : "border-mm-line bg-mm-surface text-mm-ink-soft hover:border-mm-brand/40 hover:bg-mm-tint-soft"
              }`}
            >
              {statusKey !== "all" && <StatusIcon status={statusKey} />}
              <span>{label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active ? "bg-white/20 text-white" : "bg-mm-page text-mm-muted"
                }`}
              >
                {counts[statusKey]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & secondary filters */}
      <search aria-label="Search and filter UAT defects">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            id={`${baseControlId}-search`}
            name="q"
            type="search"
            label="Search defects"
            placeholder="Title, notes, route, or locator…"
            value={searchQuery}
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            icon={<Search className="h-4 w-4" />}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            id={`${baseControlId}-severity`}
            name="severityFilter"
            label="Severity"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as "all" | UatIssueSeverity)}
          >
            <option value="all">All severities</option>
            {UAT_ISSUE_SEVERITIES.map((sev) => (
              <option key={sev} value={sev}>
                {SEVERITY_LABELS[sev]}
              </option>
            ))}
          </Select>
          <Select
            id={`${baseControlId}-category`}
            name="categoryFilter"
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as "all" | UatIssueCategory)}
          >
            <option value="all">All categories</option>
            {UAT_ISSUE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </Select>
        </div>
      </search>

      {/* Main content: Empty state or List + Detail view */}
      {filteredIssues.length === 0 ? (
        <EmptyState
          icon={<Bug className="h-6 w-6 text-mm-brand" />}
          title={issues.length === 0 ? "No UAT defects recorded yet" : "No defects match your filters"}
          description={
            issues.length === 0
              ? "Select Report issue on any DEV screen to highlight an element, dictate or type your observation, and save it locally."
              : "Clear one of the active status, severity, or search filters to view all saved defects."
          }
          action={
            issues.length === 0 && onNewIssue ? (
              <Button type="button" variant="primary" size="sm" onClick={onNewIssue}>
                Report first issue
              </Button>
            ) : issues.length > 0 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setSeverityFilter("all");
                  setCategoryFilter("all");
                  setSearchQuery("");
                }}
              >
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Responsive defect table / list */}
          <div className="@container lg:col-span-6">
            <div
              tabIndex={0}
              role="region"
              aria-label="Recorded UAT defects"
              className="max-h-[540px] overflow-auto rounded-2xl border border-mm-line bg-mm-surface"
            >
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">
                  Recorded UAT defects ({filteredIssues.length} matching items)
                </caption>
                <thead className="sticky top-0 z-10 hidden border-b border-mm-line bg-mm-tint-soft text-xs font-semibold text-mm-ink-soft @min-[520px]:table-header-group">
                  <tr>
                    <th scope="col" className="px-3.5 py-2.5">
                      Defect
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Severity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mm-line-soft">
                  {filteredIssues.map((issue) => {
                    const isSelected = selectedIssue?.id === issue.id;
                    return (
                      <tr
                        key={issue.id}
                        data-testid={`uat-issue-row-${issue.id}`}
                        className={`block transition @min-[520px]:table-row ${
                          isSelected ? "bg-mm-tint/60" : "hover:bg-mm-page"
                        }`}
                      >
                        <th scope="row" className="block px-3.5 py-3 font-normal @min-[520px]:table-cell">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(issue.id);
                              setIsEditingDetail(false);
                            }}
                            className="w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
                          >
                            <span className="block font-semibold text-mm-ink">{issue.title}</span>
                            <span className="mt-0.5 block font-mono text-xs text-mm-muted tabular-nums">
                              {issue.id} · {issue.environment.route}
                            </span>
                          </button>
                          {/* Stacked mobile badges */}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 @min-[520px]:hidden">
                            <Badge variant={STATUS_BADGE_VARIANT[issue.status]}>
                              <StatusIcon status={issue.status} />
                              <span>{STATUS_LABELS[issue.status]}</span>
                            </Badge>
                            <Badge variant={SEVERITY_BADGE_VARIANT[issue.severity]}>
                              {SEVERITY_LABELS[issue.severity]}
                            </Badge>
                          </div>
                        </th>
                        <td className="hidden px-3 py-3 align-middle @min-[520px]:table-cell">
                          <Badge variant={STATUS_BADGE_VARIANT[issue.status]}>
                            <StatusIcon status={issue.status} />
                            <span>{STATUS_LABELS[issue.status]}</span>
                          </Badge>
                        </td>
                        <td className="hidden px-3 py-3 align-middle @min-[520px]:table-cell">
                          <Badge variant={SEVERITY_BADGE_VARIANT[issue.severity]}>
                            {SEVERITY_LABELS[issue.severity]}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail & Status Management Panel */}
          {selectedIssue && (
            <div
              data-testid="uat-issue-detail"
              className="rounded-2xl border border-mm-line bg-mm-surface p-5 lg:col-span-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-mm-line pb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_BADGE_VARIANT[selectedIssue.status]}>
                      <StatusIcon status={selectedIssue.status} />
                      <span>{STATUS_LABELS[selectedIssue.status]}</span>
                    </Badge>
                    <Badge variant={SEVERITY_BADGE_VARIANT[selectedIssue.severity]}>
                      {SEVERITY_LABELS[selectedIssue.severity]}
                    </Badge>
                    <Badge variant="neutral">{CATEGORY_LABELS[selectedIssue.category]}</Badge>
                  </div>
                  <h2 className="mt-2 font-[family-name:var(--font-instrument-sans)] text-lg font-semibold tracking-[-0.02em] text-mm-ink">
                    {selectedIssue.title}
                  </h2>
                  <p className="mt-0.5 font-mono text-xs text-mm-muted tabular-nums">
                    {selectedIssue.id} · {selectedIssue.environment.portal} · {selectedIssue.environment.route}
                  </p>
                </div>

                <Select
                  id={`${baseControlId}-status-${selectedIssue.id}`}
                  aria-label="Update defect status"
                  data-testid="uat-detail-status-select"
                  value={selectedIssue.status}
                  onChange={(e) => void handleStatusChange(selectedIssue, e.target.value as UatIssueStatus)}
                  className="w-40"
                  selectClassName="min-h-11 py-2 text-sm font-semibold"
                >
                  {UAT_ISSUE_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      Status: {STATUS_LABELS[st]}
                    </option>
                  ))}
                </Select>
              </div>

              {isEditingDetail ? (
                <div className="mt-4 space-y-3">
                  <Input
                    label="Defect title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Select
                      label="Severity"
                      value={editSeverity}
                      onChange={(e) => setEditSeverity(e.target.value as UatIssueSeverity)}
                    >
                      {UAT_ISSUE_SEVERITIES.map((s) => (
                        <option key={s} value={s}>
                          {SEVERITY_LABELS[s]}
                        </option>
                      ))}
                    </Select>
                    <Select
                      label="Category"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as UatIssueCategory)}
                    >
                      {UAT_ISSUE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Textarea
                    label="Description"
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                  <Textarea
                    label="Steps to reproduce (one per line)"
                    rows={3}
                    value={editSteps}
                    onChange={(e) => setEditSteps(e.target.value)}
                  />
                  <Textarea
                    label="Actual result"
                    rows={2}
                    value={editActual}
                    onChange={(e) => setEditActual(e.target.value)}
                  />
                  <Textarea
                    label="Expected result"
                    rows={2}
                    value={editExpected}
                    onChange={(e) => setEditExpected(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditingDetail(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      data-testid="uat-detail-save-edits"
                      onClick={() => void handleSaveDetailEdits()}
                    >
                      Save changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4 text-sm">
                  {/* Verbatim original notes */}
                  <div className="rounded-xl border border-mm-tint-line bg-mm-tint-soft p-3.5">
                    <p className="text-xs font-bold text-mm-brand">
                      Original tester notes (preserved · {selectedIssue.inputMethod})
                    </p>
                    <p
                      data-testid="uat-detail-original-notes"
                      className="mt-1 whitespace-pre-wrap text-mm-ink"
                    >
                      {selectedIssue.originalNotes}
                    </p>
                  </div>

                  {selectedIssue.element && (
                    <div className="rounded-xl border border-mm-line bg-mm-page p-3 text-xs">
                      <p className="font-semibold text-mm-ink-soft">Selected element</p>
                      <code className="mt-1 block font-mono text-mm-ink break-all">
                        {selectedIssue.element.locator}
                      </code>
                      <p className="mt-1 text-mm-muted">{selectedIssue.element.visibleSnippet}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-mm-muted">Description</h3>
                    <p className="mt-1 whitespace-pre-wrap text-mm-ink">{selectedIssue.description}</p>
                  </div>

                  {selectedIssue.stepsToReproduce.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-mm-muted">Steps to reproduce</h3>
                      <ol className="mt-1 list-inside list-decimal space-y-1 text-mm-ink">
                        {selectedIssue.stepsToReproduce.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-mm-line p-3">
                      <h3 className="text-xs font-bold text-mm-muted">Actual result</h3>
                      <p className="mt-1 text-xs leading-5 text-mm-ink">{selectedIssue.actualResult}</p>
                    </div>
                    <div className="rounded-xl border border-mm-line p-3">
                      <h3 className="text-xs font-bold text-mm-muted">Expected result</h3>
                      <p className="mt-1 text-xs leading-5 text-mm-ink">{selectedIssue.expectedResult}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-mm-line bg-mm-page px-3 py-2 text-xs text-mm-muted tabular-nums">
                    {selectedIssue.environment.browser} · {selectedIssue.environment.viewport.width}×
                    {selectedIssue.environment.viewport.height} · Session {selectedIssue.environment.testSessionId} ·{" "}
                    {new Date(selectedIssue.createdAt).toLocaleString("en-AU")}
                  </div>

                  {selectedIssue.screenshot && (
                    <div>
                      <h3 className="text-xs font-bold text-mm-muted">Annotated screenshot</h3>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedIssue.screenshot.annotatedDataUrl}
                        alt={`Annotated UAT screenshot for ${selectedIssue.title}`}
                        className="mt-1.5 max-h-56 w-full rounded-xl border border-mm-line bg-mm-page object-contain"
                      />
                    </div>
                  )}

                  {selectedIssue.githubIssue && (
                    <div className="rounded-xl border border-mm-tint-line bg-mm-tint-soft px-3.5 py-2.5 text-xs">
                      <span className="font-semibold text-mm-ink">Linked GitHub issue: </span>
                      <a
                        href={selectedIssue.githubIssue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-mm-brand underline underline-offset-2"
                      >
                        {selectedIssue.githubIssue.repo}#{selectedIssue.githubIssue.number}
                      </a>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-mm-line pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        data-testid="uat-detail-edit-btn"
                        onClick={() => beginEdit(selectedIssue)}
                      >
                        Edit fields
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        data-testid="uat-detail-copy-md"
                        onClick={() => {
                          void navigator.clipboard
                            ?.writeText(formatIssueMarkdown(selectedIssue))
                            .then(() => {
                              setCopiedId(selectedIssue.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            });
                        }}
                      >
                        {copiedId === selectedIssue.id ? (
                          <Check aria-hidden="true" className="h-4 w-4" />
                        ) : (
                          <Copy aria-hidden="true" className="h-4 w-4" />
                        )}
                        <span>{copiedId === selectedIssue.id ? "Copied" : "Copy Markdown"}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        data-testid="uat-detail-download-md"
                        onClick={() => {
                          downloadBlob(
                            `${selectedIssue.id.toLowerCase()}.md`,
                            formatIssueMarkdown(selectedIssue),
                            "text/markdown;charset=utf-8",
                          );
                        }}
                      >
                        <Download aria-hidden="true" className="h-4 w-4" />
                        <span>.md</span>
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        data-testid="uat-open-github-confirm"
                        onClick={() => setGithubConfirmIssue(selectedIssue)}
                      >
                        <ExternalLink aria-hidden="true" className="h-4 w-4" />
                        <span>Create GitHub issue…</span>
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      data-testid="uat-detail-delete-btn"
                      onClick={() => setPendingDeleteId(selectedIssue.id)}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete local UAT defect?"
        description="This removes the defect and any attached screenshot from your browser's IndexedDB storage. Export a JSON backup first if you want to keep a copy."
        confirmLabel="Delete defect"
        cancelLabel="Keep defect"
        variant="danger"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (!pendingDeleteId) return;
          const targetId = pendingDeleteId;
          setPendingDeleteId(null);
          void deleteUatIssue(targetId).then(() => {
            if (selectedId === targetId) setSelectedId(null);
            setBannerMessage({ tone: "success", text: `Deleted defect ${targetId}.` });
          });
        }}
      />

      <GitHubConfirmModal
        open={githubConfirmIssue !== null}
        issue={githubConfirmIssue}
        githubRepo={githubRepo}
        githubConfigured={githubConfigured}
        onClose={() => setGithubConfirmIssue(null)}
        onCreated={(id, link) => void handleGitHubCreated(id, link)}
      />
    </div>
  );
}
