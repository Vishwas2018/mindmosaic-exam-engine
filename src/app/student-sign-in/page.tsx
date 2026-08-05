import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";
import { AuthMosaicPanel, AuthPanelPoints } from "@/features/auth/components/AuthMosaicPanel";
import { SignInPanel } from "@/features/auth/components/SignInPanel";

export const metadata: Metadata = {
  title: "Student sign in",
  description: "Sign in with the login code and PIN your parent gave you.",
};

/**
 * The student's own door into the same screen as /sign-in, opened on the
 * Student tab.
 *
 * The route is kept rather than folded away: it is the URL written on the
 * card a child is handed, it is linked from the Help Centre, and sending a
 * nine-year-old to a page where they first have to find the right tab is a
 * worse experience than one extra route. The form itself is the same
 * component, so the two can never drift apart.
 */
export default function StudentSignInPage() {
  return (
    <div className="mm-root min-h-screen bg-mm-page text-mm-ink lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <AuthMosaicPanel
        eyebrow="Student sign in"
        heading="Your code and PIN are all you need."
        intro="No email address, no password to remember. Your parent has both — ask them if you get stuck."
        footnote="Independent learning platform. Assessment-style practice contains original questions and is not official examination material."
      >
        <AuthPanelPoints
          points={[
            "The code looks like KXJD-2P9R and is not case sensitive",
            "The PIN is six digits",
            "Everything you have finished is still there when you sign back in",
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
          <SignInPanel defaultKind="student" />
        </Suspense>
      </main>
    </div>
  );
}
