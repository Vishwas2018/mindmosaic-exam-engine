import type { Metadata } from "next";
import Link from "next/link";
import { ParentShell } from "@/features/parent-dashboard";
import { ParentCurriculumExplorer } from "@/features/curriculum/parent-explorer";
import { PostgresCurriculumCatalogue, gatedPracticeCoverageResolver } from "@/server/curriculum";
import type { CurriculumCatalogueItem } from "@/features/curriculum/contracts";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { ErrorState, buttonClasses } from "@/components/ui";

export const metadata: Metadata = {
  title: "Victorian Curriculum Explorer | MindMosaic Parents",
  description:
    "Explore the Victorian Curriculum F–10 Version 2.0 (Mathematics and English) for Level 3 and Level 5 in plain English, with practical home learning activities.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Server-rendered Parent Curriculum Explorer.
 * Connects exclusively through the server-only PostgresCurriculumCatalogue adapter,
 * ensuring no database credentials or authoritative tables leak to the client.
 *
 * Uses the gatedPracticeCoverageResolver to align parent practice-coverage badges
 * with the exact governed, published question universe.
 */
async function fetchAllVicCurriculumItems(): Promise<CurriculumCatalogueItem[]> {
  const catalogue = new PostgresCurriculumCatalogue({
    coverageResolver: gatedPracticeCoverageResolver,
  });
  const allItems: CurriculumCatalogueItem[] = [];
  let cursor: string | undefined = undefined;

  // Retrieve all pages (up to 100 per page)
  do {
    const page = await catalogue.query({
      jurisdictionCode: "VIC",
      schoolSector: "government",
      pageSize: 100,
      cursor,
    });
    allItems.push(...page.items);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return allItems;
}

export default async function ParentCurriculumExplorerPage() {
  if (!isSupabaseConfigured) {
    return (
      <ParentShell active="/parent/curriculum-explorer">
          <ErrorState
            title="Database not configured"
            description={SUPABASE_NOT_CONFIGURED_MESSAGE}
            action={
              <Link href="/parent" className={buttonClasses({ variant: "secondary" })}>
                Back to dashboard
              </Link>
            }
          />
      </ParentShell>
    );
  }

  let items: CurriculumCatalogueItem[] = [];
  let fetchError: string | null = null;

  try {
    items = await fetchAllVicCurriculumItems();
  } catch (err) {
    console.error("Failed to fetch curriculum items from catalogue:", err);
    fetchError =
      "We were unable to load the Victorian curriculum catalogue at this time. Please refresh to try again.";
  }

  return (
    <ParentShell active="/parent/curriculum-explorer">
        {fetchError ? (
          <ErrorState
            title="Unable to load curriculum"
            description={fetchError}
            action={
              <Link href="/parent" className={buttonClasses({ variant: "secondary" })}>
                Back to dashboard
              </Link>
            }
          />
        ) : (
          <ParentCurriculumExplorer initialItems={items} />
        )}
    </ParentShell>
  );
}
