import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  ParentAccount,
  ParentShell,
  PREVIEW_PARENT_ACCOUNT,
} from "@/features/parent-dashboard";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { FAMILY_PLAN } from "@/lib/billing/prices";
import { getMySubscription } from "@/lib/billing/subscription";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account | MindMosaic Parents",
  description: "Your details, what we email you, your plan and your data.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ParentAccountPage() {
  // Local loopback preview demonstration mode
  if (!isSupabaseConfigured) {
    if (await isParentPreviewEnabled()) {
      return (
        <ParentShell active="/parent/account">
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs font-medium text-amber-900">
              <strong className="font-bold">Preview Demonstration:</strong> Showing sample account and preferences for Priya Raman. No live database connection is active.
            </div>
            <ParentAccount
              initialAccount={{
                name: PREVIEW_PARENT_ACCOUNT.name,
                email: PREVIEW_PARENT_ACCOUNT.email,
                passwordLastChanged: PREVIEW_PARENT_ACCOUNT.passwordLastChanged,
                devicesCount: PREVIEW_PARENT_ACCOUNT.devicesCount,
                planName: PREVIEW_PARENT_ACCOUNT.planName,
                planPrice: PREVIEW_PARENT_ACCOUNT.planPrice,
                nextPaymentDate: PREVIEW_PARENT_ACCOUNT.nextPaymentDate,
                placesUsed: PREVIEW_PARENT_ACCOUNT.placesUsed,
                placesTotal: PREVIEW_PARENT_ACCOUNT.placesTotal,
              }}
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

  // Authenticated Production/Dev Mode with Supabase
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Load parent profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  // Load linked children count
  const { data: childrenLinks } = await supabase
    .from("parent_children")
    .select("child_id")
    .eq("parent_id", user.id);

  const placesUsed = (childrenLinks ?? []).length;

  // Load subscription details
  const subResult = await getMySubscription();
  const sub = subResult.status === "ready" ? subResult.subscription : null;

  const userMeta = user.user_metadata as { display_name?: string; full_name?: string } | undefined;
  const parentName =
    profile?.display_name ||
    userMeta?.display_name ||
    userMeta?.full_name ||
    "Parent";

  /* Plan details come from the subscription row and the one price list (src/lib/billing/prices.ts). A family with no
     paid plan is on the free beta: no price, no renewal date and no seat count are shown for it. */
  const paidPlan = sub?.plan ? (sub.plan === "family_annual" ? FAMILY_PLAN.annual : FAMILY_PLAN.monthly) : null;
  const planName = paidPlan ? (sub?.plan === "family_annual" ? "Family Annual" : "Family") : "Free family beta";
  const planPrice = paidPlan
    ? `${paidPlan.display} ${paidPlan.plan === "family_annual" ? "a year" : "a month"}`
    : "no payment needed";

  const nextPaymentDate =
    paidPlan && sub?.currentPeriodEnd
      ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : undefined;

  return (
    <ParentShell active="/parent/account">
      <ParentAccount
        initialAccount={{
          name: parentName,
          email: user.email ?? "",
          planName,
          planPrice,
          nextPaymentDate,
          placesUsed,
          placesTotal: paidPlan ? sub?.seats : undefined,
        }}
        isLocalPreview={false}
      />
    </ParentShell>
  );
}
