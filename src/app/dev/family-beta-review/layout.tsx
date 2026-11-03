import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isFamilyBetaFixedPapersEnabled } from "@/server/family-beta-fixed-papers";

export const metadata: Metadata = {
  title: "Dev — Family beta content review",
  robots: { index: false, follow: false },
};

/*
 * Evaluated per request, never frozen into a static build, so a production
 * deployment answers 404 whatever the build-time environment was.
 */
export const dynamic = "force-dynamic";

/**
 * Reviewer-only surface for the UNAPPROVED family-beta papers.
 *
 * Gated by the same fail-closed check the papers themselves use: it needs
 * FAMILY_BETA_FIXED_PAPERS_PREVIEW=enabled and refuses on any production
 * deployment. This route shows expected answers, so it must never be
 * reachable by a student; nothing on it records approval.
 */
export default function FamilyBetaReviewLayout({ children }: { children: React.ReactNode }) {
  if (!isFamilyBetaFixedPapersEnabled()) notFound();
  return children;
}
