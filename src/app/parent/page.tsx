import type { Metadata } from "next";
import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";
import { Badge, EmptyState, ErrorState, buttonClasses } from "@/components/ui";
import { AuthNav } from "@/features/auth/components/AuthNav";
import {
  AddChildCard,
  BillingPanel,
  ParentDashboard,
  buildChildSummary,
} from "@/features/parent-dashboard";
import { loadParentDashboard } from "@/features/parent-dashboard/queries";
import { getMySubscription } from "@/lib/billing/subscription";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Parent dashboard" };

/*
 * Per-user data behind auth cookies: never prerender. Without this, a build
 * run without Supabase env vars would bake the "not configured" shell into
 * a static page and serve it even once the runtime is configured.
 */
export const dynamic = "force-dynamic";

/**
 * Server-rendered parent dashboard (mockup 03). Progress data is fetched as
 * the signed-in parent through RLS-scoped queries; summaries are computed
 * server-side and handed to the client component as plain props. The
 * add-child surface is the one write action here, and it goes through the
 * provisionChild server action rather than any client-side privilege.
 */

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
          <div className="flex items-center gap-3">
            <Badge variant="purple" className="hidden sm:inline-flex">
              Parent
            </Badge>
            <AuthNav />
          </div>
        </div>
      </header>
      <main id="main-content" className="site-width py-10 sm:py-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}

export default async function ParentHomePage() {
  if (!isSupabaseConfigured) {
    return (
      <Shell>
        <ErrorState
          title="Accounts aren't set up yet"
          description={SUPABASE_NOT_CONFIGURED_MESSAGE}
          action={
            <Link href="/" className={buttonClasses({ variant: "secondary" })}>
              Go to practice
            </Link>
          }
        />
      </Shell>
    );
  }

  const [data, subscription] = await Promise.all([
    loadParentDashboard(),
    getMySubscription(),
  ]);

  if (data.status === "error") {
    return (
      <Shell>
        <ErrorState
          title="We couldn't load your dashboard"
          description="Something went wrong fetching your children's progress. Please refresh to try again."
        />
      </Shell>
    );
  }

  if (data.children.length === 0) {
    return (
      <Shell>
        <div className="space-y-8">
          <BillingPanel subscription={subscription} />
          <EmptyState
            title="No children linked to your account yet"
            description="Add your child below to create their login. Once they start practising, their progress and exam results will appear here."
          />
          <AddChildCard />
        </div>
      </Shell>
    );
  }

  const now = new Date();
  const summaries = data.children.map((child) =>
    buildChildSummary(child.profile, child.attempts, now),
  );

  return (
    <Shell>
      <div className="space-y-8">
        <ParentDashboard summaries={summaries} subscription={subscription} />
        <AddChildCard />
      </div>
    </Shell>
  );
}
