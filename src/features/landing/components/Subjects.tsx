import type { ReactNode } from "react";

import { formats, subjects } from "../content";
import { LpCard, SectionHeading } from "./primitives";

export function Subjects() {
  return (
    <section
      id="subjects"
      aria-labelledby="subjects-heading"
      className="site-width scroll-mt-24 py-16 sm:py-24"
    >
      <SectionHeading
        id="subjects-heading"
        eyebrow="Subjects"
        title={subjects.heading}
        intro={subjects.intro}
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {subjects.grades.map((grade) => (
          <div
            key={grade.grade}
            className={`rounded-2xl border p-5 ${
              grade.accent === "brand"
                ? "border-brand/15 bg-brand/5"
                : "border-accent/20 bg-accent/5"
            }`}
          >
            <p
              className={`font-display text-xl font-bold tracking-[-0.02em] ${
                grade.accent === "brand" ? "text-brand" : "text-accent-strong"
              }`}
            >
              {grade.grade}
            </p>
            <p className="mt-1 text-sm leading-6 text-lp-muted">{grade.blurb}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.areas.map((area) => (
          <LpCard key={area.name} className="p-6">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-extrabold uppercase tracking-wide ${
                area.style === "NAPLAN-style"
                  ? "bg-brand/8 text-brand"
                  : "bg-accent/10 text-accent-strong"
              }`}
            >
              {area.style}
            </span>
            <h3 className="mt-3.5 font-display text-lg font-bold tracking-[-0.02em] text-lp-ink">
              {area.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-lp-muted">{area.body}</p>
            <p className="mt-4 text-xs font-bold text-brand">
              Grade 3 · Grade 5
            </p>
          </LpCard>
        ))}
      </div>
    </section>
  );
}

/* ---------- Tiny CSS/SVG visual chips for the formats section ---------- */

function MiniVisual({ kind }: { kind: string }) {
  const stroke = "#5925A8";
  const chips: Record<string, ReactNode> = {
    "Bar charts": (
      <svg viewBox="0 0 40 28" aria-hidden="true" className="h-7 w-10">
        {[10, 18, 6, 22].map((h, i) => (
          <rect
            key={i}
            x={3 + i * 10}
            y={26 - h}
            width="7"
            height={h}
            rx="1.5"
            fill={i === 3 ? "#EF4444" : stroke}
            opacity={i === 3 ? 1 : 0.75}
          />
        ))}
      </svg>
    ),
    "Line graphs": (
      <svg viewBox="0 0 40 28" aria-hidden="true" className="h-7 w-10">
        <polyline
          points="2,22 12,14 22,18 38,4"
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="38" cy="4" r="3" fill="#EF4444" />
      </svg>
    ),
    "Pie charts": (
      <svg viewBox="0 0 28 28" aria-hidden="true" className="h-7 w-7">
        <circle cx="14" cy="14" r="12" fill={stroke} opacity="0.75" />
        <path d="M14 14 L14 2 A12 12 0 0 1 25.4 10.3 Z" fill="#EF4444" />
      </svg>
    ),
    Tables: (
      <svg viewBox="0 0 40 28" aria-hidden="true" className="h-7 w-10">
        <rect x="2" y="2" width="36" height="24" rx="3" fill="none" stroke={stroke} strokeWidth="2" />
        <line x1="2" y1="10" x2="38" y2="10" stroke={stroke} strokeWidth="2" />
        <line x1="20" y1="2" x2="20" y2="26" stroke={stroke} strokeWidth="2" opacity="0.5" />
      </svg>
    ),
    "Number lines": (
      <svg viewBox="0 0 40 28" aria-hidden="true" className="h-7 w-10">
        <line x1="2" y1="16" x2="38" y2="16" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        {[6, 16, 26, 36].map((x) => (
          <line key={x} x1={x} y1="12" x2={x} y2="20" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        ))}
        <circle cx="21" cy="9" r="3" fill="#EF4444" />
      </svg>
    ),
    Geometry: (
      <svg viewBox="0 0 40 28" aria-hidden="true" className="h-7 w-10">
        <polygon points="12,4 22,24 2,24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinejoin="round" />
        <rect x="26" y="10" width="12" height="14" rx="2" fill={stroke} opacity="0.55" />
      </svg>
    ),
    Fractions: (
      <svg viewBox="0 0 28 28" aria-hidden="true" className="h-7 w-7">
        <circle cx="14" cy="14" r="12" fill="none" stroke={stroke} strokeWidth="2.2" />
        <path d="M14 14 L14 2 A12 12 0 0 1 26 14 Z" fill="#EF4444" opacity="0.9" />
        <line x1="14" y1="2" x2="14" y2="26" stroke={stroke} strokeWidth="2" />
        <line x1="2" y1="14" x2="26" y2="14" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
    Diagrams: (
      <svg viewBox="0 0 40 28" aria-hidden="true" className="h-7 w-10">
        <circle cx="8" cy="8" r="5" fill={stroke} opacity="0.75" />
        <circle cx="32" cy="8" r="5" fill={stroke} opacity="0.4" />
        <circle cx="20" cy="22" r="5" fill="#EF4444" opacity="0.9" />
        <line x1="12" y1="10" x2="17" y2="19" stroke={stroke} strokeWidth="2" />
        <line x1="28" y1="10" x2="23" y2="19" stroke={stroke} strokeWidth="2" />
      </svg>
    ),
  };
  return <>{chips[kind]}</>;
}

export function Formats() {
  return (
    <section
      id="formats"
      aria-labelledby="formats-heading"
      className="scroll-mt-24 border-y border-brand/10 bg-white py-16 sm:py-24"
    >
      <div className="site-width">
        <SectionHeading
          id="formats-heading"
          eyebrow="Question formats"
          title={formats.heading}
          intro={formats.intro}
        />

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {formats.interactionFormats.map((format) => (
            <div
              key={format.name}
              className="rounded-2xl border border-brand/10 bg-paper px-4 py-3.5"
            >
              <p className="text-sm font-extrabold text-lp-ink">{format.name}</p>
              <p className="mt-0.5 text-xs leading-5 text-lp-muted">
                {format.note}
              </p>
            </div>
          ))}
        </div>

        <h3 className="mt-12 font-display text-xl font-bold tracking-[-0.02em] text-lp-ink">
          Visual content, drawn for screens
        </h3>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {formats.visuals.map((visual) => (
            <div
              key={visual}
              className="flex items-center gap-3 rounded-2xl border border-brand/10 bg-white px-4 py-3 shadow-[0_8px_20px_rgba(42,16,81,0.05)]"
            >
              <MiniVisual kind={visual} />
              <span className="text-sm font-bold text-lp-ink">{visual}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-3xl rounded-2xl border border-brand/10 bg-brand/5 px-5 py-4 text-sm leading-7 text-lp-ink">
          <span className="font-extrabold text-brand">How marking works: </span>
          {formats.markingNote}
        </p>
      </div>
    </section>
  );
}
