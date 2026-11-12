import type { Metadata } from "next";
import Link from "next/link";
import { PauseCircle } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { AuthMosaicPanel } from "@/features/auth/components/AuthMosaicPanel";
import { mmFocus } from "@/features/auth/components/auth-fields";

export const metadata: Metadata = {
  title: "Account paused or unavailable",
  description: "When an account cannot be used right now on MindMosaic.",
};

export default function AccountPausedPage() {
  return (
    <div className="mm-root min-h-screen bg-mm-page text-mm-ink lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <AuthMosaicPanel
        eyebrow="Account status"
        heading="When an account can’t be used right now."
        intro="Pausing is deliberate and reversible. If a parent paused this profile, they can turn it back on from their account in seconds."
        footnote="Independent learning platform. Assessment-style practice contains original questions and is not official examination material."
      />
      <main
        id="main-content"
        className="grid content-center justify-items-center px-[clamp(20px,4vw,64px)] py-[clamp(28px,3vw,56px)]"
      >
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10 lg:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <PauseCircle className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-mm-ink">
            Account paused
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-mm-muted">
            This student profile has been paused by a parent. No progress or past practice has been deleted.
          </p>

          <div className="mt-6 rounded-2xl border border-mm-line bg-mm-tint-soft p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-mm-brand">For the student</p>
            <p className="mt-1 text-sm text-mm-ink-soft">
              Ask a parent to sign in to their account and unpause your profile under <strong>Children</strong>.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/sign-in"
              className={twMerge(
                "inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-mm-brand text-sm font-semibold text-white shadow-sm transition hover:bg-mm-brand-deep",
                mmFocus
              )}
            >
              Sign in to parent account
            </Link>
            <Link
              href="/student-sign-in"
              className={twMerge(
                "inline-flex min-h-11 items-center justify-center rounded-lg text-sm font-semibold text-mm-muted hover:text-mm-brand",
                mmFocus
              )}
            >
              ← Back to student sign-in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
