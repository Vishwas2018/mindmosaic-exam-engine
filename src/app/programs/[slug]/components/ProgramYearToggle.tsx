"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { clsx } from "clsx";

import type { SubjectRow } from "@/features/landing/programme-status";

function statusBadgeClasses(status: SubjectRow["status"]): string {
  return status === "available"
    ? "bg-[#D9EFEC] text-[#0B6B63]"
    : "border border-dashed border-mm-line-quiet text-mm-quiet";
}

export function ProgramYearToggle({
  years,
}: {
  years: readonly { readonly year: 3 | 5; readonly subjects: readonly SubjectRow[] }[];
}) {
  const [year, setYear] = useState<3 | 5>(years[0]?.year ?? 3);
  const active = years.find((entry) => entry.year === year) ?? years[0]!;

  return (
    <div className="grid gap-6">
      <div role="group" aria-label="Year level" className="flex flex-wrap gap-2">
        {years.map((entry) => {
          const selected = entry.year === year;
          return (
            <button
              key={entry.year}
              type="button"
              aria-pressed={selected}
              onClick={() => setYear(entry.year)}
              className={clsx(
                "min-h-11 rounded-xl px-4 text-[14.5px] font-semibold",
                selected
                  ? "border border-mm-brand bg-mm-brand text-white"
                  : "border border-mm-line bg-white text-mm-ink hover:border-mm-brand",
              )}
            >
              Year {entry.year}
            </button>
          );
        })}
      </div>

      <ul className="m-0 list-none border-t border-mm-line p-0">
        {active.subjects.map((subject) => (
          <li
            key={subject.name}
            className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)_auto] items-center gap-3 border-b border-mm-line py-[18px] max-sm:grid-cols-1 max-sm:gap-2"
          >
            <span className="text-[17px] font-semibold text-mm-ink">{subject.name}</span>
            <span className="text-[15px] leading-[1.5] text-mm-ink-soft">
              {subject.detail}
              {subject.note && <span className="block text-mm-quiet">{subject.note}</span>}
            </span>
            <span
              className={clsx(
                "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-[13px] font-semibold",
                statusBadgeClasses(subject.status),
              )}
            >
              {subject.status === "available" && (
                <Check aria-hidden="true" className="h-[13px] w-[13px]" strokeWidth={3} />
              )}
              {subject.status === "available" ? "Full practice paper" : subject.status === "reduced_practice" ? "Reduced practice" : "Not available"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
