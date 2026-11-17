import type { Metadata } from "next";
import Link from "next/link";

import { Home, Lock, ReceiptText, RotateCcw } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { Badge } from "@/components/ui";
import { AuthNav } from "@/features/auth/components/AuthNav";
import { RoleHomeLink } from "@/features/auth/components/RoleHomeLink";
import {
  InvoiceHistoryCard,
  PaymentMethodCard,
  PlanComparisonTable,
  PricingPlans,
  SubscriptionOverviewCard,
} from "@/features/billing";
import { getMySubscription } from "@/lib/billing/subscription";
import { isProfileRole } from "@/features/auth/roles";
import { purchasablePlans } from "@/lib/stripe/config";
import { ParentShell } from "@/features/parent-dashboard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Billing",
  description: "Subscribe to or manage the MindMosaic Family plan.",
};

/*
 * A signed-in parent's subscription is per-user data behind auth cookies —
 * same reasoning as src/app/parent/page.tsx's own force-dynamic.
 */
export const dynamic = "force-dynamic";

/** The signed-in user's role, or null for guests / unconfigured / unreadable. */
async function getViewerRole() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return isProfileRole(profile?.role) ? profile.role : null;
}

function Frame({
  isParent,
  children,
}: {
  isParent: boolean;
  children: React.ReactNode;
}) {
  return isParent ? (
    <ParentShell active="/billing">{children}</ParentShell>
  ) : (
    <Shell>{children}</Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-royal/8 bg-white">
        <div className="site-width flex min-h-20 items-center justify-between gap-4 py-3">
          <Link
            href="/"
            aria-label="MindMosaic home"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <MindMosaicLogo />
          </Link>
          {/*
            This page is shared by guests, students and parents, so its
            header can't be the parent shell. That left a parent who
            navigated here with no way back to /parent except the logo,
            which goes to the marketing site instead. RoleHomeLink supplies
            the right destination per role and renders nothing for guests.
          */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-muted transition hover:bg-royal/5 hover:text-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Back to site</span>
            </Link>
            <RoleHomeLink />
            <Badge variant="purple" className="hidden sm:inline-flex">
              Billing
            </Badge>
            <AuthNav />
          </div>
        </div>
      </header>
      <main id="main-content" className="site-width py-10 sm:py-16">
        {children}
      </main>
    </div>
  );
}

function PageHero({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-mm-line bg-[linear-gradient(135deg,#ffffff_0%,#f6f0fd_55%,#ffe9ea_120%)] px-6 py-12 text-center shadow-[0_24px_60px_-30px_rgba(89,37,168,0.35)] sm:px-12 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(155,114,206,0.35),transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,85,90,0.22),transparent_65%)]"
      />
      <div className="relative mx-auto max-w-2xl">
        <p className="inline-flex rounded-full border border-mm-brand/15 bg-white/80 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-mm-brand">
          {eyebrow}
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-[-0.035em] text-mm-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-mm-muted sm:text-lg">
          {body}
        </p>
      </div>
    </div>
  );
}

const ASSURANCES = [
  {
    icon: RotateCcw,
    title: "Cancel any time",
    body: "Stop or resume from this page, no phone calls.",
  },
  {
    icon: Lock,
    title: "Secure payments",
    body: "Card details go straight to Stripe. We never see or store them.",
  },
  {
    icon: ReceiptText,
    title: "Clear pricing",
    body: "GST-inclusive AUD, with invoices kept here.",
  },
] as const;

function AssuranceStrip() {
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {ASSURANCES.map(({ icon: Icon, title, body }) => (
        <li
          key={title}
          className="flex gap-4 rounded-2xl border border-mm-line bg-white/70 p-5"
        >
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--mm-brand-deep),var(--mm-brand))] text-white"
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-mm-ink">{title}</p>
            <p className="mt-1 text-sm leading-6 text-mm-muted">{body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Reachable by anyone, signed in or not — guests must always be able to
 * keep practising for free (docs/PRIVACY_AND_BILLING_GUARDRAILS.md), so
 * this page never gates practice, it only offers an upgrade or, for a
 * signed-in parent with a subscription row already, full account
 * management (current status, payment method, invoices, cancel/undo).
 *
 * getMySubscription() returns `{ status: "error" }` for both "not signed
 * in" and "something went wrong" — there's no way to tell those apart from
 * here, so either one falls back to the marketing/subscribe view, same as
 * this page's behaviour before this batch.
 */
export default async function BillingPage() {
  const result = isSupabaseConfigured
    ? await getMySubscription()
    : { status: "error" as const };
  const subscription = result.status === "ready" ? result.subscription : null;
  /* A parent gets the full parent header (Dashboard / Children / Curriculum /
     Writing / Billing + account menu) so Billing is not a navigation dead end.
     Guests and students keep the generic billing header. */
  const role = await getViewerRole();
  const isParent = role === "parent";
  const purchasable = purchasablePlans();
  const availability = {
    individual: purchasable.individual
      ? ("purchasable" as const)
      : ("roadmap" as const),
    family: purchasable.family
      ? ("purchasable" as const)
      : ("roadmap" as const),
  };

  /* Someone on a trial, an expired or cancelled plan, or with no paid plan yet
     can still choose one; an active paid subscriber manages theirs below. */
  const showPlans =
    subscription !== null &&
    (subscription.plan === null ||
      subscription.status === "trialing" ||
      subscription.status === "trial_expired" ||
      subscription.status === "canceled");

  if (!subscription) {
    return (
      <Frame isParent={isParent}>
        <PageHero
          eyebrow="Plans & pricing"
          title="Pick the plan that fits your family"
          body="Start free with sample questions in every programme, then upgrade for the full question bank, full-length exam papers and progress tracking."
        />
        <div className="mt-12 space-y-12">
          <PricingPlans availability={availability} />
          <PlanComparisonTable />
          <AssuranceStrip />
        </div>
      </Frame>
    );
  }

  return (
    <Frame isParent={isParent}>
      <PageHero
        eyebrow="Billing"
        title="Billing & subscription"
        body="Manage your plan, payment method and invoice history."
      />
      <div className="mt-10 space-y-10">
        {showPlans && <PricingPlans availability={availability} />}
        <div className="mx-auto max-w-3xl space-y-8">
          <SubscriptionOverviewCard subscription={subscription} />
          <PaymentMethodCard />
          <InvoiceHistoryCard />
          <PlanComparisonTable />
          <AssuranceStrip />
        </div>
      </div>
    </Frame>
  );
}
