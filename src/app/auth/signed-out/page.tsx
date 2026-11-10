"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { mmFocus } from "@/features/auth/components/auth-fields";

/** Signed out confirmation: clean exit screen after the user signs out.
   Reassures them the session is ended and offers a way back in. */
export default function SignedOutPage() {
  return (
    <main
      id="main-content"
      className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
    >
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
  );
}
