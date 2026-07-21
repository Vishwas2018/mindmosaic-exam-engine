import type { ReactNode } from "react";

import { SiteFooter } from "@/features/landing/components/Closing";
import { SiteNav } from "@/features/landing/components/SiteNav";

import { DraftBanner } from "./DraftBanner";

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <DraftBanner />
      <main id="main-content" className="site-width py-12 sm:py-16">
        <article className="mx-auto max-w-3xl">
          <header className="border-b border-royal/10 pb-6">
            <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-ink sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-sm font-semibold text-muted">
              Last updated {lastUpdated}
            </p>
          </header>
          <div className="legal-prose mt-8">{children}</div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
