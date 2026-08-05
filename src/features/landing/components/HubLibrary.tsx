"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { clsx } from "clsx";

import { hub } from "../content";
import { EmptySlot, Eyebrow, MmCard, mmButton, pillClasses } from "./primitives";

/**
 * The Learning Hub library — design handoff screen 4. Search field, seven
 * category tabs and the article grid they filter, all client-side over the
 * static list in ../content.ts (as the design's own logic class does).
 *
 * Two departures from the design file:
 *
 *  - Search filters as well as the tabs. The design draws the field but
 *    never wires it; a search box that does nothing is worse than none.
 *  - No "Load more articles" button. The whole library is nine entries and
 *    they are all on the page — a button that loads nothing is the same
 *    problem as the search field.
 */
export function HubLibrary() {
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const searchId = useId();

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

  return (
    <>
      {/* ---------- Header + search ---------- */}
      <section className="bg-mm-page pb-[clamp(24px,2.5vw,34px)] pt-[clamp(36px,3.5vw,56px)]">
        <div className="mm-width grid items-end gap-[clamp(24px,3vw,48px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)]">
          <div className="max-w-[640px]">
            <Eyebrow rule className="mb-[18px]">
              {hub.eyebrow}
            </Eyebrow>
            <h1 className="text-[clamp(34px,4.2vw,56px)] font-bold leading-[1.06] tracking-[-0.04em] text-mm-ink">
              {hub.heading}
            </h1>
            <p className="mt-[18px] text-pretty text-lg leading-[1.6] text-mm-muted">{hub.intro}</p>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor={searchId}
              className="text-xs font-bold uppercase tracking-[0.1em] text-mm-muted"
            >
              {hub.searchLabel}
            </label>
            <div className="flex h-[52px] items-center gap-2.5 rounded-xl border border-mm-line bg-white px-4 focus-within:border-mm-brand">
              <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-mm-brand" />
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder={hub.searchPlaceholder}
                className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-mm-ink outline-none placeholder:text-mm-muted-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Category tabs ---------- */}
      <section className="bg-mm-page pb-[clamp(28px,2.8vw,40px)]">
        <div className="mm-width">
          <div
            role="tablist"
            aria-label="Hub categories"
            className="flex flex-wrap gap-2 border-b border-mm-line pb-4"
          >
            {hub.categories.map((label) => (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={label === category}
                onClick={() => setCategory(label)}
                className={pillClasses({
                  selected: label === category,
                  className: "min-h-10 rounded-[9px] px-4 text-[14.5px] font-semibold",
                })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Featured + grid ---------- */}
      <section className="bg-mm-page pb-[clamp(40px,4vw,64px)]">
        <div className="mm-width">
          <MmCard className="mb-[clamp(20px,2vw,28px)] grid overflow-hidden rounded-[20px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="grid content-center gap-3.5 p-[clamp(24px,2.6vw,40px)]">
              <p className="font-mono text-[11.5px] uppercase tracking-[0.06em] text-mm-coral-text">
                {hub.featured.kicker}
              </p>
              <h2 className="text-[clamp(24px,2.4vw,32px)] font-bold leading-[1.15] text-mm-ink">
                {hub.featured.title}
              </h2>
              <p className="text-[15.5px] leading-[1.6] text-mm-muted">{hub.featured.body}</p>
              <p className="flex flex-wrap items-center gap-3.5 text-[13.5px] text-mm-muted">
                {hub.featured.meta.map((item, index) => (
                  <span key={item} className="flex items-center gap-3.5">
                    {index > 0 && <span aria-hidden="true">·</span>}
                    {item}
                  </span>
                ))}
              </p>
              <Link
                href={hub.featured.cta.href}
                className={mmButton({ className: "mt-1 w-fit" })}
              >
                {hub.featured.cta.label}
              </Link>
            </div>
            <div className="relative min-h-[280px] bg-mm-tint">
              <EmptySlot label={hub.featured.slot} />
            </div>
          </MmCard>

          <p className="mb-[clamp(16px,1.8vw,24px)] max-w-[720px] rounded-xl border border-mm-tint-line bg-mm-tint px-4 py-3 text-sm leading-[1.55] text-mm-ink-soft">
            {hub.statusNote}
          </p>

          {visible.length === 0 ? (
            <MmCard className="p-[clamp(24px,2.6vw,40px)] text-center">
              <h3 className="text-xl font-bold text-mm-ink">{hub.emptyState.title}</h3>
              <p className="mx-auto mt-2 max-w-[46ch] text-[15px] leading-[1.6] text-mm-muted">
                {hub.emptyState.body}
              </p>
            </MmCard>
          ) : (
            <>
              {/* Announced so a filter change is perceivable without sight. */}
              <p aria-live="polite" className="sr-only">
                {visible.length} guide{visible.length === 1 ? "" : "s"} shown
              </p>
              <ul className="grid gap-[clamp(16px,1.8vw,24px)] sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((article) => (
                  <li key={article.id}>
                    <MmCard className="grid h-full grid-rows-[auto_1fr] overflow-hidden">
                      <div className="relative aspect-video border-b border-mm-line bg-mm-tint">
                        <EmptySlot label={article.slot} />
                      </div>
                      <div className="grid content-start gap-2.5 p-5">
                        <p
                          className={clsx(
                            "font-mono text-[11px] uppercase tracking-[0.06em]",
                            /* The design alternates purple and coral by
                               category. Coral is used as a label colour
                               only at 11px+ bold, where #D8323A carries
                               the contrast — never #FF555A on paper. */
                            article.category === "English" ||
                              article.category === "Singapore Maths" ||
                              article.category === "Study habits"
                              ? "text-mm-coral-text"
                              : "text-mm-brand",
                          )}
                        >
                          {article.category}
                        </p>
                        <h3 className="text-[17.5px] font-bold leading-[1.3] text-mm-ink">
                          {article.title}
                        </h3>
                        <p className="text-[14.5px] leading-[1.55] text-mm-muted">{article.body}</p>
                        <p className="mt-1 flex flex-wrap gap-3 text-[13px] text-mm-muted">
                          <span>{article.audience}</span>
                          <span aria-hidden="true">·</span>
                          <span>{article.length}</span>
                        </p>
                      </div>
                    </MmCard>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </>
  );
}
