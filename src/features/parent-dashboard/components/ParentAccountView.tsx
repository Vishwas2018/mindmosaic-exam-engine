"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  CreditCard,
  Bell,
  Laptop,
  Download,
  AlertTriangle,
  PauseCircle,
  Trash2,
  ArrowRight,
  Info,
} from "lucide-react";
import { PREVIEW_FAMILY_PLAN } from "../fixtures";

export interface ParentAccountViewProps {
  initialEmail?: string;
  initialName?: string;
  isLiveAccount?: boolean;
}

export function ParentAccountView({
  initialEmail = "priya.raman@example.com",
  initialName = "Priya Raman",
  isLiveAccount = false,
}: ParentAccountViewProps) {
  const email = initialEmail;
  const name = initialName;

  // Preference toggles
  const [weeklyProgress, setWeeklyProgress] = useState(true);
  const [newPracticeAlerts, setNewPracticeAlerts] = useState(false);

  // Email change modal/state (b24-1)
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailChangeStatus, setEmailChangeStatus] = useState<"idle" | "sent">("idle");

  // Deletion modal/state (b24-4, ADR-012, NO 30-day wording)
  const [deletionStatus, setDeletionStatus] = useState<"idle" | "requested">("idle");

  // Pause all proposal toggle
  const [pauseAllProposal, setPauseAllProposal] = useState(false);

  const handleRequestEmailChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput.trim()) return;
    setEmailChangeStatus("sent");
  };

  return (
    <div className="space-y-6">
      {/* Test State Selector for Reviewers / Artboards - isolated to preview demonstrations */}
      {!isLiveAccount && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-royal/10 bg-white/60 p-2.5 text-xs">
          <span className="font-semibold text-muted">Preview Artboard State:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setShowEmailChange(false);
                setEmailChangeStatus("idle");
                setDeletionStatus("idle");
              }}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                !showEmailChange && deletionStatus === "idle"
                  ? "bg-royal text-white"
                  : "bg-royal/5 text-muted hover:text-royal"
              }`}
            >
              Normal Account (b23/b26)
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEmailChange(true);
                setEmailChangeStatus("idle");
              }}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                showEmailChange && emailChangeStatus === "idle"
                  ? "bg-royal text-white"
                  : "bg-royal/5 text-muted hover:text-royal"
              }`}
            >
              Change Email (b24-1)
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEmailChange(true);
                setEmailChangeStatus("sent");
              }}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                emailChangeStatus === "sent"
                  ? "bg-royal text-white"
                  : "bg-royal/5 text-muted hover:text-royal"
              }`}
            >
              Email Confirmation Sent (b24-1)
            </button>
            <button
              type="button"
              onClick={() => {
                setDeletionStatus("requested");
                setShowEmailChange(false);
              }}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                deletionStatus === "requested"
                  ? "bg-royal text-white"
                  : "bg-royal/5 text-muted hover:text-royal"
              }`}
            >
              Verified Deletion Requested (b24-4)
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Account</h1>
          <p className="mt-1 text-base text-muted sm:text-lg">
            Your details, subscription plan, security, and preferences.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          Illustrative sample family
        </span>
      </div>

      {/* Section 1: Your Details (b23) */}
      <section
        aria-labelledby="h-profile-details"
        className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-7"
      >
        <div className="flex items-center justify-between border-b border-royal/8 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/8 text-royal">
              <User className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="h-profile-details" className="text-lg font-bold text-ink">
                Your details
              </h2>
              <p className="text-xs text-muted">Primary guardian account credentials</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-muted">Guardian name</label>
            <p className="mt-1 text-sm font-bold text-ink">{name}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted">Email address</label>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">{email}</p>
              <button
                type="button"
                onClick={() => setShowEmailChange(true)}
                className="text-xs font-bold text-royal underline underline-offset-2 hover:text-royal-deep"
              >
                Change email
              </button>
            </div>
          </div>
        </div>

        {/* Inline Email Change Flow (b24-1) */}
        {showEmailChange && (
          <div className="mt-5 rounded-xl border border-royal/15 bg-royal/[0.02] p-4 text-xs">
            <h3 className="font-bold text-ink">Change guardian email address</h3>
            <p className="mt-0.5 text-muted">
              We will send a confirmation link to your new address. Your email will not update until you click that link.
            </p>

            {emailChangeStatus === "sent" ? (
              <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50/80 p-3 text-amber-950">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-900">
                    Preview Demonstration
                  </span>
                  <span className="font-bold text-xs text-amber-950">Email confirmation state preview</span>
                </div>
                <p className="mt-1 text-[11px] text-amber-900 leading-relaxed">
                  Demonstration only. In this preview, no email was dispatched and your account address remains <span className="font-semibold">{email}</span>. Email change API integration is deferred.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestEmailChange} className="mt-3 flex flex-wrap gap-2">
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="new.email@example.com"
                  className="min-w-64 flex-1 rounded-lg border border-royal/15 px-3 py-1.5 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-royal px-4 py-1.5 text-xs font-bold text-white transition hover:bg-royal-deep"
                >
                  Send confirmation link
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailChange(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-muted hover:bg-royal/5"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}
      </section>

      {/* Section 2: Subscription & Billing Handoff Card (b25) */}
      <section
        id="billing"
        aria-labelledby="h-plan-billing"
        className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-7"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-royal/8 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/8 text-royal">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="h-plan-billing" className="text-lg font-bold text-ink">
                Plan &amp; billing
              </h2>
              <p className="text-xs text-muted">Family membership capacity, card, and invoices</p>
            </div>
          </div>
          <Link
            href="/billing"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-royal px-4 text-xs font-bold text-white transition hover:bg-royal-deep self-start sm:self-center"
          >
            <span>Manage on Billing</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <p className="text-xs font-semibold text-muted">Current membership</p>
            <p className="mt-1 text-base font-bold text-ink">{PREVIEW_FAMILY_PLAN.planName}</p>
            <p className="mt-0.5 text-xs text-muted">{PREVIEW_FAMILY_PLAN.priceFormatted}</p>
          </div>

          <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
            <p className="text-xs font-semibold text-muted">Active seat capacity</p>
            <p className="mt-1 text-base font-bold text-royal">
              {PREVIEW_FAMILY_PLAN.activePlaces} of {PREVIEW_FAMILY_PLAN.maxPlaces} places in use
            </p>
            <p className="mt-0.5 text-xs text-muted">
              1 place free for another child &middot; profiles are separate
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted">
          Invoices, receipt history, and card details are securely powered by Stripe. Use the Manage button above to update payment methods or view tax invoices.
        </p>
      </section>

      {/* Section 3: Notification Preferences (Decision P12) */}
      <section
        aria-labelledby="h-notifs"
        className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-7"
      >
        <div className="flex items-center gap-3 border-b border-royal/8 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/8 text-royal">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="h-notifs" className="text-lg font-bold text-ink">
              Email preferences
            </h2>
            <p className="text-xs text-muted">Choose what notifications we send to your inbox</p>
          </div>
        </div>

        <div className="mt-5 divide-y divide-royal/8">
          {/* Mandatory billing notices (Decision P12) */}
          <div className="flex items-start justify-between gap-4 py-3.5">
            <div>
              <p className="text-sm font-bold text-ink">Billing &amp; security notices</p>
              <p className="mt-0.5 text-xs text-muted">
                Tax invoices, card payment failure alerts, and password resets.
              </p>
              <span className="mt-1 inline-block text-[11px] font-semibold text-royal">
                Cannot be disabled &middot; required for account operation
              </span>
            </div>
            <input
              type="checkbox"
              checked
              disabled
              aria-label="Billing notices mandatory"
              className="mt-1 h-4 w-4 rounded border-royal/20 text-royal opacity-60 cursor-not-allowed"
            />
          </div>

          {/* Opt-in Weekly progress */}
          <div className="flex items-start justify-between gap-4 py-3.5">
            <div>
              <label htmlFor="pref-weekly" className="text-sm font-bold text-ink cursor-pointer">
                Weekly progress summary
              </label>
              <p className="mt-0.5 text-xs text-muted">
                A weekly recap of papers finished and marks earned across your children.
              </p>
            </div>
            <input
              id="pref-weekly"
              type="checkbox"
              checked={weeklyProgress}
              onChange={(e) => setWeeklyProgress(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-royal/20 text-royal focus:ring-royal cursor-pointer"
            />
          </div>

          {/* Opt-in Practice alerts */}
          <div className="flex items-start justify-between gap-4 py-3.5">
            <div>
              <label htmlFor="pref-alerts" className="text-sm font-bold text-ink cursor-pointer">
                New practice alerts
              </label>
              <p className="mt-0.5 text-xs text-muted">
                Updates when new curriculum papers or writing prompts are published.
              </p>
            </div>
            <input
              id="pref-alerts"
              type="checkbox"
              checked={newPracticeAlerts}
              onChange={(e) => setNewPracticeAlerts(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-royal/20 text-royal focus:ring-royal cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* Section 4: Devices & Sessions (b24-2) */}
      <section
        aria-labelledby="h-devices"
        className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-7"
      >
        <div className="flex items-center gap-3 border-b border-royal/8 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/8 text-royal">
            <Laptop className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="h-devices" className="text-lg font-bold text-ink">
              Active sessions
            </h2>
            <p className="text-xs text-muted">Devices currently signed into this guardian account</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-royal/[0.02] p-4 text-xs font-semibold text-ink">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
              <div>
                <p className="font-bold text-ink">Current browser session</p>
                <p className="mt-0.5 text-muted">Chrome on Windows &middot; Active now</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
              This device
            </span>
          </div>

          <p className="text-[11px] text-muted">
            <span className="mr-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800">
              NEEDS A BUILD
            </span>
            remote multi-device session revocation requires future Supabase auth management API endpoints; currently active on this browser.
          </p>
        </div>
      </section>

      {/* Section 5: Data Export & Danger Zone (b24-3, b24-4, ADR-012, NO 30-day wording) */}
      <section
        aria-labelledby="h-danger"
        className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 shadow-sm sm:p-7"
      >
        <div className="flex items-center gap-3 border-b border-rose-200 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="h-danger" className="text-lg font-bold text-rose-950">
              Data, pause &amp; account deletion
            </h2>
            <p className="text-xs text-rose-900/80">Reversible pausing vs permanent erasure</p>
          </div>
        </div>

        <div className="mt-5 space-y-6">
          {/* Export Data */}
          <div>
            <h3 className="text-sm font-bold text-ink">Export your family data</h3>
            <p className="mt-0.5 text-xs text-muted">
              Request a full machine-readable copy of your student responses and account records.
            </p>
            <div className="mt-3">
              <a
                href="mailto:privacy@mindmosaic.app?subject=Data%20Export%20Request"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-royal/15 bg-white px-4 text-xs font-bold text-ink transition hover:border-royal hover:text-royal"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Request data archive</span>
              </a>
            </div>
          </div>

          {/* Pause All Proposal */}
          <div className="border-t border-rose-200/60 pt-5">
            <h3 className="text-sm font-bold text-ink">Pause every child&apos;s access</h3>
            <p className="mt-0.5 text-xs text-muted">
              Temporarily stops student logins across all children without deleting records or losing marks.
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setPauseAllProposal(!pauseAllProposal)}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-xs font-bold text-amber-900 transition hover:bg-amber-50"
              >
                <PauseCircle className="h-4 w-4" aria-hidden="true" />
                <span>{pauseAllProposal ? "Children access paused" : "Pause all children"}</span>
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              <span className="mr-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800">
                DEFERRED
              </span>
              Bulk pause requires future backend endpoint; per-child pause is available on Children profiles today.
            </p>
          </div>

          {/* Verified Account Deletion (ADR-012 model, strictly NO 30-day timeframe) */}
          <div className="border-t border-rose-200/60 pt-5">
            <h3 className="text-sm font-bold text-rose-950">Verified account erasure</h3>
            <p className="mt-1 text-xs leading-relaxed text-rose-900/80">
              Account deletion is an administrative verified erasure request (ADR-012) requiring guardian confirmation. Once confirmed, all student attempt histories, profiles, and guardian credentials are permanently removed from our databases.
            </p>

            {deletionStatus === "requested" ? (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-950">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-900">
                    Preview Demonstration
                  </span>
                  <span className="font-bold text-amber-950">Erasure request state demonstration</span>
                </div>
                <p className="mt-1 text-xs text-amber-900 leading-relaxed">
                  Demonstration only. In this preview, no request was written to the database, no email was sent, and no account data has changed. In production, administrative erasure requires guardian email confirmation under ADR-012.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setDeletionStatus("requested")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-600 px-5 text-xs font-bold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span>Request verified account deletion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
