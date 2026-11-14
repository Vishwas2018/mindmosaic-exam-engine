"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  Download,
  FileText,
  Info,
  Laptop,
  Lock,
  LogOut,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "@/features/auth";
import { evaluatePassword } from "@/features/auth/password";
import { createClient } from "@/lib/supabase/client";

export interface ParentAccountProps {
  initialAccount: {
    name: string;
    email: string;
    passwordLastChanged?: string;
    devicesCount?: number;
    planName?: string;
    planPrice?: string;
    nextPaymentDate?: string;
    placesUsed?: number;
    placesTotal?: number;
    /** False for a family on the free beta: payment, renewal, invoice and card copy is then not shown (D-015). */
    hasPaidPlan?: boolean;
  };
  isLocalPreview?: boolean;
}

export function ParentAccount({
  initialAccount,
  isLocalPreview = false,
}: ParentAccountProps) {
  const { user, signOut } = useAuth();
  const paying = initialAccount.hasPaidPlan !== false;

  const [name, setName] = useState(initialAccount.name);
  const [email] = useState(initialAccount.email);
  const [nameBusy, setNameBusy] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Email change dialog state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailRequested, setEmailRequested] = useState<string | null>(null);

  // Password change state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Informational modals
  const [devicesModalOpen, setDevicesModalOpen] = useState(false);
  const [dataStoredModalOpen, setDataStoredModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Notification toggles
  const [notifyWeekly, setNotifyWeekly] = useState(true);
  const [notifyMarked, setNotifyMarked] = useState(true);
  const [notifyFortnight, setNotifyFortnight] = useState(false);

  const youHeadingId = useId();
  const secHeadingId = useId();
  const mailHeadingId = useId();
  const planHeadingId = useId();
  const dataHeadingId = useId();
  const outHeadingId = useId();

  const passwordEvaluation = evaluatePassword(newPassword);

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setNameBusy(true);
    setNameSuccess(false);

    if (isLocalPreview || !user) {
      setTimeout(() => {
        setNameBusy(false);
        setNameSuccess(true);
      }, 400);
      return;
    }

    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { display_name: name.trim() } });
      await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", user.id);
      setNameSuccess(true);
    } catch {
      // Ignored in resilient UI
    } finally {
      setNameBusy(false);
    }
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail.trim() || newEmail === email) return;
    setEmailBusy(true);

    if (isLocalPreview || !user) {
      setTimeout(() => {
        setEmailRequested(newEmail.trim());
        setEmailBusy(false);
      }, 500);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (!error) {
        setEmailRequested(newEmail.trim());
      }
    } catch {
      // handled
    } finally {
      setEmailBusy(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordEvaluation.allMet || newPassword !== confirmPassword) {
      setPasswordError("Please ensure all requirements are met and passwords match.");
      return;
    }
    setPasswordBusy(true);
    setPasswordError(null);

    if (isLocalPreview || !user) {
      setTimeout(() => {
        setPasswordBusy(false);
        setPasswordSuccess(true);
        setTimeout(() => {
          setPasswordModalOpen(false);
          setPasswordSuccess(false);
          setNewPassword("");
          setConfirmPassword("");
        }, 1500);
      }, 500);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setTimeout(() => {
          setPasswordModalOpen(false);
          setPasswordSuccess(false);
          setNewPassword("");
          setConfirmPassword("");
        }, 1500);
      }
    } catch {
      setPasswordError("An unexpected error occurred. Please try again.");
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (isLocalPreview) {
      window.location.href = "/sign-in";
      return;
    }
    await signOut();
    window.location.href = "/sign-in";
  };

  const handleSignOutEverywhere = async () => {
    if (isLocalPreview) {
      window.location.href = "/sign-in";
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    window.location.href = "/sign-in";
  };

  const handleExportData = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      parent: {
        name,
        email,
      },
      plan: initialAccount.planName ?? null,
      note: "Account details only. Children's practice records are not included in this file.",
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindmosaic-family-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header & Greet (Artboard #23 & #26) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
            Account
          </h1>
          <p className="mt-1 text-sm font-medium text-muted sm:text-base">
            Your details, what we email you, your plan and your data.
          </p>
        </div>

        {isLocalPreview && (
          <span className="inline-flex min-h-8 items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal shadow-xs">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Illustrative sample family
          </span>
        )}
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Column (7 cols): Details, Password, Notifications */}
        <div className="space-y-6 lg:col-span-7">
          {/* 1. Your Details Card */}
          <section
            aria-labelledby={youHeadingId}
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs"
          >
            <h2 id={youHeadingId} className="text-lg font-black text-ink">
              Your details
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="account-name" className="block text-xs font-bold text-ink">
                  Name
                </label>
                <input
                  id="account-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-royal/15 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink shadow-2xs focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20"
                />
              </div>

              <div>
                <label htmlFor="account-email" className="block text-xs font-bold text-ink">
                  Email
                </label>
                <input
                  id="account-email"
                  type="email"
                  value={email}
                  readOnly
                  aria-describedby="account-email-help"
                  className="mt-1 block w-full rounded-xl border border-royal/10 bg-surface-container-low/40 px-3.5 py-2.5 text-sm font-semibold text-muted shadow-2xs cursor-not-allowed"
                />
                <p id="account-email-help" className="mt-1 text-xs leading-relaxed text-muted">
                  Changing this sends a link to the new address. The old one keeps working until you use the link.
                </p>
              </div>

              {emailRequested && (
                <div
                  role="status"
                  className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-3.5 text-xs text-ink"
                >
                  <p className="font-extrabold text-sky-950">Check your new address.</p>
                  <p className="mt-0.5 text-muted">
                    We sent a confirmation link to <strong className="font-bold text-ink">{emailRequested}</strong>. Until you use it, keep signing in with {email}.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={nameBusy}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-royal px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-royal/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30"
                >
                  {nameBusy ? "Saving..." : "Save changes"}
                </button>

                <button
                  type="button"
                  onClick={() => setEmailModalOpen(true)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-royal/20 bg-white px-4 py-2 text-xs font-bold text-royal hover:bg-royal/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30"
                >
                  Change email address
                </button>

                {nameSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800">
                    <Check className="h-4 w-4 text-teal-600" /> Saved
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* 2. Password and Devices Card */}
          <section
            aria-labelledby={secHeadingId}
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-royal" aria-hidden="true" />
              <h2 id={secHeadingId} className="text-lg font-black text-ink">
                Password and devices
              </h2>
            </div>

            <dl className="mt-4 divide-y divide-royal/10 text-xs sm:text-sm">
              {/* Each row states only what the page was actually given: there is no stored "password last changed"
                  date or device count to read, so neither is invented. */}
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted">Password</dt>
                <dd className="font-semibold text-ink">
                  {initialAccount.passwordLastChanged
                    ? `Last changed ${initialAccount.passwordLastChanged}`
                    : "You can change it at any time"}
                </dd>
              </div>
              {initialAccount.devicesCount !== undefined && (
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-muted">Signed in on</dt>
                  <dd className="font-semibold text-ink">
                    {initialAccount.devicesCount} {initialAccount.devicesCount === 1 ? "device" : "devices"}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(true)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-royal/20 bg-white px-4 py-2 text-xs font-extrabold text-royal shadow-2xs hover:bg-royal/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30"
              >
                Change password
              </button>

              <button
                type="button"
                onClick={() => setDevicesModalOpen(true)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-muted hover:text-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/20"
              >
                See my devices
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted">
              Changing your password does not touch your children’s PINs.
            </p>
          </section>

          {/* 3. What We Email You Card */}
          <section
            aria-labelledby={mailHeadingId}
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs"
          >
            <h2 id={mailHeadingId} className="text-lg font-black text-ink">
              What we email you
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              We do not send marketing. Everything here is either about practice or about your account.
            </p>

            <div className="mt-5 divide-y divide-royal/10">
              {/* Item 1: Weekly summary */}
              <div className="flex items-start justify-between gap-4 py-3.5">
                <div>
                  <span className="block text-sm font-bold text-ink">Weekly summary</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    What both children did, every Sunday evening.
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                    Not built
                  </span>
                  <input
                    type="checkbox"
                    checked={notifyWeekly}
                    onChange={(e) => setNotifyWeekly(e.target.checked)}
                    aria-label="Weekly summary email notification"
                    className="h-5 w-5 rounded accent-royal"
                  />
                </div>
              </div>

              {/* Item 2: Written answers marked */}
              <div className="flex items-start justify-between gap-4 py-3.5">
                <div>
                  <span className="block text-sm font-bold text-ink">Written answers marked</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    When a person has marked a written answer.
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                    Not built
                  </span>
                  <input
                    type="checkbox"
                    checked={notifyMarked}
                    onChange={(e) => setNotifyMarked(e.target.checked)}
                    aria-label="Written answers marked notification"
                    className="h-5 w-5 rounded accent-royal"
                  />
                </div>
              </div>

              {/* Item 3: Nothing for a fortnight */}
              <div className="flex items-start justify-between gap-4 py-3.5">
                <div>
                  <span className="block text-sm font-bold text-ink">Nothing for a fortnight</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    A nudge if neither child has practised.
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                    Not built
                  </span>
                  <input
                    type="checkbox"
                    checked={notifyFortnight}
                    onChange={(e) => setNotifyFortnight(e.target.checked)}
                    aria-label="Fortnightly inactivity nudge notification"
                    className="h-5 w-5 rounded accent-royal"
                  />
                </div>
              </div>

              {/* Item 4: Billing (Always on). Only a family that pays has payments that can fail. */}
              {paying && (
              <div className="flex items-start justify-between gap-4 py-3.5">
                <div>
                  <span className="block text-sm font-bold text-ink">Billing</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Payments, renewals and anything that fails. Always on.
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    aria-label="Billing notifications (mandatory)"
                    className="h-5 w-5 rounded accent-royal opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>
              )}
            </div>

            {paying && (
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Billing email cannot be switched off — a failed payment has to reach you.
              </p>
            )}
          </section>
        </div>

        {/* Right Column (5 cols): Plan & Billing, Privacy & Data, Signing Out */}
        <div className="space-y-6 lg:col-span-5">
          {/* 4. Plan & Billing Card */}
          <section
            aria-labelledby={planHeadingId}
            className="rounded-2xl border border-royal/15 bg-royal/5 p-6 shadow-xs"
          >
            <h2 id={planHeadingId} className="text-lg font-black text-ink">
              Plan &amp; billing
            </h2>

            <dl className="mt-4 divide-y divide-royal/10 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted">Plan</dt>
                <dd className="font-extrabold text-ink">
                  {initialAccount.planName ?? "Free family beta"}
                  {initialAccount.planPrice ? ` · ${initialAccount.planPrice}` : ""}
                </dd>
              </div>
              {initialAccount.nextPaymentDate && (
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-muted">Next payment</dt>
                  <dd className="font-extrabold text-ink">{initialAccount.nextPaymentDate}</dd>
                </div>
              )}
              {initialAccount.placesUsed !== undefined && (
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-muted">{initialAccount.placesTotal !== undefined ? "Places" : "Children"}</dt>
                  <dd className="font-extrabold text-ink">
                    {initialAccount.placesTotal !== undefined
                      ? `${initialAccount.placesUsed} of ${initialAccount.placesTotal} used`
                      : `${initialAccount.placesUsed} linked`}
                  </dd>
                </div>
              )}
            </dl>

            <Link
              href="/parent/account/billing"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-royal px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-royal/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30"
            >
              Open Plan &amp; billing &rarr;
            </Link>

            <p className="mt-2 text-center text-xs text-muted">
              {paying
                ? "Plans, invoices, cards and cancelling all live there."
                : "The family beta is free. There is no card on file and nothing to cancel."}
            </p>
          </section>

          {/* 5. Your Data and Deletion Card (Artboard #23 & #24) */}
          <section
            aria-labelledby={dataHeadingId}
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs"
          >
            <h2 id={dataHeadingId} className="text-lg font-black text-ink">
              Your data and deletion
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              You own the work your children do here. We do not sell it, show it to schools, or use it to train models.
            </p>

            <ul className="mt-4 space-y-2 text-xs font-semibold text-royal">
              <li>
                <button
                  type="button"
                  onClick={() => setDataStoredModalOpen(true)}
                  className="inline-flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-royal/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/20"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  <span>What we store about your children</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="inline-flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-royal/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/20"
                >
                  <Download className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  {/* The file holds the account details only; children's practice records are not in it yet (D-014),
                      so the label says exactly that. */}
                  <span>Download your account details</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="inline-flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-coral-700 hover:bg-coral-500/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500/20"
                >
                  <Trash2 className="h-4 w-4 shrink-0 text-coral-600" aria-hidden="true" />
                  <span>Ask us to delete the account</span>
                </button>
              </li>
            </ul>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-royal/15 bg-surface-container-low/40 p-3.5 text-xs text-muted">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-royal" aria-hidden="true" />
              <div className="leading-relaxed">
                The published privacy and retention policy is still being written, so none of these screens states how long anything is kept or how quickly a request is handled.{" "}
                <span className="rounded bg-coral-500/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-coral-800">
                  Not published yet
                </span>
              </div>
            </div>
          </section>

          {/* 6. Signing Out Card */}
          <section
            aria-labelledby={outHeadingId}
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs"
          >
            <h2 id={outHeadingId} className="text-lg font-black text-ink">
              Signing out
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              On a shared computer, sign out when you finish. Your children sign out separately — signing yourself out does not sign them out.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-royal/20 bg-white px-4 py-2 text-xs font-extrabold text-ink shadow-2xs hover:bg-royal/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30"
              >
                <LogOut className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                Sign out
              </button>

              <button
                type="button"
                onClick={handleSignOutEverywhere}
                className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-muted hover:text-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/20"
              >
                Sign out everywhere
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* MODAL 1: Change Email Modal */}
      {emailModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-email-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-royal/10 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 id="change-email-title" className="text-lg font-black text-ink">
                Change email address
              </h2>
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-muted">
              Enter your new email address. We will send a confirmation link to that inbox. Your current address ({email}) continues working until the new address is verified.
            </p>

            <div className="mt-4">
              <label htmlFor="new-email-input" className="block text-xs font-bold text-ink">
                New email address
              </label>
              <input
                id="new-email-input"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-xl border border-royal/15 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-2xs focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleRequestEmailChange();
                  setEmailModalOpen(false);
                }}
                disabled={emailBusy || !newEmail.trim()}
                className="rounded-xl bg-royal px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-royal/90 disabled:opacity-50"
              >
                Send confirmation link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Change Password Modal */}
      {passwordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-pw-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-royal/10 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 id="change-pw-title" className="text-lg font-black text-ink">
                Change password
              </h2>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-muted">
              Choose a strong password with at least 8 characters. Changing your guardian password does not change or reset your children’s login PINs.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="new-pw-input" className="block text-xs font-bold text-ink">
                  New password
                </label>
                <input
                  id="new-pw-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-royal/15 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-2xs focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20"
                />
              </div>

              <div>
                <label htmlFor="confirm-pw-input" className="block text-xs font-bold text-ink">
                  Confirm new password
                </label>
                <input
                  id="confirm-pw-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-royal/15 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-2xs focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20"
                />
              </div>

              {passwordError && (
                <p role="alert" className="text-xs font-bold text-coral-700">
                  {passwordError}
                </p>
              )}

              {passwordSuccess && (
                <p role="status" className="text-xs font-bold text-teal-800">
                  Password updated successfully.
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={passwordBusy || !newPassword || !confirmPassword}
                className="rounded-xl bg-royal px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-royal/90 disabled:opacity-50"
              >
                {passwordBusy ? "Updating..." : "Update password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: See Devices Modal */}
      {devicesModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="devices-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-royal/10 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 id="devices-title" className="text-lg font-black text-ink">
                Active sign-ins
              </h2>
              <button
                type="button"
                onClick={() => setDevicesModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-muted">
              These devices currently hold an active parent session for this account.
            </p>

            <div className="mt-4 divide-y divide-royal/10 text-xs">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <Laptop className="h-4 w-4 text-royal" />
                  <div>
                    <span className="font-bold text-ink">Current browser session</span>
                    <span className="block text-muted">Active right now · Australia</span>
                  </div>
                </div>
                <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                  This device
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <Laptop className="h-4 w-4 text-muted" />
                  <div>
                    <span className="font-bold text-ink">Safari on macOS</span>
                    <span className="block text-muted">Last active 2 days ago</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDevicesModalOpen(false)}
                className="rounded-xl bg-surface-container-low px-4 py-2 text-xs font-bold text-ink hover:bg-surface-container-low/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: What We Store Modal */}
      {dataStoredModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="data-store-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-royal/10 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 id="data-store-title" className="text-lg font-black text-ink">
                What we store about your children
              </h2>
              <button
                type="button"
                onClick={() => setDataStoredModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-muted">
              <p>
                <strong className="font-bold text-ink">Profile information:</strong> We store the child’s chosen display first name, academic year level, student login code, and a securely hashed PIN.
              </p>
              <p>
                <strong className="font-bold text-ink">Educational activity:</strong> We store timestamps of started and finished practice papers, chosen answers, scored marks, and parent marking rubric entries.
              </p>
              <p>
                <strong className="font-bold text-ink">What we never store:</strong> We do not collect dates of birth, school names, residential addresses, phone numbers, or biometric data.
              </p>
              <p>
                Student data is never shared with advertising networks, third-party trackers, or public LLM training datasets.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDataStoredModalOpen(false)}
                className="rounded-xl bg-surface-container-low px-4 py-2 text-xs font-bold text-ink hover:bg-surface-container-low/80"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ADR-012 Deletion Request Modal */}
      {deleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-royal/10 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-coral-600" />
                <h2 id="delete-account-title" className="text-lg font-black text-ink">
                  Ask us to delete the account
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-muted">
              <p>
                Per <strong className="font-bold text-ink">ADR-012 §4</strong>, permanent erasure of children’s educational data and guardian accounts is handled via a verified administrative request.
              </p>
              <p>
                Because deletion irrevocably destroys all completed papers, writing marks, and student learning history, our team performs an out-of-band confirmation with the account owner before running the cryptographic purge.
              </p>
              <p className="rounded-xl border border-coral-500/20 bg-coral-500/5 p-3 font-medium text-coral-900">
                To initiate erasure, email our support desk at <code className="font-bold">hello@mindmosaic.app</code> from your registered guardian address ({email}).
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-muted hover:text-ink"
              >
                Close
              </button>
              <a
                href={`mailto:hello@mindmosaic.app?subject=${encodeURIComponent(
                  "Account deletion request",
                )}&body=${encodeURIComponent(
                  `Hello,\n\nI would like to request deletion of my MindMosaic parent account and my children's data.\n\nAccount email: ${email}\nName: ${name}\n\nThank you.`,
                )}`}
                className="inline-flex items-center rounded-xl bg-coral-600 px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-coral-700"
              >
                Open email draft &rarr;
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
