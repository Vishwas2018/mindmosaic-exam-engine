import type { Metadata } from "next";
import Link from "next/link";

import { ParentShell } from "@/features/parent-dashboard";
import { ParentCurriculumExplorer } from "@/features/curriculum/parent-explorer";
import { ChildCurriculumView } from "@/features/parent-dashboard/components/ChildCurriculumView";
import { PostgresCurriculumCatalogue, gatedPracticeCoverageResolver } from "@/server/curriculum";
import type { CurriculumCatalogueItem } from "@/features/curriculum/contracts";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { ErrorState, buttonClasses } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Child Curriculum Explorer | MindMosaic Parents",
  description:
    "Explore the Victorian Curriculum F–10 Version 2.0 (Mathematics and English) for your child's year level.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function fetchAllVicCurriculumItems(): Promise<CurriculumCatalogueItem[]> {
  const catalogue = new PostgresCurriculumCatalogue({
    coverageResolver: gatedPracticeCoverageResolver,
  });
  const allItems: CurriculumCatalogueItem[] = [];
  let cursor: string | undefined = undefined;

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

export default async function ChildCurriculumPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;

  if (!isSupabaseConfigured) {
    return (
      <ParentShell active="/parent/children">
        <ErrorState
          title="Database not configured"
          description={SUPABASE_NOT_CONFIGURED_MESSAGE}
          action={
            <Link href="/parent/children" className={buttonClasses({ variant: "secondary" })}>
              Back to children
            </Link>
          }
        />
      </ParentShell>
    );
  }

  // Load child profile for context header
  const supabase = await createClient();
  const { data: childProfile } = await supabase
    .from("profiles")
    .select("display_name, year_level")
    .eq("id", childId)
    .single();

  const childName = childProfile?.display_name?.trim() || "Aisha";
  const yearLevel = childProfile?.year_level || 3;

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
    <ParentShell active="/parent/children">
      <div className="space-y-8">
        {/* Handoff Artboard Learning View (b20/b22) */}
        <ChildCurriculumView childId={childId} />

        {/* Existing Deep Alignment Explorer with Guaranteed Test Contract */}
        <section aria-labelledby="h-alignment" className="space-y-4 pt-6 border-t border-royal/10">
          <div>
            <h2 id="h-alignment" className="text-xl font-bold text-ink sm:text-2xl">
              {childName}&apos;s Curriculum Alignment
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>Victorian Curriculum F–10 Version 2.0 (Mathematics and English) with verified worked examples.</span>
              <span className="inline-flex items-center rounded-full bg-royal/10 px-2.5 py-0.5 font-bold text-royal">
                Year {yearLevel} Focus
              </span>
            </div>
          </div>

          {fetchError ? (
            <ErrorState
              title="Unable to load curriculum"
              description={fetchError}
              action={
                <Link href="/parent/children" className={buttonClasses({ variant: "secondary" })}>
                  Back to children
                </Link>
              }
            />
          ) : (
            <div className="rounded-2xl border border-royal/10 bg-white p-4 shadow-sm sm:p-6">
              <ParentCurriculumExplorer initialItems={items} />
            </div>
          )}
        </section>
      </div>
    </ParentShell>
  );
}
