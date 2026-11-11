"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { AuthMosaicPanel } from "@/features/auth/components/AuthMosaicPanel";
import { mmFocus } from "@/features/auth/components/auth-fields";

/** Signed out confirmation: clean exit screen after the user signs out.
   Reassures them the session is ended and offers a way back in. */
export default function SignedOutPage() {
  return (
    <div className="mm-root min-h-screen bg-mm-page text-mm-ink lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <AuthMosaicPanel
        eyebrow="Signed out"
        heading="You&rsquo;ve been signed out."
        intro="Your session has ended. Sign in again to continue using MindMosaic."
        footnote="Independent learning platform. Assessment-style practice contains original questions and is not official examination material."
      />
      <main
        id="main-content"
        className="grid content-center justify-items-center px-[clamp(20px,4vw,64px)] py-[clamp(28px,3vw,56px)]"
      >
        <div className="mb-8 w-full max-w-[440px] lg:hidden">
          <Link href="/" aria-label="MindMosaic home" className="inline-flex min-h-11 items-center">
            <span className="sr-only">MindMosaic home</span>
          </Link>
        </div>

        <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10 lg:p-12">
          <LogOut aria-hidden="true" className="mx-auto h-12 w-12 text-mm-brand" />
          <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
            Signed out
          </h1>
          <p className="mt-2 text-sm leading-[1.6] text-mm-muted">
            You&rsquo;ve been signed out of MindMosaic. Your session has ended.
          </p>

          <Link
            href="/sign-in"
            className={twMerge(
              "mt-6 inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline",
              mmFocus,
            )}
          >
            Sign in again
          </Link>
        </div>
      </main>
    </div>
  );
}
