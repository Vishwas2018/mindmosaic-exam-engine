"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button, EmptyState, buttonClasses } from "@/components/ui";

/**
 * Shown when a filter combination matches nothing. Offers both ways out the
 * spec calls for: clear the filters in place, or leave for the unfiltered
 * catalogue — the second is a real link so it works with JavaScript off and
 * can be opened in a new tab.
 */
export function CatalogueEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      title="No practice programs match these filters."
      description="Try a different grade, subject or assessment style — or clear the filters to see everything available."
      icon={<SearchX aria-hidden="true" className="h-6 w-6" />}
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={onClearFilters} data-testid="empty-clear-filters">
            Clear filters
          </Button>
          <Link href="/practice" className={buttonClasses({ variant: "secondary" })}>
            View all programs
          </Link>
        </div>
      }
    />
  );
}
