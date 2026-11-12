import type { Metadata } from "next";
import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";
import { AuthMosaicPanel } from "@/features/auth/components/AuthMosaicPanel";
import { mmAuthButton, mmFocus } from "@/features/auth/components/auth-fields";
import { twMerge } from "tailwind-merge";

export const metadata: Metadata = {
  title: "Can’t sign in?",
  description: "A grown-up can look up your login code and set a new PIN.",
  robots: { index: false, follow: true },
};

/**
 * Student help. Every statement here points at something the parent view
 * really does today: the login code can be looked up (and a card printed)
 * from Manage children, and a PIN can be reset there. Nothing is promised
 * about e-mail or text-message recovery, because a child has no e-mail.
 */
export default function StudentSignInHelpPage() {
  return (
    <div className="mm-root min-h-screen bg-mm-page text-mm-ink lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <AuthMosaicPanel
        eyebrow="Student sign in"
        heading="A grown-up can fix this fast."
        intro="Login codes and PINs are set up by a parent, so the quickest way back in is to ask them."
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
              Can&apos;t sign in?
            </h1>
            <p className="text-base leading-[1.6] text-mm-muted">
              Your login code and PIN are looked after by a grown-up. Here is what to ask them.
            </p>
          </div>

          <ul className="grid gap-3">
            <li className="rounded-xl border border-mm-tint-line bg-mm-tint p-4 text-[15px] leading-[1.55] text-mm-ink-soft">
              <strong className="block text-mm-ink">&ldquo;What&apos;s my login code?&rdquo;</strong>
              It looks like K7XJ-2P9R and never changes. It is on the card they printed, and they can
              find it again in their account.
            </li>
            <li className="rounded-xl border border-mm-tint-line bg-mm-tint p-4 text-[15px] leading-[1.55] text-mm-ink-soft">
              <strong className="block text-mm-ink">&ldquo;Can you reset my PIN?&rdquo;</strong>
              A grown-up can set a new 6-number PIN for you in a few seconds, from your profile in
              their account.
            </li>
            <li className="rounded-xl border border-mm-tint-line bg-mm-tint p-4 text-[15px] leading-[1.55] text-mm-ink-soft">
              <strong className="block text-mm-ink">&ldquo;Is my account on?&rdquo;</strong>
              Sometimes a grown-up pauses an account. They can turn it back on.
            </li>
          </ul>

          <section
            aria-labelledby="for-grown-up"
            className="rounded-xl border border-mm-line bg-white p-4 text-[15px] leading-[1.55] text-mm-ink-soft"
          >
            <h2 id="for-grown-up" className="text-base font-bold text-mm-ink">
              For the grown-up
            </h2>
            <p className="mt-1">
              Sign in, open <strong>Manage children</strong>, and choose the child. You can set a new
              PIN there, and use <strong>Sign-in card</strong> to see the login code and print a
              card for them.
            </p>
          </section>

          <div className="grid gap-3">
            <Link href="/student-sign-in" className={mmAuthButton({ className: "w-full" })}>
              Back to sign-in
            </Link>
            <Link
              href="/sign-in"
              className={twMerge(
                "inline-flex min-h-11 items-center justify-center rounded font-bold text-mm-brand hover:underline",
                mmFocus,
              )}
            >
              A grown-up signs in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
