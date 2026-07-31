import Link from "next/link";
import { KeyRound, LockKeyhole, UserRoundPlus } from "lucide-react";

import { buttonClasses } from "@/components/ui";

import { SIGNUP_CLOSED_MESSAGE } from "../signup-policy";

/**
 * What /sign-up shows instead of a form, on a deployment with public
 * sign-up turned off.
 *
 * A form that posts to a closed backend and comes back with GoTrue's own
 * wording ("Signups not allowed for this instance") reads, to the person
 * filling it in, like they got something wrong. Saying so up front costs
 * one screen and removes the whole guessing game — and every route out of
 * here is a real one, because the two people who land on this page are a
 * parent who already has an account and a child who needs their code.
 */
export function SignupClosedCard() {
  return (
    <div className="w-full max-w-md">
      <span className="inline-flex items-center gap-2 rounded-full border border-royal/15 bg-royal/5 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-royal">
        <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5" />
        Invite only
      </span>

      <h1 className="mt-4 text-3xl font-black tracking-[-0.03em] text-ink">
        Sign-up is closed
      </h1>
      <p className="mt-3 text-base leading-7 text-muted">{SIGNUP_CLOSED_MESSAGE}</p>

      <div className="mt-8 space-y-3">
        <Link href="/sign-in" className={buttonClasses({ variant: "primary", className: "w-full" })}>
          <KeyRound aria-hidden="true" className="h-4 w-4" />
          Sign in to an existing account
        </Link>
        <Link
          href="/student-sign-in"
          className={buttonClasses({ variant: "secondary", className: "w-full" })}
        >
          <UserRoundPlus aria-hidden="true" className="h-4 w-4" />
          I&apos;m a student with a login code
        </Link>
      </div>

      {/*
        The inline links use the codebase's negative-margin idiom (as in
        AuthCard): padding lifts them to the 44px minimum touch target that
        e2e/helpers/screen-helpers.ts enforces, while the negative margin
        keeps the paragraph's visual line spacing unchanged. Without it they
        measured 19px tall — tappable only if you aim well, which on a
        page whose whole job is offering a way out is the wrong thing to
        get wrong.
      */}
      <p className="mt-8 text-sm leading-6 text-muted">
        Practice exams stay free and need no account at all —{" "}
        <Link
          href="/practice"
          className="-my-3.5 inline-block py-3.5 font-bold text-royal underline underline-offset-4"
        >
          start practising
        </Link>
        . Parents add their children from the{" "}
        <Link
          href="/parent"
          className="-my-3.5 inline-block py-3.5 font-bold text-royal underline underline-offset-4"
        >
          parent dashboard
        </Link>
        .
      </p>
    </div>
  );
}
