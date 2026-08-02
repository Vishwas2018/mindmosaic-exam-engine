import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { AuthBrandPanel } from "@/features/auth/components/AuthBrandPanel";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { SignupClosedCard } from "@/features/auth/components/SignupClosedCard";
import { PUBLIC_SIGNUP_ENABLED } from "@/features/auth/signup-policy";

export const metadata: Metadata = PUBLIC_SIGNUP_ENABLED
  ? {
      title: "Sign up",
      description: "Create your MindMosaic account.",
    }
  : {
      title: "Sign-up closed",
      description: "MindMosaic accounts are created directly for families, not by public sign-up.",
      /* Nothing to index, and no reason to invite a stranger to a door that
         does not open. */
      robots: { index: false, follow: false },
    };

/* Same shell as /sign-in — AuthCard already supports an initialMode prop
   for exactly this reuse, so a dedicated route only needs to set it, not
   duplicate any auth logic. With public sign-up closed the shell stays and
   the card is replaced, so the route keeps working (and keeps its brand
   panel) rather than 404ing on anyone who follows an old link. */
export default function SignUpPage() {
  return (
    <main id="main-content" className="min-h-screen bg-page px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-2">
        <div className="hidden lg:block">
          <AuthBrandPanel />
        </div>

        <header className="flex items-center justify-between lg:hidden">
          <Link href="/" aria-label="MindMosaic home" className="inline-flex min-h-11 items-center">
            <MindMosaicLogo />
          </Link>
          <Link
            href="/practice"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-royal"
          >
            Sample exams
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </header>

        <div className="flex items-center justify-center rounded-3xl bg-surface p-6 shadow-[0_20px_60px_rgba(49,32,86,0.08)] sm:p-10">
          {PUBLIC_SIGNUP_ENABLED ? (
            <Suspense fallback={<div className="min-h-[520px] w-full max-w-md animate-pulse rounded-2xl bg-royal/5" />}>
              <AuthCard initialMode="signup" />
            </Suspense>
          ) : (
            <SignupClosedCard />
          )}
        </div>
      </div>
    </main>
  );
}
