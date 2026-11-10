"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/features/auth";
import { mmAuthButton, mmFocus } from "@/features/auth/components/auth-fields";

/** Session expired: the user's session is no longer valid (idle timeout,
   revoked account, or explicit sign-out elsewhere). Explains what happened
   and offers a clear path back to sign in. */
export default function SessionExpiredPage() {
  const { signOut, status } = useAuth();

  return (
    <main
      id="main-content"
      className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
    >
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
  );
}
