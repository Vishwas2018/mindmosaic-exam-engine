import type { Metadata } from "next";
import { notFound } from "next/navigation";

/* See src/app/exam/layout.tsx for why this lives in a layout rather than
   the (client) page itself. The gate below is here for the same reason:
   the page is a Client Component, and this is the nearest server boundary
   that can refuse to render it at all. */
export const metadata: Metadata = {
  title: "Renderer showcase",
  description:
    "Every MindMosaic question and visual renderer, interactive — a developer and QA reference, not a practice exam.",
  /* QA tooling, never a learner surface — and robots.ts disallows it too. */
  robots: { index: false, follow: false },
};

/**
 * Dev/QA only, same posture as /dev/routes.
 *
 * This route renders every question and visual renderer with its fixtures
 * attached. It is a developer reference, it was linked from public
 * navigation, and it has no place on a deployment a child can reach.
 *
 * The SHOWCASE_ENABLED escape hatch exists for exactly one caller: the
 * Playwright config, whose web server runs a PRODUCTION build. The renderer
 * and a11y showcase specs are the only coverage of every question type in
 * the product, so gating on NODE_ENV alone would not have moved that
 * coverage, it would have deleted it. Never set this on a real deployment —
 * see docs/DEPLOYMENT.md.
 */
export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.SHOWCASE_ENABLED !== "1") {
    notFound();
  }
  return children;
}
