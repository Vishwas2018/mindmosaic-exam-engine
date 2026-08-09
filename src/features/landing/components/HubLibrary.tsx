"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Info, Search } from "lucide-react";

import { hub } from "../content";
import { HubGuideCard } from "./HubGuideCard";
import { HubHeroVisual } from "./HubHeroVisual";
import { HubMedia } from "./HubMedia";
import { Eyebrow, MmCard, pillClasses } from "./primitives";

const PANEL_ID = "hub-guides";
const TAB_ID = (label: string) => `hub-tab-${label.toLowerCase().replace(/\s+/g, "-")}`;

/** Half the card on desktop, the full width once the panel stacks. */
const FEATURED_SIZES = "(max-width: 1024px) 100vw, 48vw";

/**
 * The Learning Hub library — design handoff screen 4, rebuilt around the
 * guide photography.
 *
 * Two departures from the design file, both older than this pass and both
 * kept:
 *
 *  - Search filters as well as the tabs. The design draws the field but
 *    never wires it; a search box that does nothing is worse than none.
 *  - No "Load more articles" button. The whole library is nine entries and
 *    they are all on the page — a button that loads nothing is the same
 *    problem as the search field.
 *
 * What changed here is the composition, not the behaviour. The header was a
 * wide column of type with the search field parked on its own baseline at
 * the far right, and every one of the ten pictures on the page was an
 * identical lavender panel printing its art direction in monospace. The
 * header is now a real two-column module — type and controls against search
 * and an indexed-guide mark — and each picture is either its guide's
 * photograph or its category's plate.
 *
 * The category controls sit in that header rather than above the grid.
 * That is where a reader looks for them on a library page, and it lets the
 * count beside them ("9 guides") carry the feedback the old separated row
 * had to imply.
 */
