import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CheckoutStatusToast, ParentShell } from "@/features/parent-dashboard";
import { AddChildFlow } from "@/features/parent-dashboard/components/AddChildFlow";
import {
  Card,
  PageHeader,
  SectionTitle,
} from "@/features/parent-dashboard/components/parent-ui";
import { loadParentDashboard } from "@/features/parent-dashboard/queries";
import { yearLevelsWithGatedCoverage } from "@/features/taxonomy/coverage";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Welcome | MindMosaic Parents",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** First run for a new parent (Claude Design parent artboards 01–05): add the first child, then their sign-in. */
export default async function ParentSetupPage() {
  if (!isSupabaseConfigured) redirect("/parent");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?role=parent&next=/parent/setup");

  const data = await loadParentDashboard();
  const firstName =
    data.status === "ready" ? data.parentName.split(" ")[0] : "there";
  const hasChildren = data.status === "ready" && data.children.length > 0;

  return (
    <ParentShell active="/parent/children">
      <CheckoutStatusToast />
      <div className="grid gap-6">
        <PageHeader
          title={hasChildren ? "Add a child" : `Welcome, ${firstName}`}
          lead={
            hasChildren
              ? "Each child gets a sign-in of their own."
              : "Your account is ready. One child and you are ready to go."
          }
        />
        <AddChildFlow
          availableYearLevels={yearLevelsWithGatedCoverage()}
          heading={hasChildren ? "Add a child" : "Add your first child"}
          laterHref={hasChildren ? "/parent/children" : "/parent"}
          rail={
            <>
              <section className="rounded-3xl border border-mm-brand/15 bg-mm-tint px-[26px] py-6">
                <SectionTitle>What happens next</SectionTitle>
                <ol className="mt-3 grid gap-1.5 text-[15px] leading-[1.6] text-mm-ink-soft">
                  <li>You add a child and pick their year.</li>
                  <li>We give you a login code and a PIN for them.</li>
                  <li>They sign in and start practising.</li>
                  <li>Their finished papers appear on your Family Overview.</li>
                </ol>
              </section>
              <Card as="section">
                <SectionTitle>About your child&rsquo;s details</SectionTitle>
                <p className="mt-2 text-[15px] leading-[1.6] text-mm-ink-soft">
                  We ask for a first name and a year level, and nothing else. No
                  photo, no date of birth, no school.
                </p>
              </Card>
            </>
          }
        />
      </div>
    </ParentShell>
  );
}
