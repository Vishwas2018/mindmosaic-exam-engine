import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isWritingPreviewAllowed } from "@/features/writing/preview-gate";

export const metadata: Metadata = {
  title: "Dev - Writing practice preview",
  robots: { index: false, follow: false },
};

/*
 * Evaluated per request, never frozen into a static build: a production
 * deployment must answer 404 whatever the build-time environment was.
 */
export const dynamic = "force-dynamic";

/**
 * Dev/QA only, gated exactly like /dev/bar-model: 404 in any production build,
 * and 404 on a Vercel production deployment even if the e2e flag is present.
 * See src/features/writing/preview-gate.ts.
 */
export default function WritingPreviewLayout({ children }: { children: React.ReactNode }) {
  if (!isWritingPreviewAllowed()) notFound();
  return children;
}
