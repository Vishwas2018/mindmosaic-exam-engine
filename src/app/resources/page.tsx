import type { Metadata } from "next";

import { SiteFooter } from "@/features/landing/components/Closing";
import { HelpIndex } from "@/features/landing/components/HelpIndex";
import { HubLibrary } from "@/features/landing/components/HubLibrary";
import { SiteNav } from "@/features/landing/components/SiteNav";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "The Learning Hub — explanations, worked examples and guides for students and parents, plus the Help Centre index.",
};

/**
 * Resources — design handoff screen 4.
 *
 * Unlike the other marketing routes this one does not use <MarketingPage>:
 * that shell opens with a fixed eyebrow/title/CTA block, and this screen's
 * header carries the search field alongside the title. The nav, footer and
 * section rhythm are the same shared components either way.
 */
export default function ResourcesPage() {
  return (
    <div className="lp-root min-h-screen">
      <SiteNav />
      <main id="main-content">
        <HubLibrary />
        <HelpIndex />
      </main>
      <SiteFooter />
    </div>
  );
}
