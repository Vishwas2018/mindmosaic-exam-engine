"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/features/auth";
import { AuthMosaicPanel } from "@/features/auth/components/AuthMosaicPanel";
import { mmAuthButton, mmFocus } from "@/features/auth/components/auth-fields";

/** Session expired: the user's session is no longer valid (idle timeout,
   revoked account, or explicit sign-out elsewhere). Explains what happened
   and offers a clear path back to sign in. */
export default function SessionExpiredPage() {
  const { signOut, status } = useAuth();

  return (
    <div className="mm-root min-h-screen bg-mm-page text-mm-ink lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <AuthMosaicPanel
        eyebrow="Session expired"
        heading="Your session is no longer active."
        intro="Sign in again to continue. Your progress is saved — you&rsquo;ll pick up exactly where you left off."
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
          <AlertTriangle aria-hidden="true" className="mx-auto h-12 w-12 text-mm-coral-deep" />
          <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
            Session expired
          </h1>
          <p className="mt-2 text-sm leading-[1.6] text-mm-muted">
            Your session is no longer active. Sign in again to continue.
          </p>

          {status === "authenticated" && (
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={false}
              className={mmAuthButton({ variant: "outline", className: "mt-6 w-full" })}
            >
              Sign out &amp; start again
            </button>
          )}

          <Link
            href="/sign-in"
            className={twMerge(
              "mt-5 inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline",
              mmFocus,
            )}
          >
            ← Back to sign in
          </Link>
        </div>
      </main>
    </div>
  );
}
