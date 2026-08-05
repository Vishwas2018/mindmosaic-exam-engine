"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { programmes } from "../content";
import { Eyebrow, mmButton, pillClasses, SectionHeading } from "./primitives";

type GroupId = "primary" | "secondary";

/**
 * "Choose a year level, then a pathway." — a year picker, a category
 * filter, and a vertical tablist of the seven programmes beside the
 * detail panel for the selected one.
 *
 * Coverage is the honest part of this section: a programme that does not
 * cover the chosen year is still listed and still selectable, marked
 * "Unavailable" in words (never colour alone), and its panel says so
 * plainly. Nothing is hidden to imply broader coverage than exists.
 *
 * One deliberate difference from the design file: when the category
 * filter hides the currently selected programme, the panel follows the
 * filter instead of keeping a selection the visitor can no longer see.
 */
export function Programmes() {
  const [group, setGroup] = useState<GroupId>("primary");
  const [year, setYear] = useState<number>(programmes.defaultYear);
  const [category, setCategory] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string>(programmes.items[0]!.id);
  const [region, setRegion] = useState<string>(programmes.regions[0]!.id);

  const visible = useMemo(
    () => programmes.items.filter((item) => category === "all" || item.category === category),
    [category],
  );

  const active = visible.find((item) => item.id === selectedId) ?? visible[0] ?? programmes.items[0]!;
  const covers = (from: number, to: number) => year >= from && year <= to;
  const activeCovered = covers(active.from, active.to);
  const yearLabel = `Year ${year}`;

  const years = programmes.groups.find((entry) => entry.id === group)?.years ?? [];

  function moveSelection(currentIndex: number, key: string) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(key)) return;
    let next = currentIndex;
    if (key === "ArrowDown") next = (currentIndex + 1) % visible.length;
    if (key === "ArrowUp") next = (currentIndex - 1 + visible.length) % visible.length;
    if (key === "Home") next = 0;
    if (key === "End") next = visible.length - 1;
    const target = visible[next];
    if (!target) return;
    setSelectedId(target.id);
    document.getElementById(`mm-prog-tab-${target.id}`)?.focus();
  }

  return (
    <section id="pathways" aria-labelledby="pathways-heading" className="bg-mm-page py-[clamp(40px,4vw,64px)]">
      <div className="mm-width">
        <SectionHeading
          id="pathways-heading"
          eyebrow={programmes.eyebrow}
          title={programmes.heading}
          intro={programmes.intro}
          className="mb-[clamp(22px,2.2vw,30px)]"
        />

        <div className="mb-[clamp(18px,2vw,26px)] rounded-[18px] border border-mm-line bg-white p-[clamp(18px,2vw,26px)]">
          <fieldset className="m-0 grid min-w-0 gap-3.5 border-0 p-0">
            <legend className="px-0 text-base font-bold uppercase tracking-[0.1em] text-mm-ink">
              {programmes.yearLegend}
            </legend>

            <div role="group" aria-label="Year group" className="flex flex-wrap gap-2">
              {programmes.groups.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={group === entry.id}
                  onClick={() => {
                    setGroup(entry.id as GroupId);
                    setYear(entry.defaultYear);
                  }}
                  className={pillClasses({ selected: group === entry.id, className: "px-[18px]" })}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            <div role="group" aria-label="Year" className="flex flex-wrap gap-2">
              {years.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={value === year}
                  onClick={() => setYear(value)}
                  className={pillClasses({ selected: value === year, className: "min-w-14 px-3" })}
                >
                  Year {value}
                </button>
              ))}
            </div>

            <p className="text-[13.5px] text-mm-muted">
              Showing programmes available for <strong>{yearLabel}</strong>. Programmes that do not cover this
              year are marked unavailable.
            </p>
          </fieldset>
        </div>

        <div role="group" aria-label="Filter programmes by category" className="mb-4 flex flex-wrap gap-2">
          {programmes.categories.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className={pillClasses({ selected: category === value, className: "rounded-full px-4 text-sm" })}
            >
              {value === "all" ? "All" : value}
            </button>
          ))}
        </div>

        <div className="grid items-start gap-[clamp(18px,2vw,28px)] lg:grid-cols-2">
          <div role="tablist" aria-label="Programmes" aria-orientation="vertical" className="grid gap-2">
            {visible.map((item, index) => {
              const selected = item.id === active.id;
              const covered = covers(item.from, item.to);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`mm-prog-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls="mm-prog-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setSelectedId(item.id)}
                  onKeyDown={(event) => {
                    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                      event.preventDefault();
                      moveSelection(index, event.key);
                    }
                  }}
                  className={`grid min-h-[76px] grid-cols-[1fr_auto] items-center gap-4 rounded-[14px] border px-5 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 ${
                    selected
                      ? "border-mm-brand bg-white shadow-[0_2px_10px_rgba(89,37,168,0.10)]"
                      : covered
                        ? "border-mm-line bg-transparent hover:border-mm-brand"
                        : "border-mm-line-quiet bg-mm-surface-quiet hover:border-mm-brand"
                  }`}
                >
                  <span className="grid min-w-0 gap-1">
                    <span className="font-display text-[17.5px] font-bold tracking-[-0.02em] text-mm-ink">
                      {item.name}
                    </span>
                    <span className="text-[13.5px] font-medium text-mm-muted">
                      Years {item.from}–{item.to}
                      {item.tbc ? " · more to be confirmed" : ""}
                    </span>
                  </span>
                  <span
                    className={`whitespace-nowrap text-[11.5px] font-bold uppercase tracking-[0.08em] ${
                      covered ? (selected ? "text-mm-brand" : "text-mm-muted") : "text-mm-quiet"
                    }`}
                  >
                    {covered ? (selected ? "Selected" : item.category) : "Unavailable"}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id="mm-prog-panel"
            aria-labelledby={`mm-prog-tab-${active.id}`}
            tabIndex={-1}
            className="rounded-[20px] border border-mm-line bg-white p-[clamp(24px,2.6vw,38px)] shadow-[0_1px_3px_rgba(24,21,31,0.05)]"
          >
            <Eyebrow>
              {active.category === "Learning Hub" ? "Learning Hub" : `${active.category} pathway`}
            </Eyebrow>
            <h3 className="mt-3 text-[clamp(24px,2.3vw,32px)] font-extrabold leading-[1.15] tracking-[-0.03em] text-mm-ink">
              {active.name}
            </h3>
            <p className="mt-3.5 text-pretty text-[16.5px] leading-[1.6] text-mm-muted">{active.blurb}</p>

            <dl className="mt-7 grid gap-px overflow-hidden rounded-xl border border-mm-line bg-mm-line sm:grid-cols-3">
              <div className="bg-white px-[18px] py-4">
                <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-muted">Year levels</dt>
                <dd className="mt-1.5 text-[15px] font-bold text-mm-ink">
                  Years {active.from}–{active.to}
                  {active.tbc ? ` (${active.tbc})` : ""}
                </dd>
              </div>
              <div className="bg-white px-[18px] py-4">
                <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-muted">Practice mode</dt>
                <dd className="mt-1.5 text-[15px] font-bold text-mm-ink">{active.practice}</dd>
              </div>
              <div className="bg-white px-[18px] py-4">
                <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-muted">Exam simulation</dt>
                <dd className="mt-1.5 text-[15px] font-bold text-mm-ink">{active.exam}</dd>
              </div>
            </dl>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-mm-muted">Subjects</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {active.subjects.map((subject) => (
                <li
                  key={subject}
                  className="rounded-[9px] border border-mm-line bg-mm-page px-3.5 py-[9px] text-sm font-semibold text-mm-ink-soft"
                >
                  {subject}
                </li>
              ))}
            </ul>

            {active.needsRegion && (
              <div className="mt-6 rounded-xl border border-mm-tint-line bg-mm-tint-soft p-[18px]">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">
                  {programmes.regionHeading}
                </p>
                <div role="group" aria-label="State or territory" className="mt-3 flex flex-wrap gap-2">
                  {programmes.regions.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      aria-pressed={region === entry.id}
                      onClick={() => setRegion(entry.id)}
                      className={pillClasses({ selected: region === entry.id, className: "rounded-[9px] px-[15px] text-sm" })}
                    >
                      {entry.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[13.5px] leading-[1.55] text-mm-ink-soft">
                  {programmes.regionIntro}{" "}
                  {region === "other" ? programmes.regionNoteOther : programmes.regionNote}
                </p>
              </div>
            )}

            {!activeCovered && (
              <p className="mt-6 rounded-[10px] border border-mm-alert-line bg-mm-alert px-4 py-3.5 text-sm leading-[1.55] text-mm-ink">
                <strong>Not available for {yearLabel}.</strong> Choose a year level within this programme’s
                coverage, or explore another pathway.
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href={programmes.primaryCta.href} className={mmButton()}>
                {programmes.primaryCta.label}
              </Link>
              <Link href={active.cta.href} className={mmButton({ variant: "outline" })}>
                {active.cta.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
