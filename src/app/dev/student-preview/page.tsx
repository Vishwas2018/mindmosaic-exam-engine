"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  StudentCanvasScreen,
  type StudentCanvasScreenId,
} from "@/features/student/canvas/StudentCanvasScreen";
import artboardsData from "@/features/student/canvas/canvas-artboards-data.json";

const ARTBOARD_KEYS = Object.keys(artboardsData);

const SCREEN_OPTIONS: { id: StudentCanvasScreenId; label: string; primaryKey: string }[] = [
  { id: "my-space", label: "My Space", primaryKey: "Main" },
  { id: "learn-hub", label: "Learning Hub", primaryKey: "LearnHub" },
  { id: "learn-lesson", label: "Lesson Reader", primaryKey: "LearnLesson" },
  { id: "practice", label: "Practice Studio", primaryKey: "Practice" },
  { id: "runner", label: "Practice Runner", primaryKey: "RunnerQ" },
  { id: "exams", label: "Exam Preparation", primaryKey: "ExamBrowse" },
  { id: "results", label: "Results & Review", primaryKey: "Results" },
  { id: "result-review", label: "Question Review", primaryKey: "ResultReview" },
  { id: "progress", label: "Progress Analytics", primaryKey: "Progress" },
  { id: "help", label: "Student Help", primaryKey: "Help" },
  { id: "profile", label: "Student Profile", primaryKey: "Profile" },
];

type ViewportOption = "full" | "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTHS: Record<ViewportOption, string> = {
  full: "100%",
  desktop: "1440px",
  tablet: "834px",
  mobile: "390px",
};

export default function StudentPreviewPage() {
  const [selectedScreen, setSelectedScreen] = useState<StudentCanvasScreenId>("my-space");
  const [selectedViewport, setSelectedViewport] = useState<ViewportOption>("desktop");
  const [selectedState, setSelectedState] = useState<string>("default");
  const [directArtboard, setDirectArtboard] = useState<string>("");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Controller Bar */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            href="/dev/routes"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            â† Dev Routes
          </Link>
          <span className="text-slate-600">|</span>
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Student Canvas Design Inspector (PR #109 Catalog)
          </h1>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
            Isolated Sandbox
          </span>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
          {(["desktop", "tablet", "mobile", "full"] as const).map((vp) => (
            <button
              key={vp}
              type="button"
              onClick={() => setSelectedViewport(vp)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                selectedViewport === vp
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {vp === "desktop" && "Desktop 1440"}
              {vp === "tablet" && "Tablet 834"}
              {vp === "mobile" && "Mobile 390"}
              {vp === "full" && "Full Fluid"}
            </button>
          ))}
        </div>
      </header>

      {/* Control Sub-bar */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Screen selector */}
        <div className="flex items-center gap-2">
          <label className="font-semibold text-slate-400">Screen:</label>
          <select
            value={selectedScreen}
            onChange={(e) => {
              setSelectedScreen(e.target.value as StudentCanvasScreenId);
              setDirectArtboard("");
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
          >
            {SCREEN_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* State selector */}
        <div className="flex items-center gap-2">
          <label className="font-semibold text-slate-400">State:</label>
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setDirectArtboard("");
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
          >
            <option value="default">Default / Returning</option>
            <option value="first-run">First Run / Welcome</option>
            <option value="empty">Empty / First Visit</option>
            <option value="active">Active / In-Session</option>
            <option value="completed">Completed / Review</option>
            <option value="states">Multi-state Showcase</option>
          </select>
        </div>

        {/* Direct artboard jump */}
        <div className="flex items-center gap-2">
          <label className="font-semibold text-slate-400">Direct Artboard ({ARTBOARD_KEYS.length}):</label>
          <select
            value={directArtboard}
            onChange={(e) => setDirectArtboard(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs font-mono text-emerald-400 focus:ring-1 focus:ring-indigo-500 max-w-[200px]"
          >
            <option value="">â€” by Screen & Viewport â€”</option>
            {ARTBOARD_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        {/* Active Route indicator */}
        <div className="text-slate-400">
          Authenticated route counter-part:{" "}
          <span className="font-mono text-indigo-300">
            {selectedScreen === "my-space" && "/student"}
            {selectedScreen === "learn-hub" && "/student/learn"}
            {selectedScreen === "learn-lesson" && "/student/learn/lessons/[code]"}
            {selectedScreen === "practice" && "/student/practice"}
            {selectedScreen === "runner" && "/practice/session"}
            {selectedScreen === "exams" && "/student/exam-preparation"}
            {selectedScreen === "results" && "/student/results"}
            {selectedScreen === "result-review" && "/student/results/[id]/review"}
            {selectedScreen === "progress" && "/student/progress"}
            {selectedScreen === "help" && "/student-help"}
            {selectedScreen === "profile" && "/student/profile"}
          </span>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <main className="flex-1 flex justify-center items-start p-4 bg-slate-900 overflow-auto">
        <div
          className="bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-700 transition-all duration-200"
          style={{
            width: VIEWPORT_WIDTHS[selectedViewport],
            minHeight: "800px",
            maxWidth: "100%",
          }}
        >
          <StudentCanvasScreen
            screen={selectedScreen}
            state={selectedState}
          />
        </div>
      </main>
    </div>
  );
}
