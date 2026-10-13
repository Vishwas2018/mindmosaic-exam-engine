import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isBarModelPreviewAllowed } from "@/features/visuals/bar-model/preview-gate";

export const metadata: Metadata = {
  title: "Dev - Bar model preview",
  robots: { index: false, follow: false },
};

/*
 * Evaluated per request, never frozen into a static build: a production
 * deployment must answer 404 whatever the build-time environment was.
 */
export const dynamic = "force-dynamic";

/**
 * Dev/QA only, same posture as /dev/routes and /showcase. See
 * preview-gate.ts for the BAR_MODEL_PREVIEW_ENABLED escape hatch.
 */
export default function BarModelPreviewLayout({ children }: { children: React.ReactNode }) {
  if (!isBarModelPreviewAllowed()) notFound();
  return children;
}
