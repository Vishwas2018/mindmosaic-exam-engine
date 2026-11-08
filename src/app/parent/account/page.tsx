import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, Shield, User, Bell, AlertTriangle } from "lucide-react";

import { ParentShell } from "@/features/parent-dashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account & Settings | MindMosaic",
  description: "Manage your guardian account details, subscription, and family access.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ParentAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email ?? "Signed-in parent";
  const userMetadata = user?.user_metadata as { display_name?: string; full_name?: string } | undefined;
  const displayName = userMetadata?.display_name || userMetadata?.full_name || "Parent Account";

  return (
    <ParentShell active="/parent/account">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">
            Account &amp; Settings
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage your parent profile, family subscription, and account security.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Account Profile Card */}
          <section
            aria-labelledby="account-details-heading"
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-royal/8 pb-4">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/8 text-royal"
              >
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 id="account-details-heading" className="text-base font-extrabold text-ink">
                  Parent Details
                </h2>
                <p className="text-xs text-muted">Your primary guardian account identity</p>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-muted">Display name</dt>
                <dd className="mt-0.5 text-sm font-bold text-ink">{displayName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted">Email address</dt>
                <dd className="mt-0.5 text-sm font-bold text-ink">{userEmail}</dd>
              </div>
            </dl>
          </section>

          {/* Subscription & Billing Card (Surfaced inside Account per Decision P1) */}
          <section
            aria-labelledby="billing-heading"
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4 border-b border-royal/8 pb-4">
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/8 text-royal"
                >
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="billing-heading" className="text-base font-extrabold text-ink">
                    Subscription &amp; Invoices
                  </h2>
                  <p className="text-xs text-muted">Family plan capacity and payments</p>
                </div>
              </div>
              <Link
                href="/billing"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-royal/8 px-4 text-xs font-extrabold text-royal transition hover:bg-royal/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
              >
                Manage on Billing &rarr;
              </Link>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-ink">Family Plan</p>
                <p className="text-xs text-muted">Includes practice access for up to 3 children</p>
              </div>
              <Link
                href="/billing"
                className="text-xs font-bold text-royal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/20"
              >
                View billing history and payment methods &rarr;
              </Link>
            </div>
          </section>

          {/* Security & Sign-in */}
          <section
            aria-labelledby="security-heading"
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-royal/8 pb-4">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/8 text-royal"
              >
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 id="security-heading" className="text-base font-extrabold text-ink">
                  Security &amp; Passwords
                </h2>
                <p className="text-xs text-muted">Guardian credentials and sign-in protection</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-muted">
                Your account is protected by Supabase authenticated credentials. Full password
                change and session inspection are part of the Account expansion (Phase P6).
              </p>
            </div>
          </section>

          {/* Notifications Placeholder */}
          <section
            aria-labelledby="notifications-heading"
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-royal/8 pb-4">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/8 text-royal"
              >
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 id="notifications-heading" className="text-base font-extrabold text-ink">
                  Notification Preferences
                </h2>
                <p className="text-xs text-muted">Email updates and alerts</p>
              </div>
            </div>

            <div className="mt-4 text-xs text-muted space-y-1">
              <p>
                <span className="font-bold text-ink">Mandatory:</span> Billing receipts and critical
                payment failure notices cannot be switched off.
              </p>
              <p>
                <span className="font-bold text-ink">Optional:</span> Weekly student summaries and
                milestone digests will be configurable here in Phase P6.
              </p>
            </div>
          </section>

          {/* Data & Deletion (ADR-012 model) */}
          <section
            aria-labelledby="data-heading"
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-royal/8 pb-4">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/8 text-royal"
              >
                <AlertTriangle className="h-5 w-5 text-muted" />
              </div>
              <div>
                <h2 id="data-heading" className="text-base font-extrabold text-ink">
                  Data &amp; Privacy (ADR-012)
                </h2>
                <p className="text-xs text-muted">Child privacy protections and erasure policies</p>
              </div>
            </div>

            <div className="mt-4 text-xs text-muted space-y-2">
              <p>
                MindMosaic protects your child&apos;s educational records. Immediate pausing of
                student access is self-service on the Children page.
              </p>
              <p>
                Per ADR-012, permanent account and child erasure is a verified administrative
                request with an out-of-band verification process and a 30-day grace period to
                prevent accidental loss of learning history.
              </p>
            </div>
          </section>
        </div>
      </div>
    </ParentShell>
  );
}
