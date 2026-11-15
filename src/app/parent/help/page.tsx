import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  ParentHelpCentre,
  ParentShell,
  PREVIEW_HELP_ARTICLES,
  PREVIEW_HELP_CATEGORIES,
} from "@/features/parent-dashboard";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Help Centre | MindMosaic Parents",
  description: "Answers to the things parents ask most, and a way to reach a person.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ParentHelpPage() {
  // Local loopback preview demonstration mode
  if (!isSupabaseConfigured) {
    if (await isParentPreviewEnabled()) {
      return (
        <ParentShell active="/parent/account">
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs font-medium text-amber-900">
              <strong className="font-bold">Preview Demonstration:</strong> Showing Parent Help Centre with illustrative sample family. No live database connection is active.
            </div>
            <ParentHelpCentre
              categories={PREVIEW_HELP_CATEGORIES}
              articles={PREVIEW_HELP_ARTICLES}
              childrenList={[
                { id: "child-aisha", name: "Aisha", yearLevel: 3 },
                { id: "child-kiran", name: "Kiran", yearLevel: 5 },
              ]}
              userEmail="priya.raman@example.com"
              isLocalPreview={true}
            />
          </div>
        </ParentShell>
      );
    }

    return (
      <ParentShell active="/parent/account">
        <div className="p-8 text-center text-muted">
          <p className="font-bold text-ink">Database Not Configured</p>
          <p className="mt-2 text-sm">{SUPABASE_NOT_CONFIGURED_MESSAGE}</p>
        </div>
      </ParentShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/parent/help");
  }

  /* The signed-in parent's linked children, through the same parent_children link and profiles RLS as the
     dashboard, so the support message can name the child it is about. */
  const { data: links } = await supabase.from("parent_children").select("child_id").eq("parent_id", user.id);
  const childIds = (links ?? []).map((link) => link.child_id as string);
  const { data: profiles } = childIds.length
    ? await supabase.from("profiles").select("id, display_name, year_level").in("id", childIds)
    : { data: [] as { id: string; display_name: string | null; year_level: number | null }[] };
  const childrenList = (profiles ?? []).map((profile) => ({
    id: profile.id as string,
    name: (profile.display_name as string | null) ?? "Your child",
    yearLevel: (profile.year_level as number | null) ?? null,
  }));

  return (
    <ParentShell active="/parent/account">
      <ParentHelpCentre
        categories={PREVIEW_HELP_CATEGORIES}
        articles={PREVIEW_HELP_ARTICLES}
        childrenList={childrenList}
        userEmail={user.email ?? "guardian@mindmosaic.app"}
        isLocalPreview={false}
      />
    </ParentShell>
  );
}
