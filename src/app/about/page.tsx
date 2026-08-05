import type { Metadata } from "next";

import { AboutScreen } from "@/features/landing/components/AboutScreen";
import { SiteFooter } from "@/features/landing/components/Closing";
import { SiteNav } from "@/features/landing/components/SiteNav";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why MindMosaic exists, the six principles it is built on, how every question is made, and what it does with a family's data.",
};

/**
 * About — design handoff screen 5.
 *
 * This route used to render prose inside `LegalPageShell`, alongside
 * /privacy and /terms. That shell is right for documents with a
 * last-updated date and a legal register; it is wrong for a page whose job
 * is the narrative, the six principles and the content pipeline. The legal
 * pages keep the shell; this one is a marketing screen and reads as one.
 *
 * The old page's copy is not lost so much as corrected: it described the
 * product as being "for Grade 3 and Grade 5 students" while every other
 * marketing page said Years 1-12. The new narrative states what is live
 * and what is being built, separately — see ../features/landing/content.ts.
 */
export default function AboutPage() {
  return (
    <div className="lp-root min-h-screen">
      <SiteNav />
      <main id="main-content">
        <AboutScreen />
      </main>
      <SiteFooter />
    </div>
  );
}
