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
              Three different things a programme can be, and they never share wording: ready to use, not written yet, or we could not check.
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

        {/* Programme Availability Grid (b20 artboard) */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* NAPLAN Numeracy */}
          <article className="flex flex-col justify-between rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-ink">NAPLAN-style Numeracy</h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  Ready
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                about 180 questions &middot; sets of 10, 20 or a full paper
              </p>
            </div>
            <div className="mt-4 flex gap-2 pt-2 border-t border-royal/8">
              <Link
                href={`/parent/children/${currentChild.id}/preview?subject=numeracy`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-royal/15 bg-white px-3 text-xs font-semibold text-ink transition hover:border-royal hover:text-royal"
              >
                <span>Have a look</span>
              </Link>
            </div>
          </article>

          {/* NAPLAN Reading */}
          <article className="flex flex-col justify-between rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-ink">NAPLAN-style Reading</h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  Ready
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                about 95 questions &middot; sets of 10 or 20
              </p>
            </div>
            <div className="mt-4 flex gap-2 pt-2 border-t border-royal/8">
              <Link
                href={`/parent/children/${currentChild.id}/preview?subject=reading`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-royal/15 bg-white px-3 text-xs font-semibold text-ink transition hover:border-royal hover:text-royal"
              >
                <span>Have a look</span>
              </Link>
            </div>
          </article>

          {/* NAPLAN Language Conventions */}
          <article className="flex flex-col justify-between rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-ink">NAPLAN-style Language conventions</h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  Ready
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                about 82 questions &middot; sets of 10 or 20
              </p>
            </div>
            <div className="mt-4 flex gap-2 pt-2 border-t border-royal/8">
              <Link
                href={`/parent/children/${currentChild.id}/preview?subject=language`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-royal/15 bg-white px-3 text-xs font-semibold text-ink transition hover:border-royal hover:text-royal"
              >
                <span>Have a look</span>
              </Link>
            </div>
          </article>

          {/* ICAS-style English */}
          <article className="flex flex-col justify-between rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-ink">ICAS-style English</h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  Ready
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                about 140 questions &middot; sets of 10 or 20
              </p>
            </div>
            <div className="mt-4 flex gap-2 pt-2 border-t border-royal/8">
              <Link
                href={`/parent/children/${currentChild.id}/preview?subject=icas-english`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-royal/15 bg-white px-3 text-xs font-semibold text-ink transition hover:border-royal hover:text-royal"
              >
                <span>Have a look</span>
              </Link>
            </div>
          </article>

          {/* Singapore Maths (Planned Programme) */}
          <article className="flex flex-col justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-ink">Singapore Maths</h3>
                <span className="rounded-full border border-amber-500/30 bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                  Planned
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Bar-model problem solving and mastery practice. In active curriculum development.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-amber-500/15">
              <span className="inline-flex items-center text-xs font-medium text-amber-900/80">
                Practice cannot be started &middot; Coming in a future update
              </span>
            </div>
          </article>

          {/* ICAS-style Science (Not written yet) */}
          <article className="flex flex-col justify-between rounded-xl border border-royal/10 bg-muted/5 p-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-muted">ICAS-style Science</h3>
                <span className="rounded-full border border-royal/15 bg-white px-2.5 py-0.5 text-[11px] font-bold text-muted">
                  Not written yet
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                There are no questions for this subject at Year {currentChild.yearLevel} yet. It is not hidden from you, and it is not coming this term.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-royal/8">
              <span className="inline-flex items-center text-xs font-medium text-muted">
                Practice cannot be started
              </span>
            </div>
          </article>

          {/* ICAS-style Digital Technologies (We couldn't check) */}
          <article className="flex flex-col justify-between rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-ink">ICAS-style Digital Technologies</h3>
                <span className="rounded-full border border-amber-500/30 bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                  We couldn&apos;t check
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                We could not work out what is available here just now. There may be plenty or none &mdash; we are not going to guess.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-amber-500/15">
              <span className="inline-flex items-center text-xs font-medium text-amber-900/80">
                Unavailable &middot; Try again shortly
              </span>
            </div>
          </article>
        </div>

        <p className="mt-4 text-[11px] text-muted">
          Only Years 3 and 5 are open. Other years are not shown at all rather than shown as empty.
        </p>
      </section>

      {/* Help Aisha get started (b20 artboard) */}
      <section
        aria-labelledby="h-start"
        className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-7"
      >
        <h2 id="h-start" className="text-lg font-bold text-ink">
          Help {currentChild.firstName} get started
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <p className="text-sm font-bold text-ink">1 &middot; Sit with her the first time</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Her login code is <strong className="font-mono font-bold text-ink">{currentChild.loginCode}</strong> and you set the PIN. The first sign-in is the only fiddly bit.
            </p>
          </div>
          <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <p className="text-sm font-bold text-ink">2 &middot; Start with a practice set</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              No timer, no record kept. She can stop whenever she likes and nothing counts against her.
            </p>
          </div>
          <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <p className="text-sm font-bold text-ink">3 &middot; Move to a timed paper later</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Timed papers are the ones that appear in your Family Overview. One a fortnight is plenty at Year {currentChild.yearLevel}.
            </p>
          </div>
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
