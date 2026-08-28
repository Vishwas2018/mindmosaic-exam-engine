import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/features/landing/components/Closing";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { ParentCurriculumExplorer } from "@/features/curriculum/parent-explorer";
import { PostgresCurriculumCatalogue } from "@/server/curriculum";
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
 */
async function fetchAllVicCurriculumItems(): Promise<CurriculumCatalogueItem[]> {
  const catalogue = new PostgresCurriculumCatalogue();
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
      <div className="lp-root min-h-screen bg-page text-ink flex flex-col justify-between">
        <SiteNav />
        <main id="main-content" className="site-width py-12">
          <ErrorState
            title="Database not configured"
            description={SUPABASE_NOT_CONFIGURED_MESSAGE}
            action={
              <Link href="/parent" className={buttonClasses({ variant: "secondary" })}>
                Back to dashboard
              </Link>
            }
          />
        </main>
        <SiteFooter />
      </div>
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
    <div className="lp-root min-h-screen bg-page text-ink flex flex-col justify-between">
      <SiteNav />
      <main id="main-content" className="site-width py-6 sm:py-10 flex-1">
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
      </main>
      <SiteFooter />
    </div>
  );
}
