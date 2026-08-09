"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";

import { catalogueButton } from "./controls";

/**
 * Shown when a filter combination matches nothing. Offers both ways out the
 * spec calls for: clear the filters in place, or leave for the unfiltered
 * catalogue — the second is a real link so it works with JavaScript off and
 * can be opened in a new tab.
 */
export function CatalogueEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="rounded-[20px] border border-dashed border-mm-tint-line bg-mm-tint-soft px-6 py-[clamp(36px,5vw,64px)] text-center">
      <span
        aria-hidden="true"
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-mm-brand ring-1 ring-mm-tint-line"
      >
        <SearchX className="h-5 w-5" />
      </span>
      <p className="mx-auto mt-5 max-w-[42ch] text-[19px] font-bold leading-[1.3] text-mm-ink">
        No practice programs match these filters.
      </p>
      <p className="mx-auto mt-2.5 max-w-[52ch] text-[15px] leading-[1.6] text-mm-muted">
        Try a different grade, subject or assessment style — or clear the filters to see
        everything available.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onClearFilters}
          data-testid="empty-clear-filters"
          className={catalogueButton()}
        >
          Clear filters
        </button>
        <Link href="/practice" className={catalogueButton({ variant: "outline" })}>
          View all programs
        </Link>
      </div>
    </div>
  );
}
