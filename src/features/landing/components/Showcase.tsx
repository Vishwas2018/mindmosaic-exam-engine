"use client";

import { useState } from "react";

import { MindMosaicLogo } from "@/components/branding";

import { showcase, type ShowcaseScreen } from "../content";
import { SectionHeading } from "./primitives";
import { ShowcaseScreenBody } from "./showcase-screens";

/**
 * Nine illustrative in-app views inside a browser-chrome frame, driven by
 * a horizontal tablist with the arrow-key behaviour the WAI-ARIA tabs
 * pattern expects (roving tabindex, Home/End, wrap-around).
 */
export function Showcase() {
  const [active, setActive] = useState<ShowcaseScreen>("home");
  const activeIndex = showcase.screens.findIndex((screen) => screen.id === active);
  const activeScreen = showcase.screens[activeIndex] ?? showcase.screens[0]!;

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const count = showcase.screens.length;
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % count;
    if (event.key === "ArrowLeft") next = (index - 1 + count) % count;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = count - 1;
    const target = showcase.screens[next]!;
    setActive(target.id);
    document.getElementById(`mm-view-tab-${target.id}`)?.focus();
  }

  const mode = activeScreen.mode;
  const modeChrome =
    mode === "Exam simulation"
      ? "border-mm-ink bg-mm-ink text-white"
      : mode === "Practice"
        ? "border-mm-tint-line bg-mm-tint-soft text-mm-brand"
        : "border-mm-line bg-white text-mm-muted";

  return (
    <section id="showcase" aria-labelledby="showcase-heading" className="bg-mm-page py-[clamp(40px,4vw,64px)]">
      <div className="mm-width">
        <SectionHeading
          id="showcase-heading"
          eyebrow={showcase.eyebrow}
          title={showcase.heading}
          intro={showcase.intro}
          className="mb-[clamp(22px,2.2vw,30px)]"
        />

        <div role="tablist" aria-label="Platform views" className="mb-[18px] flex flex-wrap gap-2">
          {showcase.screens.map((screen, index) => {
            const selected = screen.id === active;
            return (
              <button
                key={screen.id}
                type="button"
                role="tab"
                id={`mm-view-tab-${screen.id}`}
                aria-selected={selected}
                aria-controls="mm-view-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(screen.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={`inline-flex min-h-11 items-center rounded-[10px] border px-[17px] text-sm font-bold tracking-[-0.01em] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page ${
                  selected
                    ? "border-mm-brand bg-mm-brand text-white"
                    : "border-mm-line bg-white text-mm-ink-soft hover:border-mm-brand"
                }`}
              >
                {screen.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id="mm-view-panel"
          aria-labelledby={`mm-view-tab-${activeScreen.id}`}
          tabIndex={-1}
          className="overflow-hidden rounded-[20px] border border-mm-line bg-white shadow-[0_6px_28px_rgba(24,21,31,0.07)]"
        >
          <div className="flex flex-wrap items-center gap-2.5 border-b border-mm-line bg-mm-page px-[18px] py-3">
            <span aria-hidden="true" className="flex gap-1.5">
              {[0, 1, 2].map((dot) => (
                <span key={dot} className="h-[9px] w-[9px] rounded-full bg-[#e0dae6]" />
              ))}
            </span>
            <span className="rounded-[7px] border border-mm-line bg-white px-3 py-[5px] font-mono text-xs text-mm-muted">
              {showcase.host}
              {activeScreen.crumb}
            </span>
            <span className="ml-auto flex items-center gap-2">
              <span className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-muted">
                {activeScreen.role}
              </span>
              <span className={`rounded-md border px-2.5 py-1 text-[11.5px] font-bold ${modeChrome}`}>
                {mode || "Overview"}
              </span>
            </span>
          </div>

          <div className="grid xl:grid-cols-[224px_1fr]">
            <nav
              aria-label="Illustrative app navigation"
              className="hidden content-start gap-6 bg-mm-tint px-4 py-[22px] xl:grid"
            >
              {/* The illustrative app chrome shows the real lockup, not a
                  typed-out uppercase "MINDMOSAIC" — the mock is the only
                  place the brand appeared as plain text. */}
              <MindMosaicLogo size="sm" className="px-3" />
              <div className="grid gap-[3px]">
                {showcase.sidebar.map((item, index) => (
                  <span
                    key={item}
                    className={`rounded-lg px-3 py-2.5 text-[13.5px] font-semibold ${
                      index === activeScreen.navIndex ? "bg-mm-brand text-white" : "text-mm-ink-soft"
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2.5 border-t border-mm-tint-line pt-[18px]">
                <span
                  aria-hidden="true"
                  className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-mm-brand text-xs font-extrabold text-white"
                >
                  MA
                </span>
                <span className="grid">
                  <span className="text-[13px] font-bold text-mm-ink">Mia A.</span>
                  <span className="text-[11.5px] text-mm-muted">Year 5 · illustrative</span>
                </span>
              </div>
            </nav>

            <div className="min-h-[clamp(440px,42vw,580px)] bg-white p-[clamp(20px,2.4vw,34px)]">
              <ShowcaseScreenBody screen={activeScreen.id} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
