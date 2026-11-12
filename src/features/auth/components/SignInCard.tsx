"use client";

import { Printer } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { mmAuthButton, mmFocus } from "./auth-fields";

/**
 * The card a parent hands a child: where to sign in, the login code, and the
 * PIN. It prints on its own (everything else on the page is hidden by the
 * print stylesheet below).
 *
 * The PIN is only ever passed in at the moment it is known — when a child is
 * created or their PIN is reset — because it is not stored anywhere readable.
 * Without it the card prints a blank line to write it on, rather than
 * inventing or guessing one.
 */
export function SignInCard({
  childName,
  loginCode,
  pin,
  signInUrl,
}: {
  childName: string;
  loginCode: string;
  /** Pass only while the PIN is actually known to the parent on this screen. */
  pin?: string;
  signInUrl: string;
}) {
  return (
    <div className="grid gap-3">
      <style>{`
        @page { size: A5 landscape; margin: 12mm; }
        @media print {
          body * { visibility: hidden !important; }
          .mm-signin-card, .mm-signin-card * { visibility: visible !important; }
          .mm-signin-card { position: fixed; left: 0; top: 0; width: 100%; box-shadow: none !important; }
        }
      `}</style>
      <div
        className="mm-signin-card grid gap-3 rounded-2xl border-2 border-dashed border-mm-line bg-white p-5 text-mm-ink"
        data-testid="signin-card"
      >
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-mm-muted">
          MindMosaic sign-in card
        </p>
        <p className="text-xl font-[700]">{childName}</p>
        <dl className="grid gap-2 text-base">
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="font-semibold text-mm-muted">Sign in at</dt>
            <dd className="font-bold">{signInUrl}</dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="font-semibold text-mm-muted">Login code</dt>
            <dd className="font-mono text-2xl font-bold tracking-[0.12em]">{loginCode}</dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="font-semibold text-mm-muted">PIN (6 numbers)</dt>
            <dd className="font-mono text-2xl font-bold tracking-[0.3em]">
              {pin ?? "_ _ _ _ _ _"}
            </dd>
          </div>
        </dl>
        <p className="text-sm leading-[1.5] text-mm-muted">
          Keep this card somewhere safe. If the PIN is lost, a grown-up can set a new one.
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        className={twMerge(mmAuthButton({ variant: "outline", className: "w-fit min-h-11" }), mmFocus)}
      >
        <Printer aria-hidden="true" className="h-4 w-4" />
        Print sign-in card
      </button>
    </div>
  );
}
