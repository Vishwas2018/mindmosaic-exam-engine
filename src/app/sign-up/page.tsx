import type { Metadata } from "next";
import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";
import { AuthMosaicPanel } from "@/features/auth/components/AuthMosaicPanel";
import { SignUpScreen } from "@/features/auth/components/SignUpScreen";
import { SignupClosedCard } from "@/features/auth/components/SignupClosedCard";
import { PUBLIC_SIGNUP_ENABLED } from "@/features/auth/signup-policy";
import { yearLevelsWithGatedCoverage } from "@/features/taxonomy/coverage";

import { isAuthPreviewEnabled } from "@/features/auth/preview-mode";
import { AuthPreviewScreens } from "@/features/auth/components/preview/AuthPreviewScreens";

export const metadata: Metadata = PUBLIC_SIGNUP_ENABLED
  ? {
      title: "Sign up",
      description:
        "Create a parent account, add a student and choose where to start — three steps, no card required.",
    }
  : {
      title: "Sign-up closed",
      description: "MindMosaic accounts are created directly for families, not by public sign-up.",
      /* Nothing to index, and no reason to invite a stranger to a door that
         does not open. */
      robots: { index: false, follow: false },
    };

/**
 * Sign up — design handoff screen 7.
 *
 * In visual preview mode (AUTH_PREVIEW=1 and loopback), renders the
 * redesigned authentication artboards (b0–b19) with state switchers.
 */
export default async function SignUpPage() {
  if (await isAuthPreviewEnabled()) {
    return <AuthPreviewScreens initialView="parent-signup" />;
  }

  if (PUBLIC_SIGNUP_ENABLED) {
    return <SignUpScreen availableYearLevels={yearLevelsWithGatedCoverage()} />;
  }

  return (
    <div className="mm-root min-h-screen bg-mm-page text-mm-ink lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <AuthMosaicPanel
        columns={10}
        eyebrow="Invite only"
        heading="Accounts are set up for families directly."
        intro="Practice itself is open to anyone — no account, no sign-in, nothing stored. An account is only what saves progress across sessions."
        footnote="A student profile holds a first name and year level only. We never sell personal information and there is no advertising on the platform."
      />

      <main
        id="main-content"
        className="grid content-center justify-items-center px-[clamp(20px,4vw,64px)] py-[clamp(28px,3vw,56px)]"
      >
        <div className="mb-8 w-full max-w-[440px] lg:hidden">
          <Link href="/" aria-label="MindMosaic home" className="inline-flex min-h-11 items-center">
            <MindMosaicLogo size="md" />
          </Link>
        </div>
        <SignupClosedCard />
      </main>
    </div>
  );
}
