import type { Metadata } from "next";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

import { mmAuthButton, mmFocus } from "@/features/auth/components/auth-fields";

export const metadata: Metadata = {
  title: "Signed out",
  robots: { index: false, follow: false },
};

/**
 * Clean exit after an explicit sign-out. It states only what is true: this
 * browser is signed out. It does not say the family's work is "safe" or
 * "waiting", because nothing here has checked that.
 */
export default function SignedOutPage() {
  return (
    <main
      id="main-content"
      className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
    >
      <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10">
        <h1 className="text-2xl font-[700] tracking-[-0.03em] text-mm-ink">You&apos;re signed out</h1>
        <p role="status" className="mt-2 text-base leading-[1.6] text-mm-muted">
          You are signed out on this device. On a shared computer, this keeps your family&apos;s account
          private.
        </p>
        <Link href="/welcome" className={mmAuthButton({ className: "mt-6 w-full" })}>
          Sign in again
        </Link>
        <Link
          href="/switch-account"
          className={twMerge(
            "mt-4 inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline",
            mmFocus,
          )}
        >
          Switch to another account
        </Link>
        <p className="mt-6 text-[13px] leading-[1.5] text-mm-muted">
          Tip: on a family computer, sign out when you finish so the next person starts fresh.
        </p>
      </div>
    </main>
  );
}
