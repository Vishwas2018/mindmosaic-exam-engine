"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { clsx } from "clsx";

import type { ProgrammeYearStatus, SubjectRow } from "../../programme-status";
import { routes } from "../../content";
import { mmButton } from "../primitives";

function SubjectChip({ subject }: { subject: SubjectRow }) {
  const available = subject.status !== "not_available";
  return (
    <li
      className={clsx(
        "rounded-lg border px-2.5 py-[5px] text-[13.5px]",
        available
          ? "border-transparent bg-[#D9EFEC] text-[#0B6B63]"
          : "border-dashed border-mm-line-quiet text-mm-quiet",
      )}
    >
      {subject.name}
      {subject.status === "reduced_practice" && " · reduced practice"}
      {!available && " · not available"}
    </li>
  );
}

function FamilyCard({
  name,
  href,
  subjects,
  note,
}: {
  name: string;
  href: string;
  subjects: readonly SubjectRow[];
  note?: string;
}) {
  const available = subjects.some((subject) => subject.status !== "not_available");
  const hasFullPaper = subjects.some((subject) => subject.status === "available");
  return (
    <article className="flex flex-col gap-3.5 rounded-[20px] border border-mm-line bg-white p-[clamp(20px,2.4vw,28px)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold tracking-[-0.015em] text-mm-ink">{name}</h3>
        <span className={clsx("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-[13px] font-semibold",
          available ? "bg-[#D9EFEC] text-[#0B6B63]" : "border border-dashed border-mm-line-quiet text-mm-quiet")}>
          {available && <Check aria-hidden="true" className="h-[13px] w-[13px]" strokeWidth={3} />}
          {hasFullPaper ? "Practice available" : available ? "Reduced practice" : "Not available"}
        </span>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {subjects.map((subject) => (
          <SubjectChip key={subject.name} subject={subject} />
        ))}
      </ul>
      {note && <p className="text-sm text-mm-muted">{note}</p>}
      <Link
        href={href}
        className="mt-auto flex w-fit items-center gap-2 text-[15.5px] font-semibold text-mm-brand hover:text-mm-brand-deep"
      >
        View program
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  );
}

export function ProgramsYearPicker({
  years,
  initialYear = 3,
}: {
  years: readonly [ProgrammeYearStatus, ProgrammeYearStatus];
  initialYear?: 3 | 5;
}) {
  const [year, setYear] = useState<number>(initialYear);
  const status = years.find((entry) => entry.year === year);
  const liveYears = new Set(years.filter((entry) => [...entry.naplan, ...entry.icas]
    .some((subject) => subject.status !== "not_available")).map((entry) => Number(entry.year)));
  const live = liveYears.has(year);

  return (
    <>
      <section aria-labelledby="yr-h" className="rounded-[24px] border border-mm-line bg-white p-[clamp(18px,2.4vw,28px)]">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="yr-h" className="text-[17px] font-semibold text-mm-ink">
            Choose a year level
          </h2>
          <span className="inline-flex items-center gap-2 text-sm text-mm-ink-soft">
            {liveYears.size > 0 && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#0B6B63]" />}
            {liveYears.size > 0 ? "Has programs available now" : "No practice subjects available yet"}
          </span>
        </div>
        <div role="radiogroup" aria-labelledby="yr-h" className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
          {Array.from({ length: 12 }, (_, index) => index + 1).map((n) => {
            const selected = n === year;
            const isLive = liveYears.has(n);
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setYear(n)}
                className={clsx(
                  "flex min-h-12 items-center justify-center gap-2 rounded-xl border text-[15px] font-semibold transition-colors",
                  selected
                    ? "border-mm-brand bg-mm-brand text-white"
                    : "border-mm-line bg-white text-mm-ink hover:border-mm-brand",
                )}
              >
                {isLive && (
                  <span
                    aria-hidden="true"
                    className={clsx("h-[7px] w-[7px] rounded-full", selected ? "bg-white" : "bg-[#0B6B63]")}
                  />
                )}
                Year {n}
                <span className="sr-only">{isLive ? ", programs available" : ", not yet available"}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-live="polite" className="grid gap-10">
        {status ? (
          <div className="grid gap-4">
            <h2 className="text-[clamp(26px,2.6vw,36px)] font-bold tracking-[-0.03em] text-mm-ink">
              {live ? `Open for Year ${year}` : `Programs for Year ${year}`}
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
              <FamilyCard
                name={`NAPLAN-style · Year ${year}`}
                href={`${routes.programs}/naplan-style?year=${year}`}
                subjects={status.naplan}
                note="Dedicated writing papers are deferred; writing tasks require manual review."
              />
              <FamilyCard
                name={`ICAS-style · Year ${year}`}
                href={`${routes.programs}/icas-style?year=${year}`}
                subjects={status.icas}
              />
              <article className="flex flex-col gap-3.5 rounded-[20px] border border-mm-line bg-white p-[clamp(20px,2.4vw,28px)]">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold tracking-[-0.015em] text-mm-ink">Curriculum lessons</h3>
                  <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#FFF1E6] px-2.5 py-1 text-[13px] font-semibold text-[#8A4B12]">
                    Limited
                  </span>
                </div>
                <p className="text-[15.5px] leading-[1.55] text-mm-ink-soft">
                  Maths and English lessons with learning intentions and worked examples.
                  Practice questions appear when approved, aligned content is available.
                </p>
                <p className="text-sm text-mm-muted">For signed-in students only.</p>
                <Link
                  href={routes.startFree}
                  className="mt-auto flex w-fit items-center gap-2 text-[15.5px] font-semibold text-mm-brand hover:text-mm-brand-deep"
                >
                  Start free to use lessons
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </article>
              <article className="flex flex-col gap-3.5 rounded-[20px] border border-mm-line bg-white p-[clamp(20px,2.4vw,28px)]">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold tracking-[-0.015em] text-mm-ink">Build your own practice</h3>
                  <span className={clsx("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-[13px] font-semibold",
                    live ? "bg-[#D9EFEC] text-[#0B6B63]" : "border border-dashed border-mm-line-quiet text-mm-quiet")}>
                    {live && <Check aria-hidden="true" className="h-[13px] w-[13px]" strokeWidth={3} />}
                    {live ? "Available" : "Not available"}
                  </span>
                </div>
                <p className="text-[15.5px] leading-[1.55] text-mm-ink-soft">
                  Choose the year, subject, style and length from the available practice content.
                </p>
                <Link
                  href={routes.guestPractice}
                  className="mt-auto flex w-fit items-center gap-2 text-[15.5px] font-semibold text-mm-brand hover:text-mm-brand-deep"
                >
                  {live ? "Build a set" : "Check practice availability"}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </article>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 rounded-[20px] border border-dashed border-mm-line-quiet bg-white p-[clamp(24px,3vw,40px)]">
            <h2 className="text-[clamp(24px,2.4vw,32px)] font-bold tracking-[-0.03em] text-mm-ink">
              Nothing open for Year {year} yet
            </h2>
            <p className="max-w-[620px] text-[16px] leading-[1.6] text-mm-ink-soft">
              Year {year} content is still being written and checked. It will appear here once
              there are enough reviewed questions for a practice set. Check each program for current availability.
            </p>
            <div className="mt-1 flex flex-wrap gap-3">
              <button type="button" onClick={() => setYear(3)} className={mmButton()}>
                See Year 3
              </button>
              <Link href={routes.contact} className={mmButton({ variant: "outline" })}>
                Register interest
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
