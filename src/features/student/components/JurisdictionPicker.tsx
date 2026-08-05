"use client";

import { useState } from "react";
import { clsx } from "clsx";

/**
 * The jurisdiction picker — design handoff screen 10, view 2. Eight
 * state/territory tiles, each with a coverage badge, and a sticky detail
 * aside for whichever is selected.
 *
 * **Every jurisdiction is "Being confirmed", and that is not a placeholder
 * oversight.** The design marks NSW, VIC and WA as confirmed. This product
 * has no selective-entry content at all — the question bank is NAPLAN-style
 * and ICAS-style only (DESIGN_AUDIT.md §14) — so marking any jurisdiction
 * confirmed would claim coverage that does not exist. The handoff's own
 * open item 4 requires that confirmation before the badge comes off; until
 * it does, the honest state is the one shown here.
 *
 * The `confirmed` flag is kept on each entry rather than hard-coded into
 * the badge, so flipping one when its papers actually ship is a one-word
 * edit and the UI already handles both states.
 */

interface Jurisdiction {
  readonly code: string;
  readonly name: string;
  readonly confirmed: boolean;
  readonly summary: string;
  readonly detail: string;
  readonly entryStyle: string;
}

const JURISDICTIONS: readonly Jurisdiction[] = [
  {
    code: "NSW",
    name: "New South Wales",
    confirmed: false,
    summary: "Opportunity Class and selective high school style practice.",
    detail:
      "Selective high school entry style, Years 4 and 6 entry points, three papers plus writing. Practice papers in this format are being written.",
    entryStyle: "Two entry points",
  },
  {
    code: "VIC",
    name: "Victoria",
    confirmed: false,
    summary: "Select entry accelerated learning style practice.",
    detail:
      "Select entry style testing at Year 8 entry, reasoning and mathematics focus. Practice papers in this format are being written.",
    entryStyle: "Year 8 entry",
  },
  {
    code: "QLD",
    name: "Queensland",
    confirmed: false,
    summary: "Academies and high-ability entry style practice.",
    detail:
      "Entry arrangements vary by academy; coverage is being verified before release.",
    entryStyle: "Varies by academy",
  },
  {
    code: "WA",
    name: "Western Australia",
    confirmed: false,
    summary: "Gifted and talented academic selection style practice.",
    detail:
      "Academic selective entrance style testing, Year 6 entry, two papers. Practice papers in this format are being written.",
    entryStyle: "Year 6 entry",
  },
  {
    code: "SA",
    name: "South Australia",
    confirmed: false,
    summary: "Ignite and special interest entry style practice.",
    detail: "Programme-specific entry testing; coverage is being verified before release.",
    entryStyle: "Varies by programme",
  },
  {
    code: "TAS",
    name: "Tasmania",
    confirmed: false,
    summary: "Extension and high-ability entry style practice.",
    detail: "Arrangements differ by school; coverage is being verified before release.",
    entryStyle: "Varies by school",
  },
  {
    code: "ACT",
    name: "Australian Capital Territory",
    confirmed: false,
    summary: "High-ability entry style practice.",
    detail: "Entry arrangements are school based; coverage is being verified before release.",
    entryStyle: "Varies by school",
  },
  {
    code: "NT",
    name: "Northern Territory",
    confirmed: false,
    summary: "Accelerated entry style practice.",
    detail: "Arrangements differ by school; coverage is being verified before release.",
    entryStyle: "Varies by school",
  },
];

export function JurisdictionPicker() {
  const [code, setCode] = useState(JURISDICTIONS[0].code);
  const selected = JURISDICTIONS.find((item) => item.code === code) ?? JURISDICTIONS[0];

  return (
    <div className="grid items-start gap-[clamp(18px,2vw,28px)] xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid gap-3 sm:grid-cols-2">
        {JURISDICTIONS.map((item) => {
          const on = item.code === selected.code;
          return (
            <button
              key={item.code}
              type="button"
              aria-pressed={on}
              onClick={() => setCode(item.code)}
              className={clsx(
                "grid gap-2.5 rounded-[14px] border-[1.5px] p-[18px] text-left transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand",
                on ? "border-mm-brand bg-mm-wash" : "border-mm-line bg-white hover:border-mm-brand",
              )}
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-[family-name:var(--font-display)] text-[17px] font-bold text-mm-ink">
                  {item.code}
                </span>
                <span
                  className={clsx(
                    "rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-[0.04em]",
                    item.confirmed
                      ? "bg-mm-tint text-mm-brand"
                      : "bg-mm-alert text-mm-coral-text",
                  )}
                >
                  {item.confirmed ? "Confirmed" : "Being confirmed"}
                </span>
              </span>
              <span className="text-[14.5px] font-semibold text-mm-ink">{item.name}</span>
              <span className="text-[13.5px] leading-[1.5] text-mm-muted">{item.summary}</span>
            </button>
          );
        })}
      </div>

      <aside
        aria-live="polite"
        className="grid gap-3.5 rounded-2xl border border-mm-line bg-white p-5 xl:sticky xl:top-[96px]"
      >
        <h3 className="text-[17.5px] font-bold text-mm-ink">{selected.name}</h3>
        <p className="text-[14.5px] leading-[1.55] text-mm-muted">{selected.detail}</p>
        <dl className="grid gap-2.5 border-t border-mm-line-soft pt-3.5">
          {[
            { label: "Status", value: selected.confirmed ? "Confirmed" : "Being confirmed" },
            { label: "Entry style", value: selected.entryStyle },
            {
              label: "Papers available",
              value: selected.confirmed ? "Ready to sit" : "In preparation",
            },
            { label: "Question types", value: "Reasoning, mathematics, reading" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between gap-3 text-[14.5px]">
              <dt className="text-mm-muted">{row.label}</dt>
              <dd className="text-right font-bold text-mm-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="rounded-xl border border-mm-alert-line bg-mm-alert p-3.5 text-[13.5px] leading-[1.55] text-mm-coral-deep">
          No selective entry-style papers have been released for any jurisdiction yet. Choosing one
          here records the format we are writing towards; it does not unlock a paper.
        </p>
      </aside>
    </div>
  );
}
