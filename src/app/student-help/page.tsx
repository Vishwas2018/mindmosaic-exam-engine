"use client";

import Link from "next/link";
import { HelpCircle, UserRound } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { mmFocus } from "@/features/auth/components/auth-fields";

/** Student login help: explains what to do when a student can&rsquo;t sign in.
   Login codes and PINs are parent-provisioned, so the child is guided to ask
   a grown-up rather than left guessing. */
export default function StudentHelpPage() {
  return (
    <main
      id="main-content"
      className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
    >
      <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10 lg:p-12">
        <HelpCircle aria-hidden="true" className="mx-auto h-12 w-12 text-mm-brand" />
        <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
          Can&rsquo;t sign in?
        </h1>
        <p className="mt-2 text-sm leading-[1.6] text-mm-muted">
          Your login code and PIN are looked after by a grown-up. Ask them for help.
        </p>

        <div className="mt-8 grid gap-4">
          <div className="rounded-xl border border-mm-tint-line bg-mm-tint p-4 text-left">
            <p className="text-[14px] leading-[1.5] text-mm-ink-soft">
              <span className="font-bold text-mm-ink">&ldquo;What&rsquo;s my login code?&rdquo;</span>{" "}
              It looks like K7XJ-2P9R and never changes. It&rsquo;s on the card they printed, or in their parent account.
            </p>
          </div>
          <div className="rounded-xl border border-mm-tint-line bg-mm-tint p-4 text-left">
            <p className="text-[14px] leading-[1.5] text-mm-ink-soft">
              <span className="font-bold text-mm-ink">&ldquo;Can you reset my PIN?&rdquo;</span>{" "}
              A grown-up can make a new 6-number PIN for you from your profile in their account.
            </p>
          </div>
        </div>

        <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-mm-muted">
          Or ask them to sign in to their account and check your profile there.
        </p>

        <Link
          href="/sign-in"
          className={twMerge(
            "mt-6 inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline",
            mmFocus,
          )}
        >
          <UserRound aria-hidden="true" className="h-4 w-4 shrink-0 mr-2" />
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
