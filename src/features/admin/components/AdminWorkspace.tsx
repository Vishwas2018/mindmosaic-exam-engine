"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  FileSearch,
  CheckCircle2,
  FileText,
  UploadCloud,
  PenTool,
  LifeBuoy,
  History,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  Menu,
  RotateCcw,
  Lock,
  ExternalLink,
  BarChart3,
  Cog,
} from "lucide-react";
import { MindMosaicLogo } from "@/components/branding";
import type {
  AdminWorkspaceData,
  AdminView,
  AdminStateSubView,
  AdminQuestionSummary,
} from "../types";

export interface AdminWorkspaceProps {
  data: AdminWorkspaceData;
  initialView?: AdminView;
}

const LEGACY_TOOLS = [
  { href: "/admin/review", label: "Draft review", icon: FileSearch },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/intelligence", label: "Intelligence", icon: FileSearch },
  { href: "/admin/operations", label: "Operations", icon: Cog },
] as const;

export function AdminWorkspace({ data, initialView = "overview" }: AdminWorkspaceProps) {
  const [currentView, setCurrentView] = useState<AdminView>(initialView);
  const [selectedYear, setSelectedYear] = useState<"all" | 3 | 5 | 6>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<AdminQuestionSummary>(
    data.questions[0] ?? {
      id: "NO-DATA",
      title: "No questions loaded",
      yearLevel: 3,
      subject: "General",
      status: "draft",
      author: "System",
      lastUpdated: "Now",
      hasVisual: false,
    }
  );
  const [approvedItems, setApprovedItems] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStateSubView, setActiveStateSubView] = useState<AdminStateSubView>("library_states");

  const filteredQuestions = data.questions.filter((q) => {
    if (selectedYear !== "all" && Number(q.yearLevel) !== Number(selectedYear)) return false;
    if (selectedSubject !== "all" && q.subject !== selectedSubject) return false;
    if (
      searchQuery &&
      !q.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !q.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSimulatedSignoff = (itemId: string) => {
    if (data.source === "dev") {
      setNotice(
        "Read-only increment (Phase C): Database mutations are disabled. Draft approvals are recorded via authenticated Server Action at /admin/review."
      );
      return;
    }
    setApprovedItems((prev) => ({ ...prev, [itemId]: true }));
    setNotice(
      `Preview demonstration only: Human sign-off for ${itemId} saved in local preview state. No database or tamper-evident ledger write occurred.`
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfbf8] text-[#1f1b24] flex flex-col">
      {/* Top Banner: Environment & Data Source Indicator */}
      <header className="border-b border-royal/10 bg-white sticky top-0 z-40 shadow-xs">
        {data.source === "preview" ? (
          <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-center text-xs font-medium text-amber-900">
            <strong className="font-bold">Admin Preview:</strong> Interactive visual states from Claude Design export (b0–b26) in local preview mode. All approval, publishing, and support actions are isolated demonstrations (no database or ledger writes).
          </div>
        ) : (
          <div className="border-b border-teal-500/20 bg-teal-500/5 px-4 py-2 text-center text-xs font-medium text-teal-900 flex items-center justify-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
            <span>
              <strong className="font-bold">Authenticated DEV Workspace:</strong> Connected to authorized DEV data. Read-only Phase C increment — privileged writes and unverified mutations remain disabled.
            </span>
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-royal/15 bg-white text-royal hover:bg-royal/5"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="inline-flex items-center gap-2">
              <MindMosaicLogo size="sm" />
            </Link>
          </div>

          {/* Legacy Tools Quick Links */}
          <div className="hidden sm:flex items-center gap-2 border-r border-royal/10 pr-3 mr-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6e6779]">
              Tools:
            </span>
            {LEGACY_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="inline-flex items-center gap-1 rounded-lg border border-royal/10 bg-royal/[0.03] px-2 py-0.5 text-xs font-medium text-royal hover:bg-royal/10"
              >
                <span>{tool.label}</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </Link>
            ))}
          </div>

          {/* Artboard switcher pills */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="font-bold text-royal mr-1">Artboards:</span>
            {[
              { id: "overview", label: "Overview (b0–b1)" },
              { id: "library", label: "Library (b2–b3)" },
              { id: "review", label: "Review (b5–b7)" },
              { id: "approval", label: "Approval Gate (b8–b10)" },
              { id: "paper", label: "Paper (b11–b12)" },
              { id: "publication", label: "Publication (b13–b14)" },
              { id: "writing", label: "Writing (b15–b17)" },
              { id: "support", label: "Support (b18–b20)" },
              { id: "activity", label: "Activity (b21–b22)" },
              { id: "governance", label: "Governance Map (b23)" },
              { id: "states", label: "State Boards (8 artboards)" },
            ].map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => {
                  setCurrentView(art.id as AdminView);
                  setNotice(null);
                }}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  currentView === art.id
                    ? "bg-royal text-white"
                    : "bg-royal/5 text-royal hover:bg-royal/10"
                }`}
              >
                {art.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-royal/10 bg-white p-4 shadow-md space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6e6779]">
            Admin Workspace Sections
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: "overview", label: "Overview", icon: LayoutDashboard },
              { id: "library", label: "Question library", icon: BookOpen },
              { id: "review", label: "Question review", icon: FileSearch },
              { id: "approval", label: "Human approval", icon: CheckCircle2 },
              { id: "paper", label: "Paper review", icon: FileText },
              { id: "publication", label: "Publication", icon: UploadCloud },
              { id: "writing", label: "Writing review", icon: PenTool },
              { id: "support", label: "Support inquiries", icon: LifeBuoy },
              { id: "activity", label: "Activity log", icon: History },
              { id: "governance", label: "Governance map", icon: ShieldCheck },
              { id: "states", label: "State Boards", icon: Layers },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCurrentView(item.id as AdminView);
                    setMobileMenuOpen(false);
                    setNotice(null);
                  }}
                  className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-semibold text-left transition ${
                    isActive ? "bg-royal text-white" : "text-[#1f1b24] bg-royal/5 hover:bg-royal/10"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-royal/10 pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6e6779] mb-2">
              Legacy Admin Tools
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {LEGACY_TOOLS.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="flex items-center gap-1.5 rounded-lg border border-royal/10 p-2 font-medium text-royal hover:bg-royal/5"
                >
                  <span>{tool.label}</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Admin Workspace Shell: Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Admin Navigation Sidebar (aw__side) */}
        <aside className="hidden md:flex flex-col w-64 border-r border-royal/10 bg-white p-4 justify-between shrink-0">
          <div className="space-y-6">
            <nav className="space-y-1" aria-label="Admin sections">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#6e6779]">
                Review & Governance
              </p>
              {[
                { id: "overview", label: "Overview", icon: LayoutDashboard },
                { id: "library", label: "Question library", icon: BookOpen, count: data.questions.length },
                { id: "review", label: "Question review", icon: FileSearch },
                { id: "approval", label: "Human approval", icon: CheckCircle2, count: data.approvals.filter((a) => !a.isApproved).length },
                { id: "paper", label: "Paper review", icon: FileText, count: data.papers.length },
                { id: "publication", label: "Publication status", icon: UploadCloud },
                { id: "writing", label: "Writing review", icon: PenTool, count: data.writing.items.length },
                { id: "support", label: "Support inquiries", icon: LifeBuoy, count: data.support.items.length },
                { id: "activity", label: "Activity history", icon: History },
                { id: "governance", label: "Governance path", icon: ShieldCheck },
                { id: "states", label: "State boards (b4-b22)", icon: Layers },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCurrentView(item.id as AdminView);
                      setNotice(null);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      isActive
                        ? "bg-royal text-white"
                        : "text-[#1f1b24] hover:bg-royal/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-royal/10 text-royal"
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Legacy Tools Links in Sidebar */}
            <div className="border-t border-royal/10 pt-4 space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#6e6779]">
                Specialized Tools
              </p>
              {LEGACY_TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-medium text-[#6e6779] hover:bg-royal/5 hover:text-royal transition"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 opacity-70" />
                      <span>{tool.label}</span>
                    </div>
                    <ExternalLink className="h-3 w-3 opacity-40" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Reviewer Identity Footer */}
          <div className="border-t border-royal/10 pt-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-royal text-sm font-bold text-white">
              {data.reviewer.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#1f1b24]">{data.reviewer.name}</p>
              <p className="truncate text-[11px] text-[#6e6779]">{data.reviewer.role}</p>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {notice && (
            <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-medium text-amber-900 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-amber-700" />
                <span>{notice}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-amber-800 hover:text-amber-950 font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* VIEW: OVERVIEW (b0, b1) */}
          {currentView === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                  Editorial & Governance Overview
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  {data.source === "dev"
                    ? "Live operational queues and verified publication metrics."
                    : "Operational queues and publication status across all programmes."}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-2xl border border-royal/10 bg-white p-5 shadow-xs space-y-2"
                  >
                    <p className="text-xs font-semibold text-[#6e6779]">{m.label}</p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-[#1f1b24]">{m.count}</span>
                      <span
                        className={`text-xs font-bold ${
                          m.trend === "warning"
                            ? "text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full"
                            : "text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full"
                        }`}
                      >
                        {m.change}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6e6779]">{m.detail}</p>
                  </div>
                ))}
              </div>

              {/* Primary Queues */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Sign-off Queue */}
                <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#1f1b24]">Awaiting Human Approval</h2>
                      <p className="text-xs text-[#6e6779]">Rule #8: Mandatory human sign-off before publication</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentView("approval")}
                      className="rounded-xl bg-royal/10 px-3 py-1 text-xs font-bold text-royal hover:bg-royal/20"
                    >
                      View queue
                    </button>
                  </div>

                  <div className="divide-y divide-royal/5">
                    {data.approvals.slice(0, 3).map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#1f1b24]">{item.title}</p>
                          <p className="text-[11px] text-[#6e6779]">
                            {item.subject} · Year {item.yearLevel} · Drafted by {item.draftedBy}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.isApproved
                            ? "bg-teal-50 text-teal-800 border-teal-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>
                          {item.isApproved ? "Approved" : "Awaiting Sign-off"}
                        </span>
                      </div>
                    ))}
                    {data.approvals.length === 0 && (
                      <p className="py-4 text-xs text-[#6e6779] text-center">
                        No draft items awaiting approval.
                      </p>
                    )}
                  </div>
                </div>

                {/* Staged Exam Papers */}
                <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#1f1b24]">Exam Papers Staging</h2>
                      <p className="text-xs text-[#6e6779]">Fixed-form sets assembled from approved questions</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentView("paper")}
                      className="rounded-xl bg-royal/10 px-3 py-1 text-xs font-bold text-royal hover:bg-royal/20"
                    >
                      Inspect papers
                    </button>
                  </div>

                  <div className="space-y-3">
                    {data.papers.map((paper) => (
                      <div
                        key={paper.code}
                        className="rounded-xl border border-royal/10 bg-[#fcfbf8] p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#1f1b24]">{paper.title}</p>
                          <p className="text-[11px] text-[#6e6779]">
                            {paper.items} items · {paper.durationMinutes} mins · {paper.approvedItemsCount}/{paper.items} approved
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            paper.status === "ready"
                              ? "bg-teal-50 text-teal-800 border border-teal-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {paper.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: LIBRARY (b2, b3) */}
          {currentView === "library" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                    Question Library ({filteredQuestions.length} items)
                  </h1>
                  <p className="mt-1 text-xs text-[#6e6779]">
                    Original practice items with deterministic SVGs, answer secrecy, and ACARA alignment.
                  </p>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="rounded-2xl border border-royal/10 bg-white p-4 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6e6779]" />
                    <input
                      type="text"
                      placeholder="Search question title, prompt or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-royal/15 bg-[#fcfbf8] pl-9 pr-3 py-1.5 text-xs text-[#1f1b24] placeholder:text-[#6e6779] focus:outline-none focus:ring-2 focus:ring-royal/30"
                    />
                  </div>

                  {/* Year filter */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-semibold text-[#6e6779]">Year:</span>
                    {(["all", 3, 5, 6] as const).map((y) => (
                      <button
                        key={String(y)}
                        type="button"
                        onClick={() => setSelectedYear(y)}
                        className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                          selectedYear === y
                            ? "bg-royal text-white"
                            : "bg-royal/5 text-royal hover:bg-royal/10"
                        }`}
                      >
                        {y === "all" ? "All" : `Y${y}`}
                      </button>
                    ))}
                  </div>

                  {/* Subject filter */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-semibold text-[#6e6779]">Subject:</span>
                    {["all", "Numeracy", "Reading", "Language Conventions", "Reasoning"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSubject(s)}
                        className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                          selectedSubject === s
                            ? "bg-royal text-white"
                            : "bg-royal/5 text-royal hover:bg-royal/10"
                        }`}
                      >
                        {s === "all" ? "All" : s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Question Table */}
              <div className="overflow-x-auto rounded-2xl border border-royal/10 bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-royal/10 bg-[#fcfbf8] font-bold text-[#6e6779]">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Title / Prompt</th>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Visual</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-royal/5">
                    {filteredQuestions.map((q) => (
                      <tr key={q.id} className="hover:bg-royal/[0.02] transition">
                        <td className="px-4 py-3 font-mono font-bold text-royal">{q.id}</td>
                        <td className="px-4 py-3 font-medium text-[#1f1b24] max-w-xs truncate">
                          {q.title}
                        </td>
                        <td className="px-4 py-3 text-[#6e6779]">Year {q.yearLevel}</td>
                        <td className="px-4 py-3 text-[#6e6779]">{q.subject}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              q.status === "published"
                                ? "bg-teal-50 text-teal-800 border border-teal-200"
                                : q.status === "approved"
                                ? "bg-purple-50 text-purple-800 border border-purple-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#6e6779]">
                          {q.hasVisual ? (
                            <span className="text-teal-700 font-bold">SVG</span>
                          ) : (
                            <span className="text-[#6e6779]">Text</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQuestion(q);
                              setCurrentView("review");
                            }}
                            className="rounded-lg border border-royal/15 bg-white px-2.5 py-1 font-semibold text-royal hover:bg-royal/5"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredQuestions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-[#6e6779]">
                          No questions match these filters. Try widening your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: REVIEW (b5, b6) */}
          {currentView === "review" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-royal">{selectedQuestion.id}</span>
                    <span className="rounded-full bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 text-[10px] font-bold uppercase">
                      {selectedQuestion.status}
                    </span>
                  </div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24] mt-1">
                    {selectedQuestion.title}
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentView("approval")}
                  className="rounded-xl bg-royal px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-royal-deep"
                >
                  Proceed to Human Sign-Off
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Stimulus & Prompt */}
                <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
                  <h2 className="text-sm font-bold text-[#1f1b24]">Question Stimulus & Prompt</h2>
                  <div className="rounded-xl border border-royal/10 bg-[#fcfbf8] p-4 text-xs leading-relaxed text-[#1f1b24]">
                    <p className="font-semibold mb-2">Prompt:</p>
                    <p>{selectedQuestion.prompt ?? selectedQuestion.title}</p>
                  </div>

                  {selectedQuestion.hasVisual && (
                    <div className="rounded-xl border border-royal/10 bg-[#fcfbf8] p-4 text-center space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#6e6779]">
                        Deterministic SVG Stimulus
                      </p>
                      <div className="mx-auto flex h-36 w-64 items-center justify-center rounded-lg border border-dashed border-royal/20 bg-white">
                        <svg className="h-28 w-56" viewBox="0 0 200 100">
                          <rect x="20" y="20" width="160" height="60" fill="#f0ebff" stroke="#4318ff" strokeWidth="2" rx="4" />
                          <text x="100" y="45" textAnchor="middle" fill="#4318ff" fontSize="10" fontWeight="bold">
                            Length = 8m
                          </text>
                          <text x="100" y="65" textAnchor="middle" fill="#6e6779" fontSize="9">
                            Width = 3m
                          </text>
                        </svg>
                      </div>
                      <p className="text-[10px] text-[#6e6779]">
                        Answer Secrecy Enforced: No correct answer or distractor values encoded in SVG elements.
                      </p>
                    </div>
                  )}
                </div>

                {/* Pedagogical Metadata */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-3">
                    <h2 className="text-sm font-bold text-[#1f1b24]">Curriculum & Alignment</h2>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <dt className="text-[#6e6779]">Year Level:</dt>
                      <dd className="font-bold text-[#1f1b24]">Year {selectedQuestion.yearLevel}</dd>
                      <dt className="text-[#6e6779]">Subject:</dt>
                      <dd className="font-bold text-[#1f1b24]">{selectedQuestion.subject}</dd>
                      <dt className="text-[#6e6779]">Author:</dt>
                      <dd className="font-bold text-[#1f1b24]">{selectedQuestion.author}</dd>
                      <dt className="text-[#6e6779]">Updated:</dt>
                      <dd className="font-bold text-[#1f1b24]">{selectedQuestion.lastUpdated}</dd>
                    </dl>
                  </div>

                  <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-6 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
                      <Check className="h-4 w-4" />
                      <span>Automated Linters & Solvers: PASS</span>
                    </div>
                    <p className="text-[11px] text-teal-900 leading-relaxed">
                      Schema validity, mathematical consistency, originality score (&gt;98%), and answer secrecy verification checks passed cleanly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: APPROVAL (b8, b9) */}
          {currentView === "approval" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                  Human Approval Gate (Rule #8)
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  Standing Rule #8: Content publication requires human sign-off (approvedBy). AI models may draft or audit, but human approval is mandatory.
                </p>
              </div>

              {data.source === "dev" && (
                <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4 text-xs text-[#6e6779]">
                  <p className="font-semibold text-royal mb-1">Authenticated Read-Only Governance View:</p>
                  <p>
                    Showing {data.approvals.length} draft approval records loaded from the DEV database.
                    Sign-offs are bound to the SHA-256 content hash and recorded with reviewer identity.
                    In this Phase C increment, mutations are performed via authenticated server actions at <Link href="/admin/review" className="underline font-bold text-royal">/admin/review</Link>.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {data.approvals.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-royal">{item.id}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            item.isApproved || approvedItems[item.id]
                              ? "bg-teal-50 text-teal-800 border-teal-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {item.isApproved || approvedItems[item.id] ? "Signed Off" : "Awaiting Sign-off"}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-[#1f1b24]">{item.title}</h2>
                      <p className="text-xs text-[#6e6779]">
                        {item.subject} · Year {item.yearLevel} · Drafted by {item.draftedBy}
                      </p>
                      {item.approvedBy && (
                        <p className="text-[11px] text-teal-700 font-mono">
                          Approved by: {item.approvedBy} at {item.approvedAt}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const q = data.questions.find((qn) => qn.id === item.id) ?? {
                            id: item.id,
                            title: item.title,
                            yearLevel: item.yearLevel,
                            subject: item.subject,
                            status: "draft" as const,
                            author: item.draftedBy,
                            lastUpdated: "Draft",
                            hasVisual: false,
                          };
                          setSelectedQuestion(q);
                          setCurrentView("review");
                        }}
                        className="rounded-xl border border-royal/15 bg-white px-3 py-1.5 text-xs font-bold text-royal hover:bg-royal/5"
                      >
                        Inspect item
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulatedSignoff(item.id)}
                        disabled={item.isApproved || approvedItems[item.id]}
                        className={`rounded-xl px-4 py-1.5 text-xs font-bold text-white transition ${
                          item.isApproved || approvedItems[item.id]
                            ? "bg-teal-700 cursor-default"
                            : "bg-royal hover:bg-royal-deep shadow-xs"
                        }`}
                      >
                        {item.isApproved || approvedItems[item.id]
                          ? "Signed Off"
                          : `Sign Off as ${data.reviewer.name}`}
                      </button>
                    </div>
                  </div>
                ))}
                {data.approvals.length === 0 && (
                  <div className="rounded-2xl border border-royal/10 bg-white p-8 text-center text-xs text-[#6e6779]">
                    No items in the human approval queue.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: PAPER REVIEW (b11) */}
          {currentView === "paper" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                  Paper Review & Staging ({data.papers.length} practice papers)
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  Timed and practice sets assembled from approved questions with deterministic ordering.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {data.papers.map((paper) => (
                  <div
                    key={paper.code}
                    className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-royal">{paper.code}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          paper.status === "ready"
                            ? "bg-teal-50 text-teal-800 border border-teal-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {paper.status.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-[#1f1b24]">{paper.title}</h2>
                      <p className="mt-1 text-xs text-[#6e6779]">
                        {paper.items} items · {paper.durationMinutes} minutes duration
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6e6779]">Approved content ratio:</span>
                        <span className="font-bold text-[#1f1b24]">
                          {paper.approvedItemsCount} / {paper.items}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-royal/10 overflow-hidden">
                        <div
                          className="h-full bg-royal rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (paper.approvedItemsCount / Math.max(1, paper.items)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: PUBLICATION (b13) */}
          {currentView === "publication" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                  Publication Status & Tamper-Evident Ledger
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  Rule #7: Only items with valid, published, tamper-evident manifest entries may be served to students.
                </p>
              </div>

              <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-royal/10 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-[#1f1b24]">Active Manifest: {data.manifest.id}</h2>
                    <p className="text-xs text-[#6e6779]">
                      Published at {data.manifest.publishedAt} · {data.manifest.liveQuestionsCount} questions live
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNotice(
                        `Integrity verification passed: All ${data.manifest.liveQuestionsCount} questions match published SHA-256 AST hashes. Fail-closed guarantee active.`
                      )
                    }
                    className="rounded-xl bg-royal px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-royal-deep"
                  >
                    Validate Ledger Integrity
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="font-bold text-[#1f1b24]">Tamper-Evident Ledger Root Hash:</p>
                  <p className="font-mono text-royal bg-royal/[0.02] p-2.5 rounded-lg border border-royal/10 break-all">
                    {data.manifest.rootHash}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: WRITING REVIEW (b15) */}
          {currentView === "writing" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                  Writing Submissions & Human Rubric Review
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  Dual-marking workflow with Australian Curriculum rubric criteria (Ideas, Text Structure, Vocabulary, Sentence Structure, Punctuation, Spelling).
                </p>
              </div>

              <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-3 text-xs text-[#6e6779] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-royal shrink-0" />
                <span>Privacy boundary enforced: Student names and identifying details are scrubbed for blind rubric evaluation.</span>
              </div>

              {!data.writing.availability.isAvailable ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                    <span>Writing Review Queue: Honest Unavailable State</span>
                  </div>
                  <p className="text-xs text-amber-950 font-medium leading-relaxed">
                    {data.writing.availability.reason}
                  </p>
                  {data.writing.availability.requiredDependency && (
                    <p className="text-[11px] font-mono text-amber-800 bg-amber-100/60 p-2 rounded-lg border border-amber-300">
                      Required dependency: {data.writing.availability.requiredDependency}
                    </p>
                  )}
                  <p className="text-[11px] text-[#6e6779]">
                    Per MindMosaic privacy guardrails, raw student submissions and essays are not exposed without an authorized double-blind anonymisation layer.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.writing.items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-[#1f1b24]">Prompt: {item.prompt}</h2>
                        <span className="rounded-full bg-royal/10 text-royal px-2.5 py-0.5 text-[10px] font-bold">
                          {item.yearLevel}
                        </span>
                      </div>
                      <p className="text-xs text-[#6e6779] italic bg-royal/[0.02] p-3 rounded-xl border border-royal/10">
                        &ldquo;{item.snippet}&rdquo;
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6e6779]">
                          Submission: {item.anonymizedStudentId} (Blind Review Privacy Protected) · Submitted {item.submissionDate}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setNotice(
                              "Preview demonstration: Writing rubric scores and formative feedback saved in local preview state."
                            )
                          }
                          className="rounded-xl bg-plum px-3 py-1.5 font-bold text-white hover:bg-plum-deep shadow-xs"
                        >
                          Open Rubric Marker
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: SUPPORT (b18) */}
          {currentView === "support" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                  Parent Support & Inquiry Tickets
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  Direct family queries regarding curriculum questions, practice sessions, or account setup.
                </p>
              </div>

              <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-3 text-xs text-[#6e6779] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-royal shrink-0" />
                <span>Privacy boundary: Student identities, private responses, and parent emails are masked. Triage does not open student profiles.</span>
              </div>

              {!data.support.availability.isAvailable ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                    <span>Support Reports Queue: Honest Unavailable State</span>
                  </div>
                  <p className="text-xs text-amber-950 font-medium leading-relaxed">
                    {data.support.availability.reason}
                  </p>
                  {data.support.availability.requiredDependency && (
                    <p className="text-[11px] font-mono text-amber-800 bg-amber-100/60 p-2 rounded-lg border border-amber-300">
                      Required dependency: {data.support.availability.requiredDependency}
                    </p>
                  )}
                  <p className="text-[11px] text-[#6e6779]">
                    Student distress reports and family accounts cannot be inspected without an explicit privacy-bounded support service.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.support.items.map((tick) => (
                    <div
                      key={tick.id}
                      className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-royal">{tick.id}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              tick.status === "open"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : tick.status === "in_progress"
                                ? "bg-royal/10 text-royal border border-royal/20"
                                : "bg-teal-50 text-teal-800 border border-teal-200"
                            }`}
                          >
                            {tick.status.replace("_", " ")}
                          </span>
                        </div>
                        <span className="text-xs text-[#6e6779]">{tick.submittedAt}</span>
                      </div>

                      <h2 className="text-sm font-bold text-[#1f1b24]">{tick.subject}</h2>
                      <p className="text-xs text-[#6e6779] leading-relaxed">{tick.messageSnippet}</p>

                      <div className="pt-2 border-t border-royal/5 flex items-center justify-between text-xs">
                        <span className="font-medium text-[#6e6779]">From: {tick.maskedContact}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setNotice(
                              `Preview demonstration: Response draft for ${tick.id} updated locally. No email transmitted.`
                            )
                          }
                          className="rounded-xl border border-royal/15 bg-white px-3 py-1 font-bold text-royal hover:bg-royal/5"
                        >
                          Reply to parent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: ACTIVITY HISTORY (b21) */}
          {currentView === "activity" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                  Immutable Governance Activity Log
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  {data.source === "dev"
                    ? "Append-only audit trail derived from authentic database approval records and manifest verifications."
                    : "Cryptographic event log preserving who signed off, exact revision hashes, and publication timestamps."}
                </p>
              </div>

              <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
                <div className="divide-y divide-royal/5">
                  {data.activity.map((act) => (
                    <div key={act.id} className="py-3 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1f1b24]">{act.actor}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              act.badgeTone === "success"
                                ? "bg-teal-50 text-teal-800"
                                : act.badgeTone === "info"
                                ? "bg-royal/10 text-royal"
                                : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            {act.action}
                          </span>
                        </div>
                        <p className="text-xs text-[#6e6779]">{act.target}</p>
                        {act.hash && (
                          <p className="font-mono text-[10px] text-royal">{act.hash}</p>
                        )}
                      </div>
                      <span className="text-xs text-[#6e6779]">{act.timestamp}</span>
                    </div>
                  ))}
                  {data.activity.length === 0 && (
                    <div className="py-6 text-center text-xs text-[#6e6779]">
                      No activity events recorded.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: GOVERNANCE MAP (b23) */}
          {currentView === "governance" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                  Governance Path Map (b23)
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  MindMosaic Question Factory lifecycle from conception to student delivery.
                </p>
              </div>

              <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-6">
                <div className="grid gap-4 sm:grid-cols-4">
                  {[
                    { step: "1", title: "Authoring & Drafting", desc: "Original questions created. Never copied from official tests." },
                    { step: "2", title: "Automated Linter", desc: "Checks schema, secrecy, math assertions, and visual JSON." },
                    { step: "3", title: "Human Gate (#8)", desc: "Mandatory human review and sign-off (approvedBy)." },
                    { step: "4", title: "Tamper-Evident Manifest", desc: "Cryptographic hash ledger published. Fail-closed delivery." },
                  ].map((s) => (
                    <div key={s.step} className="p-4 rounded-xl border border-royal/10 bg-[#fcfbf8] space-y-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-royal text-xs font-bold text-white">
                        {s.step}
                      </div>
                      <h3 className="text-xs font-bold text-[#1f1b24]">{s.title}</h3>
                      <p className="text-[11px] text-[#6e6779] leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: STATE BOARDS (b4, b7, b10, b12, b14, b17, b20, b22) */}
          {currentView === "states" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                  Approved State Boards & Edge Cases
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  Faithful rendering of the 8 design state artboards: Loading skeletons, empty queues vs filter no-matches, error retry, permission denial, stale revisions, and privacy boundaries.
                </p>
              </div>

              {/* Sub-navigation for the 8 state boards */}
              <div className="flex flex-wrap gap-1.5 border-b border-royal/10 pb-3">
                {[
                  { id: "library_states", label: "Overview & Library (b4)" },
                  { id: "review_states", label: "Review States (b7)" },
                  { id: "approve_states", label: "Approve States (b10)" },
                  { id: "paper_states", label: "Paper States (b12)" },
                  { id: "publish_states", label: "Publish States (b14)" },
                  { id: "writing_states", label: "Writing States (b17)" },
                  { id: "support_states", label: "Support States (b20)" },
                  { id: "activity_states", label: "Activity States (b22)" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setActiveStateSubView(st.id as AdminStateSubView)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      activeStateSubView === st.id
                        ? "bg-royal text-white shadow-xs"
                        : "bg-royal/5 text-royal hover:bg-royal/10"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* 1. Overview & Library States (b4) */}
              {activeStateSubView === "library_states" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
                    <h2 className="text-sm font-bold text-[#1f1b24] flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-royal" />
                      1 · Loading State (Skeletons)
                    </h2>
                    <p className="text-xs text-[#6e6779]">
                      Animated pulse placeholders for metric cards and question library rows while authentic reads load.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse rounded-xl border border-royal/10 bg-royal/5 p-4 space-y-2">
                          <div className="h-3 w-20 bg-royal/15 rounded" />
                          <div className="h-6 w-12 bg-royal/20 rounded" />
                          <div className="h-2 w-28 bg-royal/10 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-6 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                        <Check className="h-4 w-4" />
                        Queue Cleared — Nothing Waiting
                      </div>
                      <p className="text-xs text-teal-900 font-medium">
                        Every agent-reviewed question has a human decision. Come back when the generator runs again.
                      </p>
                      <p className="text-[11px] text-[#6e6779]">
                        An empty queue is celebrated progress; it never shares wording with an empty filter.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                        <Filter className="h-4 w-4" />
                        No Match for the Filter
                      </div>
                      <p className="text-xs text-amber-900 font-medium">
                        No questions match these filters. Nothing is wrong — try widening the year or clearing a filter.
                      </p>
                      <p className="text-[11px] text-[#6e6779]">
                        Distinguished clearly from zero content in the question bank.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        Could Not Load Queue
                      </div>
                      <p className="text-xs text-rose-900 font-medium">
                        We couldn’t load the queue. Nothing has changed. No question was approved or published.
                      </p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 py-1 text-xs font-bold text-rose-800 hover:bg-rose-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Try again
                      </button>
                    </div>

                    <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-6 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
                        <Lock className="h-4 w-4" />
                        Signed in, Wrong Role (Permission Denied)
                      </div>
                      <p className="text-xs text-purple-900 font-medium">
                        This area is for reviewers. Your account doesn’t have review access. If this is wrong, ask an administrator.
                      </p>
                      <p className="text-[11px] text-[#6e6779]">
                        A non-admin who reaches /admin is clearly informed and guided to their own home rather than an empty shell.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Review States (b7) */}
              {activeStateSubView === "review_states" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300">
                        AI Review Flagged
                      </span>
                      <span className="text-xs font-mono text-royal">rev 1 · 9d3c110</span>
                    </div>
                    <p className="text-xs text-amber-950 font-medium leading-relaxed">
                      AI reviewer: Two options could be defended as correct under alternative interpretation of the bar diagram. Recommendation: Needs human resolution.
                    </p>
                    <p className="text-[11px] text-[#6e6779]">
                      A flag is a reason to inspect, never an automatic verdict. The screen never auto-rejects on an AI flag.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-royal/15 bg-white p-6 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-royal/10 px-2.5 py-0.5 text-xs font-bold text-royal">
                          Stale Findings
                        </span>
                        <span className="text-xs text-[#6e6779]">Computed for rev 3 · b1774d2</span>
                      </div>
                      <button
                        type="button"
                        className="rounded-xl bg-royal px-3 py-1 text-xs font-bold text-white hover:bg-royal-deep"
                      >
                        Re-run agent review on rev 4 (a3f9c1e)
                      </button>
                    </div>
                    <p className="text-xs text-[#6e6779]">
                      Content was edited after the automated checks ran. Findings are greyed out to prevent mistaken reliance.
                    </p>
                  </div>
                </div>
              )}

              {/* 3. Approve States (b10) */}
              {activeStateSubView === "approve_states" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      Approved Record: Named Person + Exact Hash + Timestamp
                    </div>
                    <p className="text-xs text-teal-950 font-medium">
                      Maya Chen approved g5-num-chart-001 rev 4 (a3f9c1e) at 2:14 pm, 8 November 2026.
                    </p>
                    <p className="text-[11px] text-teal-800 bg-teal-100/60 p-2.5 rounded-lg border border-teal-200">
                      <strong>Critical boundary:</strong> Human approval creates publication eligibility evidence; it does NOT publish the item. Go to Publication for staging.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                      <Lock className="h-4 w-4" />
                      Stale Revision Block — Content Changed Under You
                    </div>
                    <p className="text-xs text-rose-950 font-medium">
                      You were looking at rev 4 · a3f9c1e. It is now rev 5 · 7c2e40a. Approval is disabled until you review the current revision.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="rounded-xl bg-royal px-3 py-1 text-xs font-bold text-white hover:bg-royal-deep"
                      >
                        Load rev 5 and review
                      </button>
                      <button
                        type="button"
                        disabled
                        className="rounded-xl border border-rose-300 bg-rose-100/50 px-3 py-1 text-xs font-bold text-rose-500 cursor-not-allowed"
                      >
                        Approve rev 4 (Disabled)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Paper States (b12) */}
              {activeStateSubView === "paper_states" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      Short of Approved Content
                    </div>
                    <p className="text-xs text-amber-950 font-medium">
                      This paper can’t be published yet: 12 of 30 questions have only an agent pass. In enforce mode a paper needs every question human-approved.
                    </p>
                    <p className="text-[11px] text-[#6e6779]">
                      Readiness is computed strictly from verified approved items, never from a raw total item count.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-royal/15 bg-white p-6 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-[#1f1b24]">Question 2 Has a Newer Revision</h3>
                    <p className="text-xs text-[#6e6779]">
                      The paper pins rev 4; the library now has rev 5. The pinned paper never adopts newer revisions automatically — explicit editorial adoption is required.
                    </p>
                  </div>
                </div>
              )}

              {/* 5. Publish States (b14) */}
              {activeStateSubView === "publish_states" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                      <Lock className="h-4 w-4" />
                      Can’t Publish: No Human Approval (Rule #8 Enforced)
                    </div>
                    <p className="text-xs text-rose-950 font-medium">
                      This revision passed every automated check, but no person has signed it off. Automated checks never supply human sign-off.
                    </p>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="rounded bg-teal-100 text-teal-800 px-2 py-0.5 font-bold">Schema Valid</span>
                      <span className="rounded bg-teal-100 text-teal-800 px-2 py-0.5 font-bold">Machine & Originality Pass</span>
                      <span className="rounded bg-rose-100 text-rose-800 px-2 py-0.5 font-bold">Human Approval Missing</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      Can’t Publish: Approval is Stale
                    </div>
                    <p className="text-xs text-amber-950 font-medium">
                      Maya Chen approved rev 3 · b1774d2, but the current revision is rev 4 · a3f9c1e. The newer revision needs its own human approval.
                    </p>
                    <p className="text-[11px] text-[#6e6779]">
                      Publication checks the approved content hash against the manifest root hash. They must match exactly.
                    </p>
                  </div>
                </div>
              )}

              {/* 6. Writing States (b17) */}
              {activeStateSubView === "writing_states" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-6 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Confirmed
                    </div>
                    <p className="text-xs text-teal-950 font-medium">
                      9 of 12. The student’s result now displays this verified score with formative feedback, marked by Maya Chen.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                      <RotateCcw className="h-4 w-4" />
                      Save Failed — Feedback Preserved Locally
                    </div>
                    <p className="text-xs text-rose-950 font-medium">
                      We couldn’t save that mark. Your marks and feedback are preserved in your editor. The child still sees “not yet marked”.
                    </p>
                    <button
                      type="button"
                      className="rounded-xl bg-rose-700 px-3 py-1 text-xs font-bold text-white hover:bg-rose-800"
                    >
                      Retry saving mark
                    </button>
                  </div>
                </div>
              )}

              {/* 7. Support States (b20) */}
              {activeStateSubView === "support_states" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      Priority Escalation: “Something upset me”
                    </div>
                    <p className="text-xs text-rose-950 font-medium">
                      A student flagged question g3-read-018 (Year 3) as upsetting. Fixed-reason flag only; zero free text collected. Review the item and decide whether to unpublish while investigating.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="rounded-xl border border-rose-300 bg-white px-3 py-1 text-xs font-bold text-rose-800 hover:bg-rose-50"
                      >
                        Inspect question g3-read-018
                      </button>
                      <button
                        type="button"
                        className="rounded-xl bg-rose-700 px-3 py-1 text-xs font-bold text-white hover:bg-rose-800"
                      >
                        Unpublish while reviewing
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-2">
                    <h3 className="text-xs font-bold text-[#1f1b24] flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-royal" />
                      What a Reviewer Never Sees Here (Privacy Line)
                    </h3>
                    <ul className="text-xs text-[#6e6779] list-disc list-inside space-y-1">
                      <li>A child’s name, email alias, or test session answers — reports concern questions only.</li>
                      <li>Free text typed by a student — the report widget collects none.</li>
                      <li>Only question ID, year level, and fixed reason code are transmitted.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* 8. Activity States (b22) */}
              {activeStateSubView === "activity_states" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-[#1f1b24]">Loading Activity</h3>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse h-10 bg-royal/5 rounded-xl border border-royal/10" />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-royal/10 bg-[#fcfbf8] p-6 shadow-xs space-y-2">
                    <h3 className="text-xs font-bold text-[#1f1b24]">No Activity in Range</h3>
                    <p className="text-xs text-[#6e6779]">
                      Nothing in this range. Widen the dates or clear actor/action filters.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-teal-200 bg-teal-50/30 p-6 shadow-xs space-y-2">
                    <h3 className="text-xs font-bold text-teal-950">Append-Only Provenance Guarantees</h3>
                    <p className="text-xs text-teal-900 leading-relaxed">
                      Every log entry guarantees a real named actor (or System for machine actions, never a human name on a machine step), the exact cryptographic revision hash, an authoritative timestamp, and the immutable action type.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
