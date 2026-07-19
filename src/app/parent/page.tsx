import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MindMosaicLogo } from "@/components/branding";
import { Badge, EmptyState, ErrorState, buttonClasses } from "@/components/ui";
import { AuthNav } from "@/features/auth/components/AuthNav";
import { roleHomePath } from "@/features/auth/roles";
import { ParentDashboard, buildChildSummary } from "@/features/parent-dashboard";
import { loadParentDashboard } from "@/features/parent-dashboard/queries";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Parent dashboard" };

/*
 * Per-user data behind auth cookies: never prerender. Without this, a build
 * run without Supabase env vars would bake the "not configured" shell into
 * a static page and serve it even once the runtime is configured.
 */
export const dynamic = "force-dynamic";

/**
 * Server-rendered, read-only parent dashboard (mockup 03). Data is fetched
 * as the signed-in parent through RLS-scoped queries; summaries are
 * computed server-side and handed to the client component as plain props.
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

  const data = await loadParentDashboard();

  if (data.status === "unauthenticated") {
    redirect("/sign-in");
  }
  if (data.status === "wrong_role") {
    redirect(roleHomePath(data.role));
  }
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
        <EmptyState
          title="No children linked to your account yet"
          description="Once a child's account is linked to yours, their practice progress and exam results will appear here."
          action={
            <Link href="/" className={buttonClasses({ variant: "secondary" })}>
              Go to practice
            </Link>
          }
        />
      </Shell>
    );
  }

  const now = new Date();
  const summaries = data.children.map((child) =>
    buildChildSummary(child.profile, child.attempts, now),
  );

  return (
    <Shell>
      <ParentDashboard summaries={summaries} />
    </Shell>
  );
}