export function HubLibrary() {
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const searchId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return hub.articles.filter((article) => {
      if (category !== "All" && article.category !== category) return false;
      if (!needle) return true;
      return (
        article.title.toLowerCase().includes(needle) ||
        article.body.toLowerCase().includes(needle) ||
        article.category.toLowerCase().includes(needle)
      );
    });
  }, [category, query]);

  /*
   * Roving tabindex + arrow keys, which the tablist previously did not
   * have: every tab was in the tab order, so reaching the grid from the
   * heading meant seven presses, and Left/Right did nothing in a widget
   * whose role promises they will.
   */
  const onTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const count = hub.categories.length;
      let next = index;
      if (event.key === "ArrowRight") next = (index + 1) % count;
      else if (event.key === "ArrowLeft") next = (index - 1 + count) % count;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = count - 1;
      else return;

      event.preventDefault();
      const label = hub.categories[next];
      if (!label) return;
      setCategory(label);
      tabRefs.current[next]?.focus();
    },
    [],
  );

  return (
    <>
      {/* ---------- Header: type + controls / search + mark ---------- */}
      <section className="bg-mm-page pb-[clamp(40px,4.6vw,72px)] pt-[clamp(30px,3.4vw,52px)]">
        {/*
          Three children, two columns, two rows. Stacked, that reads
          heading -> search -> categories, which is the order the controls
          are reached in: search is the way into a library you already know
          the shape of, browsing is the way in when you do not. Splitting the
          left column into two grid rows is what lets the search module take
          the full height of the second column at lg without the category
          controls having to travel with it.
        */}
        <div className="mm-width grid items-start gap-x-[clamp(28px,3.4vw,56px)] gap-y-[clamp(24px,2.6vw,34px)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="max-w-[640px] lg:col-start-1 lg:row-start-1">
            <Eyebrow rule className="mb-[18px]">
              {hub.eyebrow}
            </Eyebrow>
            <h1 className="text-[clamp(32px,3.6vw,46px)] font-bold leading-[1.08] tracking-[-0.035em] text-mm-ink">
              {hub.heading}
            </h1>
            <p className="mt-[18px] max-w-[58ch] text-pretty text-[17px] leading-[1.6] text-mm-muted">
              {hub.intro}
            </p>
          </div>

          <div className="grid content-start gap-[clamp(18px,2vw,26px)] lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="grid gap-2.5">
              <label
                htmlFor={searchId}
                className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-muted"
              >
                {hub.searchLabel}
              </label>
              <div className="flex h-[54px] items-center gap-3 rounded-xl border border-mm-line bg-white px-4 transition-[border-color,box-shadow] duration-200 focus-within:border-mm-brand focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--mm-brand)_18%,transparent)]">
                <Search aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-mm-brand" />
                <input
                  id={searchId}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  placeholder={hub.searchPlaceholder}
                  className="min-w-0 flex-1 border-none bg-transparent text-[15.5px] text-mm-ink outline-none placeholder:text-mm-muted-2"
                />
              </div>
            </div>

            {/* The mark is the module's lower half on desktop and is dropped
                entirely below lg, where the column becomes a full-width
                search field and an ornament under it would only push the
                library further down the page. */}
            <div className="hidden items-center justify-center rounded-[20px] border border-mm-tint-line bg-mm-tint p-[clamp(16px,1.8vw,26px)] lg:flex">
              <HubHeroVisual className="h-auto w-full max-w-[430px]" />
            </div>
          </div>

          <div className="lg:col-start-1 lg:row-start-2 lg:max-w-[640px]">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span
                  id="hub-tabs-label"
                  className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-muted"
                >
                  Browse by category
                </span>
                {/*
                  Visible and announced from the same element. The count used
                  to exist twice over: once as an sr-only live region beside
                  the grid, and nowhere at all on screen, so a sighted reader
                  pressing a category had no confirmation beyond the grid
                  reflowing several hundred pixels further down.
                */}
                <span
                  aria-live="polite"
                  className="text-[13px] font-semibold text-mm-muted"
                  data-testid="hub-result-count"
                >
                  {visible.length} guide{visible.length === 1 ? "" : "s"}
                </span>
              </div>

              <div
                role="tablist"
                aria-labelledby="hub-tabs-label"
                className="flex flex-wrap gap-2"
              >
                {hub.categories.map((label, index) => {
                  const selected = label === category;
                  return (
                    <button
                      key={label}
                      ref={(node) => {
                        tabRefs.current[index] = node;
                      }}
                      type="button"
                      role="tab"
                      id={TAB_ID(label)}
                      aria-selected={selected}
                      aria-controls={PANEL_ID}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setCategory(label)}
                      onKeyDown={(event) => onTabKeyDown(event, index)}
                      className={pillClasses({
                        selected,
                        className: "px-[15px] text-[14px]",
                      })}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
          </div>
        </div>
      </section>

      {/* ---------- Featured guide, notice, library ---------- */}
      <section className="bg-mm-page pb-[clamp(56px,6vw,92px)]">
        <div className="mm-width">
          <h2 className="sr-only">Featured guide</h2>

          <Link
            href={hub.featured.cta.href}
            className="group block rounded-[20px] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
          >
            <MmCard className="grid overflow-hidden rounded-[20px] shadow-[0_1px_2px_rgba(24,21,31,0.05)] transition duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-mm-brand/40 group-hover:shadow-[0_18px_44px_rgba(24,21,31,0.11)] motion-reduce:transform-none motion-reduce:transition-none lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
              <div className="grid content-center gap-3.5 p-[clamp(24px,2.8vw,44px)]">
                <p className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-ember-ink">
                  <span
                    aria-hidden="true"
                    className="h-[3px] w-[22px] shrink-0 rounded-sm bg-mm-ember"
                  />
                  {hub.featured.kicker}
                </p>
                <h3 className="text-[clamp(24px,2.4vw,33px)] font-bold leading-[1.15] tracking-[-0.025em] text-mm-ink">
                  {hub.featured.title}
                </h3>
                <p className="max-w-[52ch] text-[15.5px] leading-[1.6] text-mm-muted">
                  {hub.featured.body}
                </p>
                <p className="flex flex-wrap items-center gap-2.5 text-[13.5px] font-medium text-mm-muted">
                  {hub.featured.meta.map((item, index) => (
                    <span key={item} className="flex items-center gap-2.5">
                      {index > 0 && (
                        <span aria-hidden="true" className="text-mm-lilac">
                          ·
                        </span>
                      )}
                      {item}
                    </span>
                  ))}
                </p>
                {/* Styled as the card's action but deliberately a <span>: the
                    whole card is the link, and a button inside an anchor is
                    invalid HTML and two controls for one destination. */}
                <span className="mt-2 inline-flex w-fit items-center gap-2 rounded-xl bg-mm-brand px-5 py-3.5 text-[15.5px] font-bold leading-none text-white shadow-[0_2px_8px_rgba(89,37,168,0.22)] transition-colors duration-200 group-hover:bg-mm-brand-deep">
                  {hub.featured.cta.label}
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
                  />
                </span>
              </div>

              {/* Flush to the card's right edge on desktop, and a 16:10 band
                  under the copy once it stacks — the guide announces itself
                  in words first on a phone, then shows what it is about. */}
              <HubMedia
                media={hub.featured.media}
                category="For parents"
                sizes={FEATURED_SIZES}
                priority
                objectPosition="52% 46%"
                className="aspect-16/10 w-full border-t border-mm-line lg:aspect-auto lg:min-h-[340px] lg:border-t-0 lg:border-l"
                markClassName="h-12 w-12"
              />
            </MmCard>
          </Link>

          <p className="mt-[clamp(20px,2.2vw,30px)] flex max-w-[760px] items-start gap-3 rounded-[14px] border border-mm-tint-line bg-mm-tint-soft px-4 py-3.5 text-[14.5px] leading-[1.55] text-mm-ink-soft">
            <Info
              aria-hidden="true"
              className="mt-px h-[18px] w-[18px] shrink-0 text-mm-brand"
            />
            {hub.statusNote}
          </p>

          <div
            id={PANEL_ID}
            role="tabpanel"
            aria-labelledby={TAB_ID(category)}
            tabIndex={0}
            className="mt-[clamp(28px,3.2vw,48px)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-mm-brand"
          >
            <h2 className="sr-only">Guides</h2>

            {visible.length === 0 ? (
              <MmCard className="p-[clamp(28px,3vw,48px)] text-center">
                <h3 className="text-xl font-bold text-mm-ink">{hub.emptyState.title}</h3>
                <p className="mx-auto mt-2.5 max-w-[46ch] text-[15px] leading-[1.6] text-mm-muted">
                  {hub.emptyState.body}
                </p>
              </MmCard>
            ) : (
              <ul className="grid gap-[clamp(16px,1.8vw,24px)] sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((article) => (
                  <li key={article.id}>
                    <HubGuideCard article={article} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
