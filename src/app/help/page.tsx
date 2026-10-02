import type { Metadata } from "next";

import { SiteFooter } from "@/features/landing/components/Closing";
import { HelpScreen } from "@/features/landing/components/HelpScreen";
import { SiteNav } from "@/features/landing/components/SiteNav";

export const metadata: Metadata = {
  title: "Help Centre",
  description:
    "Quick answers to common questions about signing in, programs and billing, plus how to reach us — one real email address, no contact form.",
};

/**
 * Help and contact — Public/Help.dc.html. Replaces the old prose /help
 * page and absorbs the former /contact page (owner ruling, 1 Oct); /contact
 * now permanently redirects here (next.config.ts).
 */
export default function HelpPage() {
  return (
    <div className="lp-root min-h-screen">
      <SiteNav />
      <main id="main-content">
        <HelpScreen />
      </main>
      <SiteFooter />
    </div>
  );
}
