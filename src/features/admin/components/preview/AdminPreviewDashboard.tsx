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
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
} from "lucide-react";
import { MindMosaicLogo } from "@/components/branding";
import {
  PREVIEW_ADMIN_METRICS,
  PREVIEW_ADMIN_QUESTIONS,
  PREVIEW_APPROVAL_ITEMS,
  PREVIEW_SUPPORT_TICKETS,
  PREVIEW_ACTIVITY_LOG,
  type AdminQuestionSummary,
} from "@/features/admin/fixtures/admin-preview-fixtures";

export type AdminView =
  | "overview"
  | "library"
  | "review"
  | "approval"
  | "paper"
  | "publication"
  | "writing"
  | "support"
  | "activity"
  | "governance";

export interface AdminPreviewDashboardProps {
  initialView?: AdminView;
}

export function AdminPreviewDashboard({ initialView = "overview" }: AdminPreviewDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>(initialView);
  const [selectedYear, setSelectedYear] = useState<"all" | 3 | 5>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<AdminQuestionSummary>(
    PREVIEW_ADMIN_QUESTIONS[0]
  );
  const [approvedItems, setApprovedItems] = useState<Record<string, boolean>>({});
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const filteredQuestions = PREVIEW_ADMIN_QUESTIONS.filter((q) => {
    if (selectedYear !== "all" && q.yearLevel !== selectedYear) return false;
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
    setApprovedItems((prev) => ({ ...prev, [itemId]: true }));
    setDemoNotice(
      `Demonstration only: Human sign-off for ${itemId} saved in local preview state. No database or tamper-evident ledger write occurred.`
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfbf8] text-[#1f1b24] flex flex-col">
      {/* Top Preview Banner with Artboard Switcher */}
      <header className="border-b border-royal/10 bg-white sticky top-0 z-40 shadow-xs">
        <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-center text-xs font-medium text-amber-900">
          <strong className="font-bold">Admin Preview:</strong> Interactive visual states from Claude Design export (b0–b26) in local preview mode. All approval, publishing, and support actions are isolated demonstrations (no database or ledger writes).
        </div>
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <MindMosaicLogo size="sm" />
          </Link>

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
            ].map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => {
                  setCurrentView(art.id as AdminView);
                  setDemoNotice(null);
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
                { id: "library", label: "Question library", icon: BookOpen, count: 142 },
                { id: "review", label: "Question review", icon: FileSearch },
                { id: "approval", label: "Human approval", icon: CheckCircle2, count: 6 },
                { id: "paper", label: "Paper review", icon: FileText, count: 4 },
                { id: "publication", label: "Publication status", icon: UploadCloud },
                { id: "writing", label: "Writing review", icon: PenTool, count: 9 },
                { id: "support", label: "Support inquiries", icon: LifeBuoy, count: 3 },
                { id: "activity", label: "Activity history", icon: History },
                { id: "governance", label: "Governance path", icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCurrentView(item.id as AdminView);
                      setDemoNotice(null);
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
                    {item.count !== undefined && (
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
          </div>

          {/* Reviewer Identity Footer (Maya Chen) */}
          <div className="border-t border-royal/10 pt-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-royal text-sm font-bold text-white">
              M
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#1f1b24]">Maya Chen</p>
              <p className="truncate text-[11px] text-[#6e6779]">Content reviewer (Standing Rule #8)</p>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {demoNotice && (
            <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-medium text-amber-900 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-amber-700" />
                <span>{demoNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setDemoNotice(null)}
                className="text-amber-800 hover:text-amber-950 font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* VIEW: OVERVIEW (b0, b1) */}
          {currentView === "overview" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                  Editorial & Governance Overview
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  Review draft curriculum questions, monitor human approval gates, and verify publication ledgers.
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {PREVIEW_ADMIN_METRICS.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-2xl border border-royal/10 bg-white p-5 shadow-xs space-y-2"
                  >
                    <p className="text-xs font-medium text-[#6e6779]">{m.label}</p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-[#1f1b24]">{m.count}</span>
                      <span
                        className={`text-xs font-semibold ${
                          m.trend === "up"
                            ? "text-teal-700"
                            : m.trend === "warning"
                            ? "text-amber-700"
                            : "text-[#6e6779]"
                        }`}
                      >
                        {m.change}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6e6779]">{m.detail}</p>
                  </div>
                ))}
              </div>

              {/* Action Queues */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Awaiting Sign-off Card */}
                <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#1f1b24] flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-amber-600" />
                      <span>Awaiting Human Sign-off</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setCurrentView("approval")}
                      className="text-xs font-bold text-royal hover:underline"
                    >
                      View all (6)
                    </button>
                  </div>
                  <div className="divide-y divide-royal/5">
                    {PREVIEW_APPROVAL_ITEMS.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1f1b24] truncate">{item.title}</p>
                          <p className="text-[11px] text-[#6e6779]">
                            {item.id} · Year {item.yearLevel} {item.subject} · Drafted by {item.draftedBy}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedQuestion(
                              PREVIEW_ADMIN_QUESTIONS.find((q) => q.id === item.id) ??
                                PREVIEW_ADMIN_QUESTIONS[0]
                            );
                            setCurrentView("review");
                          }}
                          className="shrink-0 rounded-lg border border-royal/15 bg-white px-2.5 py-1 text-xs font-bold text-royal hover:bg-royal/5"
                        >
                          Inspect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity Log */}
                <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#1f1b24] flex items-center gap-2">
                      <History className="h-5 w-5 text-royal" />
                      <span>Ledger Activity</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setCurrentView("activity")}
                      className="text-xs font-bold text-royal hover:underline"
                    >
                      Full log
                    </button>
                  </div>
                  <div className="divide-y divide-royal/5">
                    {PREVIEW_ACTIVITY_LOG.map((act) => (
                      <div key={act.id} className="py-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-[#1f1b24]">
                            {act.action}: <span className="font-normal">{act.target}</span>
                          </p>
                          <p className="text-[11px] text-[#6e6779]">
                            {act.actor} · {act.timestamp}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            act.badgeTone === "success"
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : act.badgeTone === "warning"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-royal/5 text-royal border border-royal/10"
                          }`}
                        >
                          {act.id}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: QUESTION LIBRARY (b2, b3) */}
          {currentView === "library" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                    Question Library (142 items)
                  </h1>
                  <p className="mt-1 text-xs text-[#6e6779]">
                    Strict original questions governed by MindMosaic taxonomy and tamper-evident manifests.
                  </p>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-royal/10 shadow-xs">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6e6779]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ID or question title..."
                    className="w-full rounded-xl border border-royal/10 bg-[#fcfbf8] pl-9 pr-4 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/20"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-[#6e6779]">Year:</span>
                  {(["all", 3, 5] as const).map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setSelectedYear(y)}
                      className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                        selectedYear === y ? "bg-royal text-white" : "bg-royal/5 text-royal"
                      }`}
                    >
                      {y === "all" ? "All" : `Year ${y}`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-[#6e6779]">Subject:</span>
                  {["all", "Numeracy", "Reading", "Language Conventions"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSubject(s)}
                      className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                        selectedSubject === s ? "bg-royal text-white" : "bg-royal/5 text-royal"
                      }`}
                    >
                      {s === "all" ? "All" : s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Table */}
              <div className="overflow-hidden rounded-2xl border border-royal/10 bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-royal/10 bg-royal/[0.02] text-[#6e6779] font-bold">
                      <th className="py-3 px-4">Item ID</th>
                      <th className="py-3 px-4">Question Title</th>
                      <th className="py-3 px-4">Year & Subject</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Author</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-royal/5">
                    {filteredQuestions.map((q) => (
                      <tr key={q.id} className="hover:bg-royal/[0.01] transition">
                        <td className="py-3 px-4 font-mono font-bold text-royal">{q.id}</td>
                        <td className="py-3 px-4 font-bold text-[#1f1b24]">{q.title}</td>
                        <td className="py-3 px-4 text-[#6e6779]">
                          Year {q.yearLevel} · {q.subject}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              q.status === "published"
                                ? "bg-teal-50 text-teal-800 border border-teal-200"
                                : q.status === "approved"
                                ? "bg-royal/10 text-royal border border-royal/20"
                                : q.status === "review"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#6e6779]">{q.author}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQuestion(q);
                              setCurrentView("review");
                            }}
                            className="rounded-lg border border-royal/15 bg-white px-2.5 py-1 font-bold text-royal hover:bg-royal/5"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: QUESTION REVIEW (b5, b6) */}
          {currentView === "review" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <button
                    type="button"
                    onClick={() => setCurrentView("library")}
                    className="text-xs font-bold text-royal hover:underline mb-1 inline-flex items-center gap-1"
                  >
                    ← Back to Question Library
                  </button>
                  <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                    {selectedQuestion.title} ({selectedQuestion.id})
                  </h1>
                  <p className="mt-1 text-xs text-[#6e6779]">
                    Year {selectedQuestion.yearLevel} {selectedQuestion.subject} · Authored by {selectedQuestion.author}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulatedSignoff(selectedQuestion.id)}
                    className="rounded-xl bg-royal px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-royal-deep transition flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve & Sign-off</span>
                  </button>
                </div>
              </div>

              {/* Review Workspace Split */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left 2 cols: Stimulus & Question content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Question Stem */}
                  <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-royal">
                      Question Prompt & Stimulus
                    </h2>
                    <p className="text-sm text-[#1f1b24] leading-relaxed">
                      A rectangular garden bed is 8 metres long and 5 metres wide. Maya wants to place a timber border around the entire outside edge of the garden bed. What is the total length of timber border Maya needs?
                    </p>

                    {/* Visual Stimulus Diagram */}
                    <div className="rounded-xl border border-dashed border-royal/20 bg-royal/[0.02] p-6 text-center">
                      <div className="inline-block border-2 border-royal/40 bg-white rounded-lg p-6 shadow-xs">
                        <div className="text-xs font-bold text-royal mb-1">8 m</div>
                        <div className="h-20 w-36 border border-royal bg-teal-50/40 rounded flex items-center justify-center text-xs font-semibold text-teal-900">
                          Garden Bed
                        </div>
                        <div className="text-xs font-bold text-royal mt-1">5 m</div>
                      </div>
                      <p className="mt-3 text-[11px] text-[#6e6779]">
                        Structured Visual JSON: Deterministic SVG render (Standing Rule: No arbitrary unsanitised SVG)
                      </p>
                    </div>

                    {/* Options list */}
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-bold text-[#1f1b24]">Multiple Choice Options:</p>
                      {[
                        { label: "A", text: "13 metres", correct: false },
                        { label: "B", text: "26 metres", correct: true },
                        { label: "C", text: "40 metres", correct: false },
                        { label: "D", text: "52 metres", correct: false },
                      ].map((opt) => (
                        <div
                          key={opt.label}
                          className={`rounded-xl border p-3 text-xs flex items-center justify-between ${
                            opt.correct
                              ? "border-teal-300 bg-teal-50/50 text-teal-950 font-bold"
                              : "border-royal/10 bg-[#fcfbf8] text-[#1f1b24]"
                          }`}
                        >
                          <span>{opt.label}. {opt.text}</span>
                          {opt.correct && (
                            <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                              Declared Key (Answer Secrecy Compliant)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4 text-xs space-y-2">
                      <p className="font-bold text-royal">Worked Pedagogical Explanation:</p>
                      <p className="text-[#6e6779] leading-relaxed">
                        To find the perimeter of a rectangle, calculate the sum of all four sides: Perimeter = 2 × (Length + Width) = 2 × (8 m + 5 m) = 2 × 13 m = 26 metres. Option C (40 m) represents area (8 × 5), which is a common distractor.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right col: Governance & Audit Checklist */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
                    <h2 className="text-sm font-bold text-[#1f1b24] flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-royal" />
                      <span>Standing Rule Verification</span>
                    </h2>
                    <div className="space-y-3 text-xs">
                      {[
                        { label: "Strict Originality (Never copied)", ok: true },
                        { label: "Answer Secrecy in Metadata", ok: true },
                        { label: "Deterministic Visual JSON", ok: true },
                        { label: "Year Level & ACARA Alignment", ok: true },
                        { label: "Distractor Rationale Verified", ok: true },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-teal-700" />
                          <span className="text-[#1f1b24]">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-3 text-xs">
                    <p className="font-bold text-[#1f1b24]">Publication Manifest Entry:</p>
                    <div className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[10px] break-all">
                      sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                    </div>
                    <p className="text-[11px] text-[#6e6779]">
                      Tamper-evident hash generated from item AST.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: HUMAN APPROVAL (b8, b9) */}
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

              <div className="space-y-4">
                {PREVIEW_APPROVAL_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-royal">{item.id}</span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          Awaiting Sign-off
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-[#1f1b24]">{item.title}</h2>
                      <p className="text-xs text-[#6e6779]">
                        {item.subject} · Year {item.yearLevel} · Drafted by {item.draftedBy}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQuestion(
                            PREVIEW_ADMIN_QUESTIONS.find((q) => q.id === item.id) ??
                              PREVIEW_ADMIN_QUESTIONS[0]
                          );
                          setCurrentView("review");
                        }}
                        className="rounded-xl border border-royal/15 bg-white px-3 py-1.5 text-xs font-bold text-royal hover:bg-royal/5"
                      >
                        Inspect item
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulatedSignoff(item.id)}
                        disabled={approvedItems[item.id]}
                        className={`rounded-xl px-4 py-1.5 text-xs font-bold text-white transition ${
                          approvedItems[item.id]
                            ? "bg-teal-700 cursor-default"
                            : "bg-royal hover:bg-royal-deep shadow-xs"
                        }`}
                      >
                        {approvedItems[item.id] ? "Signed Off (Demonstration)" : "Sign Off as Maya Chen"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: PAPER REVIEW (b11) */}
          {currentView === "paper" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                  Paper Review & Staging (4 practice papers)
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  Timed and practice sets assembled from approved questions with deterministic ordering.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    code: "P-NUM-Y3-SET1",
                    title: "Year 3 NAPLAN Numeracy Practice Set 1",
                    items: 36,
                    duration: "45 mins",
                    status: "Ready to publish",
                  },
                  {
                    code: "P-RDG-Y3-SET1",
                    title: "Year 3 Reading Comprehension Set 1",
                    items: 32,
                    duration: "45 mins",
                    status: "Ready to publish",
                  },
                  {
                    code: "P-LNG-Y5-SET1",
                    title: "Year 5 Language Conventions Set 1",
                    items: 40,
                    duration: "40 mins",
                    status: "In staging",
                  },
                  {
                    code: "P-NUM-Y5-SET1",
                    title: "Year 5 NAPLAN Numeracy Practice Set 1",
                    items: 42,
                    duration: "50 mins",
                    status: "In staging",
                  },
                ].map((paper) => (
                  <div
                    key={paper.code}
                    className="rounded-2xl border border-royal/10 bg-white p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-royal">{paper.code}</span>
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200">
                        {paper.status}
                      </span>
                    </div>
                    <h2 className="text-sm font-bold text-[#1f1b24]">{paper.title}</h2>
                    <p className="text-xs text-[#6e6779]">
                      {paper.items} questions · {paper.duration} standard timer
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setDemoNotice(
                          `Preview demonstration: Paper ${paper.code} question lineup verified.`
                        )
                      }
                      className="w-full rounded-xl border border-royal/15 bg-white py-1.5 text-xs font-bold text-royal hover:bg-royal/5"
                    >
                      Inspect paper lineup
                    </button>
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
                    <h2 className="text-base font-bold text-[#1f1b24]">Active Manifest: 2026.11-RELEASE-1</h2>
                    <p className="text-xs text-[#6e6779]">Published at 2026-11-04T08:00:00Z · 142 questions live</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDemoNotice(
                        "Preview demonstration: Ledger validation check passed with 0 mismatches. Fail-closed guarantee enforced."
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
                    sha256-4f53c988a82e9b0b4685a21856e729a8831862efaa918e93235ffb0284067ac1
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
                  Writing Submissions & Human Rubric Review (9 in queue)
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  Dual-marking workflow with Australian Curriculum rubric criteria (Ideas, Text Structure, Vocabulary, Sentence Structure, Punctuation, Spelling).
                </p>
              </div>

              <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#1f1b24]">Prompt: The Hidden Key Under the Old Oak</h2>
                  <span className="rounded-full bg-royal/10 text-royal px-2.5 py-0.5 text-[10px] font-bold">
                    Year 3 Narrative
                  </span>
                </div>
                <p className="text-xs text-[#6e6779] italic bg-royal/[0.02] p-3 rounded-xl border border-royal/10">
                  &ldquo;Once upon a time Aisha was walking through the botanic gardens when she saw a glint of gold under a giant oak tree...&rdquo;
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6e6779]">Student: Aisha Raman · Submitted 2 days ago</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDemoNotice(
                        "Preview demonstration: Writing rubric scores and formative feedback saved in local preview state."
                      )
                    }
                    className="rounded-xl bg-plum px-3 py-1.5 font-bold text-white hover:bg-plum-deep shadow-xs"
                  >
                    Open Rubric Marker
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SUPPORT (b18) */}
          {currentView === "support" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b24]">
                  Parent Support & Inquiry Tickets (3 open)
                </h1>
                <p className="mt-1 text-xs text-[#6e6779]">
                  Direct family queries regarding curriculum questions, practice sessions, or account setup.
                </p>
              </div>

              <div className="space-y-4">
                {PREVIEW_SUPPORT_TICKETS.map((tick) => (
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
                      <span className="font-medium text-[#6e6779]">From: {tick.parentEmail}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setDemoNotice(
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
                  Audit ledger recording all status transitions, human approvals, and manifest releases.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-royal/10 bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-royal/10 bg-royal/[0.02] text-[#6e6779] font-bold">
                      <th className="py-3 px-4">Event ID</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target Item</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-royal/5">
                    {PREVIEW_ACTIVITY_LOG.map((act) => (
                      <tr key={act.id}>
                        <td className="py-3 px-4 font-mono font-bold text-royal">{act.id}</td>
                        <td className="py-3 px-4 font-semibold text-[#1f1b24]">{act.actor}</td>
                        <td className="py-3 px-4">{act.action}</td>
                        <td className="py-3 px-4 text-[#6e6779]">{act.target}</td>
                        <td className="py-3 px-4 text-right text-[#6e6779]">{act.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        </main>
      </div>
    </div>
  );
}
