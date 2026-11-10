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
  | "governance"
  | "states";

export type AdminStateSubView =
  | "library_states"
  | "review_states"
  | "approve_states"
  | "paper_states"
  | "publish_states"
  | "writing_states"
  | "support_states"
  | "activity_states";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStateSubView, setActiveStateSubView] = useState<AdminStateSubView>("library_states");

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

      {/* Mobile Drawer (visible when mobileMenuOpen is true on < md screens) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-royal/10 bg-white p-4 shadow-md space-y-3">
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
                    setDemoNotice(null);
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
                { id: "library", label: "Question library", icon: BookOpen, count: 142 },
                { id: "review", label: "Question review", icon: FileSearch },
                { id: "approval", label: "Human approval", icon: CheckCircle2, count: 6 },
                { id: "paper", label: "Paper review", icon: FileText, count: 4 },
                { id: "publication", label: "Publication status", icon: UploadCloud },
                { id: "writing", label: "Writing review", icon: PenTool, count: 9 },
                { id: "support", label: "Support inquiries", icon: LifeBuoy, count: 3 },
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

              <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-3 text-xs text-[#6e6779] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-royal shrink-0" />
                <span>Privacy boundary enforced: Student names and identifying details are scrubbed for blind rubric evaluation.</span>
              </div>

              <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#1f1b24]">Prompt: The Hidden Key Under the Old Oak</h2>
                  <span className="rounded-full bg-royal/10 text-royal px-2.5 py-0.5 text-[10px] font-bold">
                    Year 3 Narrative
                  </span>
                </div>
                <p className="text-xs text-[#6e6779] italic bg-royal/[0.02] p-3 rounded-xl border border-royal/10">
                  &ldquo;Once upon a time the explorer was walking through the botanic gardens when they saw a glint of gold under a giant oak tree...&rdquo;
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6e6779]">Submission: REDACTED-STU-042 (Blind Review Privacy Protected) · Submitted 2 days ago</span>
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

              <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-3 text-xs text-[#6e6779] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-royal shrink-0" />
                <span>Privacy boundary: Student identities, private responses, and parent emails are masked. Triage does not open student profiles.</span>
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
