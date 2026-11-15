"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { CreditCard, Info } from "lucide-react";

export interface ParentBillingHandoffProps {
  membership: {
    planName: string;
    planPrice: string;
    seatsCovered: string;
    nextPayment: string;
    cardBrand: string;
    cardLast4: string;
  };
  isLocalPreview?: boolean;
  /** True only for a paid plan with payments switched on. Otherwise no card, plan or invoice control is offered. */
  paymentsEnabled?: boolean;
}

export function ParentBillingHandoff({
  membership,
  isLocalPreview = false,
  paymentsEnabled = true,
}: ParentBillingHandoffProps) {
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const bhHeadingId = useId();
  const backHeadingId = useId();

  const handleOpenStripePortal = async () => {
    if (isLocalPreview) {
      setPortalError(
        "Stripe billing actions are illustrative and disabled in isolated preview mode.",
      );
      return;
    }

    setPortalBusy(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: "/parent/account/billing" }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) {
        window.location.href = data.url;
      } else {
        setPortalError(
          data?.error === "no_stripe_customer"
            ? "No active Stripe customer record found. Subscriptions started via free trial will be billed upon trial end."
            : "Could not open billing portal right now. Please try again shortly.",
        );
      }
    } catch {
      setPortalError(
        "Unable to connect to billing service. Please try again later.",
      );
    } finally {
      setPortalBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Greet (Artboard #25) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-mm-ink-soft"
          >
            <Link
              href="/parent/account"
              className="inline-flex min-h-11 items-center hover:text-mm-brand transition"
            >
              Account
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-mm-ink font-semibold">
              Plan &amp; billing
            </span>
          </nav>
          <p className="text-xs font-semibold uppercase tracking-wider text-mm-brand">
            Account
          </p>
          <h1 className="font-[family-name:var(--font-display)] tracking-[-0.02em] mt-1 text-2xl font-semibold tracking-tight text-mm-ink sm:text-3xl">
            Plan &amp; billing
          </h1>
          <p className="mt-1 text-sm font-medium text-mm-ink-soft sm:text-base">
            Manage your MindMosaic membership, payment methods, and invoices.
          </p>
        </div>

        {isLocalPreview && (
          <span className="inline-flex min-h-8 items-center gap-1.5 self-start rounded-full border border-mm-brand/10 bg-mm-brand/5 px-3 py-1 text-xs font-semibold text-mm-brand shadow-xs">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Illustrative sample family
          </span>
        )}
      </div>

      {/* Scope Junction Banner */}
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-mm-brand/15 bg-mm-brand/5 p-4 text-xs sm:text-sm text-mm-ink"
      >
        <Info
          className="mt-0.5 h-5 w-5 shrink-0 text-mm-brand"
          aria-hidden="true"
        />
        <div className="leading-relaxed">
          {paymentsEnabled ? (
            <>
              <strong className="font-semibold text-mm-ink">
                Payments are handled by Stripe.
              </strong>{" "}
              Cards, invoices and plan changes open in Stripe’s billing portal
              and bring you back here.
            </>
          ) : (
            <>
              <strong className="font-semibold text-mm-ink">
                The family beta is free.
              </strong>{" "}
              There is nothing to pay, no card on file and nothing to cancel. We
              will tell you well before anything changes.
            </>
          )}
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Current Membership Card (7 cols) */}
        <section
          aria-labelledby={bhHeadingId}
          className="rounded-2xl border border-mm-brand/10 bg-white p-6 shadow-xs lg:col-span-7 xl:col-span-8"
        >
          <div className="flex items-center gap-2 border-b border-mm-brand/10 pb-4">
            <CreditCard className="h-5 w-5 text-mm-brand" aria-hidden="true" />
            <h2
              id={bhHeadingId}
              className="font-[family-name:var(--font-display)] tracking-[-0.02em] text-lg font-semibold text-mm-ink"
            >
              Current membership
            </h2>
          </div>

          <dl className="mt-5 divide-y divide-mm-brand/10 text-xs sm:text-sm">
            <div className="flex items-center justify-between py-3">
              <dt className="text-mm-ink-soft">Plan</dt>
              <dd className="font-semibold text-mm-ink">
                {membership.planName} · {membership.planPrice}
              </dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-mm-ink-soft">Children covered</dt>
              <dd className="font-semibold text-mm-ink">
                {membership.seatsCovered}
              </dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-mm-ink-soft">Next payment</dt>
              <dd className="font-semibold text-mm-ink">
                {membership.nextPayment}
              </dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-mm-ink-soft">Card</dt>
              <dd className="font-semibold text-mm-ink">
                {membership.cardLast4
                  ? `${membership.cardBrand} ending ${membership.cardLast4}`
                  : membership.cardBrand || "No card on file"}
              </dd>
            </div>
          </dl>

          {portalError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-semibold text-amber-900"
            >
              {portalError}
            </div>
          )}

          {paymentsEnabled ? (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/pricing"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-mm-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-mm-brand/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mm-brand/30"
                >
                  Change plan
                </Link>

                <button
                  type="button"
                  onClick={handleOpenStripePortal}
                  disabled={portalBusy}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-mm-brand/20 bg-white px-4 py-2 text-xs font-semibold text-mm-brand shadow-2xs hover:bg-mm-brand/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mm-brand/30"
                >
                  {portalBusy ? "Opening portal..." : "Payment methods"}
                </button>

                <button
                  type="button"
                  onClick={handleOpenStripePortal}
                  disabled={portalBusy}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold text-mm-ink-soft hover:text-mm-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mm-brand/20"
                >
                  Invoices
                </button>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-mm-ink-soft">
                Manage payment details and billing history directly with our
                payment processor.
              </p>
            </>
          ) : null}
        </section>

        {/* Right Column: Coming Back Card (5 cols) */}
        <section
          aria-labelledby={backHeadingId}
          className="rounded-2xl border border-mm-brand/10 bg-white p-6 shadow-xs lg:col-span-5 xl:col-span-4"
        >
          <h2
            id={backHeadingId}
            className="font-[family-name:var(--font-display)] tracking-[-0.02em] text-lg font-semibold text-mm-ink"
          >
            Coming back
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-mm-ink-soft sm:text-sm">
            Every billing action returns here to your Account rather than the
            home page. When you finish updating cards or viewing invoices, you
            will return straight back to your profile.
          </p>

          <Link
            href="/parent/account"
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-mm-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-mm-brand/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mm-brand/30"
          >
            &larr; Back to Account
          </Link>
        </section>
      </div>
    </div>
  );
}
