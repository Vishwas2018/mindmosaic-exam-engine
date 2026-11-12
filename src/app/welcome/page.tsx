import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { MindMosaicLogo } from "@/components/branding";
import { AuthMosaicPanel } from "@/features/auth/components/AuthMosaicPanel";
import { mmFocus } from "@/features/auth/components/auth-styles";
import { PUBLIC_SIGNUP_ENABLED } from "@/features/auth/signup-policy";

export const metadata: Metadata = {
  title: "Welcome",
  description: "Choose how you sign in to MindMosaic: as a parent or as a student.",
  robots: { index: false, follow: true },
};

const card =
  "group grid gap-1.5 rounded-2xl border-[1.5px] border-mm-line bg-white p-5 transition-colors hover:border-mm-brand min-h-11";

/**
 * Entry: who is signing in? Two doors, each to a screen that exists. The
 * "create a family account" link appears only while public sign-up is on.
 */
export default function WelcomePage() {
  return (
    <div className="mm-root min-h-screen bg-mm-page text-mm-ink lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <AuthMosaicPanel
        eyebrow="MindMosaic"
        heading="One place for the whole family."
        intro="Parents see honest progress; children get practice that never counts a wrong answer against them."
        footnote="Independent learning platform. Assessment-style practice contains original questions and is not official examination material."
      />

      <main
        id="main-content"
        className="grid content-center justify-items-center px-[clamp(20px,4vw,64px)] py-[clamp(28px,3vw,56px)]"
      >
        <div className="mm-rise grid w-full max-w-[440px] min-w-0 gap-6">
          <Link href="/" aria-label="MindMosaic home" className="inline-flex min-h-11 items-center lg:hidden">
            <MindMosaicLogo size="md" />
          </Link>

          <div className="grid gap-2.5">
            <h1 className="text-[clamp(28px,3vw,38px)] font-[700] leading-[1.1] text-mm-ink">
              Welcome to MindMosaic
            </h1>
            <p className="text-base leading-[1.6] text-mm-muted">Who is signing in?</p>
          </div>

          <div className="grid gap-4">
            <Link href="/sign-in" className={twMerge(card, mmFocus)}>
              <span className="flex items-center justify-between text-lg font-bold text-mm-ink">
                I&apos;m a parent
                <ArrowRight aria-hidden="true" className="h-5 w-5 text-mm-brand" />
              </span>
              <span className="text-sm leading-[1.5] text-mm-muted">
                See how your children are doing, manage their accounts and your plan.
              </span>
            </Link>
            <Link href="/student-sign-in" className={twMerge(card, mmFocus)}>
              <span className="flex items-center justify-between text-lg font-bold text-mm-ink">
                I&apos;m a student
                <ArrowRight aria-hidden="true" className="h-5 w-5 text-mm-brand" />
              </span>
              <span className="text-sm leading-[1.5] text-mm-muted">
                Sign in with the login code and PIN a parent gave you.
              </span>
            </Link>
          </div>

          {PUBLIC_SIGNUP_ENABLED && (
            <p className="text-sm text-mm-muted">
              New here?{" "}
              <Link
                href="/sign-up"
                className={twMerge("inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline", mmFocus)}
              >
                Create a family account
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
