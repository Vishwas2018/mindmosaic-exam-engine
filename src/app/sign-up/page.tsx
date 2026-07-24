import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { AuthBrandPanel } from "@/features/auth/components/AuthBrandPanel";
import { AuthCard } from "@/features/auth/components/AuthCard";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your MindMosaic account.",
};

/* Same shell as /sign-in — AuthCard already supports an initialMode prop
   for exactly this reuse, so a dedicated route only needs to set it, not
   duplicate any auth logic. */
export default function SignUpPage() {
  return (
    <main id="main-content" className="min-h-screen bg-page px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-2">
        <div className="hidden lg:block">
          <AuthBrandPanel />
        </div>

        <header className="flex items-center justify-between lg:hidden">
          <Link href="/" aria-label="MindMosaic home" className="inline-flex min-h-11 items-center">
            <MindMosaicLogo className="h-8 w-auto text-royal" />
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
          <Suspense fallback={<div className="min-h-[520px] w-full max-w-md animate-pulse rounded-2xl bg-royal/5" />}>
            <AuthCard initialMode="signup" />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
