import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ParentShell } from "@/features/parent-dashboard";
import { ParentCurriculumExplorer } from "@/features/curriculum/parent-explorer";
import { PostgresCurriculumCatalogue, gatedPracticeCoverageResolver } from "@/server/curriculum";
import type { CurriculumCatalogueItem } from "@/features/curriculum/contracts";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { ErrorState, buttonClasses } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";



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

export async function LegacyChildCurriculumPage({
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

  const childName = childProfile?.display_name?.trim() || "Your Child";

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
      <div className="space-y-6">
        <div>
          <Link
            href="/parent/children"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted transition hover:text-royal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Children
          </Link>
          <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">
                {childName}&apos;s Curriculum Alignment
              </h1>
              <p className="mt-1 text-sm text-muted">
                Victorian Curriculum F–10 Version 2.0 (Mathematics and English) with verified worked examples.
              </p>
            </div>
            {childProfile?.year_level && (
              <span className="inline-flex items-center rounded-full bg-royal/10 px-3 py-1 text-xs font-extrabold text-royal">
                Year {childProfile.year_level} Focus
              </span>
            )}
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
      </div>
    </ParentShell>
  );
}
