import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  ParentBillingHandoff,
  ParentShell,
  PREVIEW_PARENT_ACCOUNT,
} from "@/features/parent-dashboard";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { FAMILY_PLAN } from "@/lib/billing/prices";
import { getMySubscription } from "@/lib/billing/subscription";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Plan & Billing | MindMosaic Parents",
  description: "Manage membership, child places, cards and payment invoices.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ParentAccountBillingPage() {
  // Local loopback preview demonstration mode
  if (!isSupabaseConfigured) {
    if (await isParentPreviewEnabled()) {
      return (
        <ParentShell active="/parent/account">
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs font-medium text-amber-900">
              <strong className="font-bold">Preview Demonstration:</strong> Showing sample billing membership for Priya Raman. No live database connection is active.
            </div>
            <ParentBillingHandoff
              membership={{
                planName: PREVIEW_PARENT_ACCOUNT.planName,
                planPrice: `${PREVIEW_PARENT_ACCOUNT.planPrice.replace("a month", "per month")}`,
                seatsCovered: `Up to ${PREVIEW_PARENT_ACCOUNT.placesTotal} · ${PREVIEW_PARENT_ACCOUNT.placesUsed} in use`,
                nextPayment: `${PREVIEW_PARENT_ACCOUNT.planPrice.split(" ")[0]} on ${PREVIEW_PARENT_ACCOUNT.nextPaymentDate}`,
                cardBrand: PREVIEW_PARENT_ACCOUNT.cardBrand,
                cardLast4: PREVIEW_PARENT_ACCOUNT.cardLast4,
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

  // Load linked children count
  const { data: childrenLinks } = await supabase
    .from("parent_children")
    .select("child_id")
    .eq("parent_id", user.id);

  const placesUsed = (childrenLinks ?? []).length;

  // Load subscription details
  const subResult = await getMySubscription();
  const sub = subResult.status === "ready" ? subResult.subscription : null;

  /* Same rule as /parent/account: figures come from the subscription row and the one price list, and a family with no
     paid plan is shown as being on the free beta rather than given a price, a renewal or a seat allowance. */
  const paidPlan = sub?.plan ? (sub.plan === "family_annual" ? FAMILY_PLAN.annual : FAMILY_PLAN.monthly) : null;
  const planName = paidPlan ? (sub?.plan === "family_annual" ? "Family Annual" : "Family") : "Free family beta";
  const planPrice = paidPlan
    ? `${paidPlan.display} ${paidPlan.plan === "family_annual" ? "per year" : "per month"}`
    : "no payment needed";

  const nextPayment =
    paidPlan && sub?.currentPeriodEnd
      ? `${paidPlan.display} on ${new Date(sub.currentPeriodEnd).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`
      : "None scheduled";

  const seatsCovered = paidPlan && sub ? `Up to ${sub.seats} · ${placesUsed} in use` : `${placesUsed} linked`;

  return (
    <ParentShell active="/parent/account">
      <ParentBillingHandoff
        membership={{
          planName,
          planPrice,
          seatsCovered,
          nextPayment,
          cardBrand: paidPlan ? "Managed in the Stripe billing portal" : "No card on file",
          cardLast4: "",
        }}
        isLocalPreview={false}
      />
    </ParentShell>
  );
}
