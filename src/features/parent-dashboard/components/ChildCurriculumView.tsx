"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  PenTool,
  ArrowRight,
  Eye,
  Info,
} from "lucide-react";
import { ChildSwitcher } from "@/features/parent-dashboard";
import { PREVIEW_CHILDREN } from "../fixtures";

export interface ChildCurriculumViewProps {
  childId: string;
}

export function ChildCurriculumView({ childId }: ChildCurriculumViewProps) {
  const [selectedChildId, setSelectedChildId] = useState(childId);
  const currentChild =
    PREVIEW_CHILDREN.find((c) => c.id === selectedChildId) || PREVIEW_CHILDREN[0];

  const switcherItems = PREVIEW_CHILDREN.map((c) => ({
    id: c.id,
    name: c.firstName,
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Link href="/parent" className="hover:text-royal">
          Family Overview
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted/60" aria-hidden="true" />
        <span aria-current="page" className="text-ink">
          Learning for {currentChild.firstName}
        </span>
      </nav>

      {/* Header (b20/b22) */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-royal">Curriculum &amp; Support</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Learning for {currentChild.firstName}
          </h1>
          <p className="mt-1 text-base text-muted">
            What is available at Year {currentChild.yearLevel}, and how to get her going.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          Illustrative sample family
        </span>
      </div>

      {/* Child Switcher */}
      <ChildSwitcher
        childrenList={switcherItems}
        selectedId={selectedChildId}
        showAllOption={false}
        onSelect={(id) => {
          if (id) setSelectedChildId(id);
        }}
      />

      {/* Banner: What Year X can practise */}
      <section
        aria-labelledby="h-year-info"
        className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-7"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="h-year-info" className="text-lg font-bold text-ink">
              What Year {currentChild.yearLevel} can practise
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
              Aligned with the {currentChild.curriculum}. Each area includes timed test papers, untimed practice, and strand skill-builders.
            </p>
          </div>
          <Link
            href={`/parent/children/${currentChild.id}/preview`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-royal/8 px-4 text-xs font-bold text-royal transition hover:bg-royal/15 self-start sm:self-center"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span>Preview sample question</span>
          </Link>
        </div>
      </section>

      {/* Subject 1: Numeracy */}
      <section
        aria-labelledby="h-num"
        className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-7"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-royal/8 pb-4">
          <div>
            <h2 id="h-num" className="text-lg font-bold text-ink">
              NAPLAN-style Numeracy
            </h2>
            <p className="text-xs text-muted">
              Number and algebra &middot; Measurement and geometry &middot; Statistics and probability
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 self-start sm:self-center">
            Ready &middot; 8 papers available
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <p className="text-xs font-bold text-ink">Number and algebra</p>
            <p className="mt-1 text-xs text-muted">Addition, subtraction, arrays, fractions</p>
            <p className="mt-3 text-[11px] font-bold text-royal">6 unit modules</p>
          </div>
          <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <p className="text-xs font-bold text-ink">Measurement and geometry</p>
            <p className="mt-1 text-xs text-muted">Length, mass, capacity, 2D/3D shapes</p>
            <p className="mt-3 text-[11px] font-bold text-royal">4 unit modules</p>
          </div>
          <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <p className="text-xs font-bold text-ink">Statistics and probability</p>
            <p className="mt-1 text-xs text-muted">Picture graphs, column graphs, chance</p>
            <p className="mt-3 text-[11px] font-bold text-royal">3 unit modules</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-royal/8">
          <span className="text-xs text-muted">Practice papers: 35 questions &middot; 45 minutes</span>
          <Link
            href={`/parent/children/${currentChild.id}/preview?subject=numeracy`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-royal/15 bg-white px-3.5 text-xs font-bold text-ink transition hover:border-royal hover:text-royal"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Preview Numeracy Paper</span>
          </Link>
        </div>
      </section>

      {/* Subject 2: Reading */}
      <section
        aria-labelledby="h-read"
        className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-7"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-royal/8 pb-4">
          <div>
            <h2 id="h-read" className="text-lg font-bold text-ink">
              NAPLAN-style Reading
            </h2>
            <p className="text-xs text-muted">
              Informative texts &middot; Narrative stories &middot; Persuasive arguments
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 self-start sm:self-center">
            Ready &middot; 6 papers available
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <p className="text-xs font-bold text-ink">Informative texts</p>
            <p className="mt-1 text-xs text-muted">Factual reports, life cycles, scientific procedures</p>
            <p className="mt-3 text-[11px] font-bold text-royal">5 text studies</p>
          </div>
          <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <p className="text-xs font-bold text-ink">Narrative texts</p>
            <p className="mt-1 text-xs text-muted">Character arcs, plot complications, setting clues</p>
            <p className="mt-3 text-[11px] font-bold text-royal">4 stories</p>
          </div>
          <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <p className="text-xs font-bold text-ink">Persuasive texts</p>
            <p className="mt-1 text-xs text-muted">Opinion articles, letters to the editor, arguments</p>
            <p className="mt-3 text-[11px] font-bold text-royal">3 reviews</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-royal/8">
          <span className="text-xs text-muted">Practice papers: 25 questions &middot; 40 minutes</span>
          <Link
            href={`/parent/children/${currentChild.id}/preview?subject=reading`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-royal/15 bg-white px-3.5 text-xs font-bold text-ink transition hover:border-royal hover:text-royal"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Preview Reading Paper</span>
          </Link>
        </div>
      </section>

      {/* Subject 3: Conventions of Language */}
      <section
        aria-labelledby="h-lang"
        className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-7"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-royal/8 pb-4">
          <div>
            <h2 id="h-lang" className="text-lg font-bold text-ink">
              NAPLAN-style Language conventions
            </h2>
            <p className="text-xs text-muted">Spelling &middot; Grammar &middot; Punctuation</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 self-start sm:self-center">
            Ready &middot; 5 papers available
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <p className="text-xs font-bold text-ink">Spelling</p>
            <p className="mt-1 text-xs text-muted">Phonics, silent letters, irregular plurals</p>
          </div>
          <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <p className="text-xs font-bold text-ink">Grammar</p>
            <p className="mt-1 text-xs text-muted">Tenses, nouns, verbs, prepositions</p>
          </div>
          <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <p className="text-xs font-bold text-ink">Punctuation</p>
            <p className="mt-1 text-xs text-muted">Capitals, apostrophes, speech marks</p>
          </div>
        </div>
      </section>

      {/* Writing Entry Point (Direct link to /parent/children/[childId]/writing) */}
      <section
        aria-labelledby="h-writing-hub"
        className="rounded-2xl border border-royal/15 bg-royal/[0.03] p-6 shadow-sm sm:p-7"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-royal" aria-hidden="true" />
              <h2 id="h-writing-hub" className="text-lg font-bold text-ink">
                Writing prompts &amp; parent marking
              </h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
              Writing assessments are graded by guardians using standardized Australian curriculum criteria. View completed drafts or mark essays.
            </p>
          </div>
          <Link
            href={`/parent/children/${currentChild.id}/writing`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-royal px-5 text-xs font-bold text-white transition hover:bg-royal-deep self-start sm:self-center"
          >
            <span>Open Writing Hub</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
