import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { DefectDashboard } from "@/features/uat-assistant/components/DefectDashboard";
import { isUatAssistantEnvironmentAllowed } from "@/features/uat-assistant/flags";
import { verifyUatTesterAccess } from "@/features/uat-assistant/server/uat-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "UAT Defect Dashboard (DEV)",
  robots: { index: false, follow: false },
};

export default async function DevUatDashboardPage() {
  if (!isUatAssistantEnvironmentAllowed()) {
    notFound();
  }

  const access = await verifyUatTesterAccess();
  if (!access.enabled) {
    if (access.status === 404) notFound();
    redirect("/sign-in?next=%2Fdev%2Fuat");
  }

  return (
    <main
      id="main-content"
      className="min-h-dvh bg-mm-page px-4 py-8 font-[family-name:var(--font-geist)] text-mm-ink sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1200px] space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-mm-line pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-[family-name:var(--font-instrument-sans)] text-3xl font-semibold tracking-[-0.028em] text-mm-ink">
                MindMosaic UAT defect dashboard
              </h1>
              <Badge variant="purple">DEV only · Local IndexedDB</Badge>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-mm-muted">
              Review, filter, edit, and export manual testing observations captured across Admin, Student,
              Parent, and public DEV pages. Use the floating <strong>Report Issue</strong> control on any
              route to capture new items.
            </p>
          </div>
          <nav aria-label="UAT quick links" className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/dev/routes"
              className="inline-flex min-h-11 items-center rounded-xl border border-mm-line bg-mm-surface px-4 py-2 font-semibold text-mm-brand transition hover:border-mm-brand/40 hover:bg-mm-tint-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
            >
              Route index
            </Link>
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center rounded-xl border border-mm-line bg-mm-surface px-4 py-2 font-semibold text-mm-ink-soft transition hover:border-mm-brand/40 hover:bg-mm-tint-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
            >
              Admin hub
            </Link>
          </nav>
        </header>

        <DefectDashboard
          mode="page"
          githubRepo={access.githubRepo}
          githubConfigured={access.githubConfigured}
        />
      </div>
    </main>
  );
}
