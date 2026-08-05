import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";
import { AuthMosaicPanel, AuthPanelPoints } from "@/features/auth/components/AuthMosaicPanel";
import { SignInPanel } from "@/features/auth/components/SignInPanel";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to MindMosaic — parent accounts and student profiles both sign in here.",
};

/**
 * Log in — design handoff screen 6. Split layout at `1.05fr / 1fr`, plum
 * mosaic panel on the left, form on the right.
 *
 * The panel is `hidden lg:grid` (inside AuthMosaicPanel): the handoff was
 * designed at 1440px only and explicitly says mobile has not been reviewed,
 * so below `lg` the split collapses to the form alone with a compact brand
 * strip above it, rather than inventing a mobile treatment for a 216-tile
 * animated field.
 */
export default function SignInPage() {
  return (
    <div className="mm-root min-h-screen bg-mm-page text-mm-ink lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <AuthMosaicPanel
        eyebrow="Welcome back"
        heading="Every session picks up exactly where the last one stopped."
        intro="Progress, flagged questions and part-finished papers are all saved. Sign in and the next lesson is already waiting."
        footnote="Independent learning platform. Assessment-style practice contains original questions and is not official examination material."
      >
        <AuthPanelPoints
          points={[
            "Part-finished exam papers resume with the timer where it stopped",
            "Flagged questions stay flagged until they are reviewed",
            "Parents see every student profile from one sign-in",
          ]}
        />
      </AuthMosaicPanel>

      <main
        id="main-content"
        className="grid content-center justify-items-center px-[clamp(20px,4vw,64px)] py-[clamp(28px,3vw,56px)]"
      >
        <div className="mb-8 w-full max-w-[440px] lg:hidden">
          <Link href="/" aria-label="MindMosaic home" className="inline-flex min-h-11 items-center">
            <MindMosaicLogo size={36} />
          </Link>
        </div>

        <Suspense
          fallback={
            <div
              aria-hidden="true"
              className="h-[560px] w-full max-w-[440px] animate-pulse rounded-2xl bg-mm-tint"
            />
          }
        >
          <SignInPanel />
        </Suspense>
      </main>
    </div>
  );
}
