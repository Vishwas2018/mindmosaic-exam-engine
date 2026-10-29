import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isReviewConsoleAllowed } from "@/features/review-console/preview-gate";

export const metadata: Metadata = {
  title: "Dev - Review Console",
  robots: { index: false, follow: false },
};

/*
 * Evaluated per request, never frozen into a static build: a production
 * deployment must answer 404 whatever the build-time environment was.
 */
export const dynamic = "force-dynamic";

/**
 * Dev/QA only, same posture as /dev/bar-model. See preview-gate.ts.
 */
export default function ReviewConsoleLayout({ children }: { children: React.ReactNode }) {
  if (!isReviewConsoleAllowed()) notFound();
  return children;
}
