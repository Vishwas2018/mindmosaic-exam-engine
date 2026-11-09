"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Info, Printer, Mail, AlertCircle } from "lucide-react";

export interface ParentSetupWizardProps {
  initialEmail?: string;
  initialParentName?: string;
}

export function ParentSetupWizard({
  initialEmail = "priya.raman@example.com",
  initialParentName = "Priya",
}: ParentSetupWizardProps) {
  const [step, setStep] = useState<"form" | "created">("form");
  const [firstName, setFirstName] = useState("");
  const [yearLevel, setYearLevel] = useState("Year 3");
  const [curriculum, setCurriculum] = useState("Victorian Curriculum v2.0");
  const [requirePin, setRequirePin] = useState(true);
  const [errorState, setErrorState] = useState<"none" | "unconfirmed" | "validation" | "duplicate">("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generated credentials on completion
  const [createdCredentials, setCreatedCredentials] = useState<{
    code: string;
    pin: string;
    name: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setErrorState("validation");
      return;
    }
    if (firstName.trim().toLowerCase() === "aisha" && errorState === "none" && false) {
      // reserved for duplicate test if needed
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCreatedCredentials({
        name: firstName.trim(),
        code: "K7XJ-2P9R",
        pin: "4 8 2 9 0 1",
      });
      setStep("created");
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Test State Selector for Reviewers / Artboards */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-royal/10 bg-white/60 p-2.5 text-xs">
        <span className="font-semibold text-muted">Preview Artboard State:</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setErrorState("none");
            }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              step === "form" && errorState === "none"
                ? "bg-royal text-white"
                : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            Normal Form (b0/b3/b4)
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("created");
              setCreatedCredentials({
                name: firstName.trim() || "Aisha",
                code: "K7XJ-2P9R",
                pin: "4 8 2 9 0 1",
              });
            }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              step === "created"
                ? "bg-royal text-white"
                : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            Child Created (b1)
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setErrorState("unconfirmed");
            }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              errorState === "unconfirmed"
                ? "bg-royal text-white"
                : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            Unconfirmed Email (b2-1)
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setErrorState("duplicate");
            }}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              errorState === "duplicate"
                ? "bg-royal text-white"
                : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            Duplicate Name (b2-3)
          </button>
        </div>
      </div>

      {/* Greeting Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {step === "created"
              ? `${createdCredentials?.name || "Aisha"} is ready`
              : `Welcome, ${initialParentName}`}
          </h1>
          <p className="mt-1 text-base text-muted sm:text-lg">
            {step === "created"
              ? "Write these down, or print them. The PIN is shown once."
              : "Your email is confirmed. One child and you are ready to go."}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          Illustrative sample family
        </span>
      </div>

      {/* Steps Navigation Bar */}
      <nav aria-label="Setup progress" className="flex items-center gap-2 text-xs font-semibold text-muted">
        <span className="sr-only">{step === "form" ? "Step 2 of 3" : "Step 3 of 3"}</span>
        <span className="text-emerald-700">Confirm your email</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted/60" aria-hidden="true" />
        <span className={step === "form" ? "font-bold text-royal" : "text-emerald-700"}>
          Add your first child
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted/60" aria-hidden="true" />
        <span className={step === "created" ? "font-bold text-royal" : "text-muted/60"}>
          Sign-in details
        </span>
      </nav>

      {/* Banners for states */}
      {errorState === "unconfirmed" ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <b className="font-semibold">Confirm your email first.</b>
            <p className="mt-0.5 text-sm">
              We sent a confirmation link to <span className="font-semibold">{initialEmail}</span>. Click that link before adding a child.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700"
              >
                Resend email
              </button>
            </div>
          </div>
        </div>
      ) : step === "created" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <div>
            <b className="font-semibold">{createdCredentials?.name || "Aisha"}&apos;s profile is created.</b>
            <span className="mt-0.5 block text-sm">
              She uses one of your three Family places. 2 places are now free.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <div>
            <b className="font-semibold">Email confirmed.</b>
            <span className="mt-0.5 block text-sm">You are signed in as {initialEmail}.</span>
          </div>
        </div>
      )}

      {/* Duplicate Name Alert (b2-3) */}
      {errorState === "duplicate" && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-950"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
          <div>
            <b className="font-semibold">You already have an Aisha in Year 3.</b>
            <p className="mt-0.5 text-sm">
              To avoid confusion when logging in, please add a last initial or choose a distinctive display name.
            </p>
          </div>
        </div>
      )}

      {/* Main Layout Row: Two columns on desktop, stacked on mobile & tablet */}
      {step === "form" ? (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Form Column (8 cols on lg) */}
          <div className="lg:col-span-8">
            <section
              aria-labelledby="h-add"
              className="rounded-2xl border border-royal/10 bg-white p-6 sm:p-8 shadow-sm"
            >
              <h2 id="h-add" className="text-xl font-bold text-ink sm:text-2xl">
                Add your first child
              </h2>
              <p className="mt-1 text-sm text-muted">
                You can add up to three on the Family plan, and change any of this later.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {/* First Name Field */}
                <div>
                  <label htmlFor="s-name" className="block text-sm font-semibold text-ink">
                    First name
                  </label>
                  <input
                    id="s-name"
                    name="s-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errorState === "validation") setErrorState("none");
                    }}
                    placeholder="Aisha"
                    aria-describedby="s-name-help"
                    aria-invalid={errorState === "validation"}
                    className={`mt-2 block w-full rounded-xl border px-3.5 py-2.5 text-base text-ink placeholder:text-muted/60 transition focus-visible:outline-none focus-visible:ring-4 ${
                      errorState === "validation"
                        ? "border-rose-400 focus-visible:ring-rose-200"
                        : "border-royal/15 focus-visible:border-royal focus-visible:ring-royal/15"
                    }`}
                  />
                  {errorState === "validation" && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-600">
                      Please enter a first name for your child.
                    </p>
                  )}
                  <p id="s-name-help" className="mt-1.5 text-xs text-muted">
                    Just a first name. This is what they see when they sign in, and it is never shown outside your family.
                  </p>
                </div>

                {/* Year Level Field */}
                <div>
                  <label htmlFor="s-year" className="block text-sm font-semibold text-ink">
                    Year level
                  </label>
                  <select
                    id="s-year"
                    name="s-year"
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    aria-describedby="s-year-help"
                    className="mt-2 block w-full rounded-xl border border-royal/15 bg-white px-3.5 py-2.5 text-base text-ink transition focus-visible:border-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                  >
                    <option value="Year 3">Year 3</option>
                    <option value="Year 5">Year 5</option>
                  </select>
                  <p id="s-year-help" className="mt-1.5 text-xs text-muted">
                    Years 3 and 5 are open now. Other years are being written and are not offered yet.
                  </p>
                </div>

                {/* Curriculum Selection */}
                <fieldset>
                  <legend className="text-sm font-semibold text-ink">Curriculum standard</legend>
                  <p className="mt-0.5 text-xs text-muted">
                    Questions follow this curriculum framework and use its terminology.
                  </p>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                    {[
                      "Victorian Curriculum v2.0",
                      "Australian Curriculum v9.0",
                      "NSW Syllabus",
                    ].map((curr) => {
                      const isSelected = curriculum === curr;
                      return (
                        <label
                          key={curr}
                          className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-xs font-semibold transition ${
                            isSelected
                              ? "border-royal bg-royal/5 text-royal ring-1 ring-royal"
                              : "border-royal/10 bg-white text-ink hover:border-royal/30"
                          }`}
                        >
                          <input
                            type="radio"
                            name="curriculum"
                            value={curr}
                            checked={isSelected}
                            onChange={() => setCurriculum(curr)}
                            className="mt-0.5 text-royal focus:ring-royal"
                          />
                          <span>{curr}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Require PIN Checkbox */}
                <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={requirePin}
                      onChange={(e) => setRequirePin(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-royal/20 text-royal focus:ring-royal"
                    />
                    <div>
                      <span className="block text-sm font-semibold text-ink">
                        Require a PIN to sign in
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        Recommended. A 6-digit PIN stops siblings from getting into each other&apos;s practice.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Submit Actions */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-royal px-6 text-sm font-extrabold text-white shadow-sm transition hover:bg-royal-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 sm:w-auto"
                  >
                    {isSubmitting ? "Creating profile..." : `Create ${firstName.trim() || "Aisha"}'s profile`}
                  </button>
                  <p className="mt-2 text-xs text-muted">
                    Nothing is saved until you submit and the server confirms it.
                  </p>
                </div>
              </form>
            </section>
          </div>

          {/* Side Rail Column (4 cols on lg) */}
          <div className="space-y-6 lg:col-span-4">
            <section
              aria-labelledby="h-next"
              className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm"
            >
              <h2 id="h-next" className="text-base font-bold text-ink">
                What happens next
              </h2>
              <ol className="mt-4 space-y-3 text-xs leading-relaxed text-muted">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-royal/10 font-bold text-royal">
                    1
                  </span>
                  <span>We create an 8-character sign-in code and a PIN for your child.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-royal/10 font-bold text-royal">
                    2
                  </span>
                  <span>They can start straight away on Year 3 or Year 5 practice.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-royal/10 font-bold text-royal">
                    3
                  </span>
                  <span>You can add another child, or change any of this, from Children later.</span>
                </li>
              </ol>
            </section>

            {/* Plan Info Card */}
            <section
              aria-labelledby="h-plan"
              className="rounded-2xl border border-royal/10 bg-royal/[0.03] p-6 text-xs text-ink"
            >
              <h2 id="h-plan" className="font-bold text-royal">
                Family membership
              </h2>
              <p className="mt-1 text-muted">
                3 student places included &middot; $24/month after 14-day trial
              </p>
              <div className="mt-3">
                <Link
                  href="/billing"
                  className="font-semibold text-royal underline underline-offset-2 hover:text-royal-deep"
                >
                  View billing details &rarr;
                </Link>
              </div>
            </section>
          </div>
        </div>
      ) : (
        /* Step 3: Child Created (b1) */
        <div className="grid gap-6 lg:grid-cols-12">
          <section
            aria-labelledby="h-creds"
            className="rounded-2xl border border-royal/10 bg-white p-6 sm:p-8 shadow-sm lg:col-span-8"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50/80 px-3 py-1.5 text-xs text-amber-950">
              <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-900">
                Preview Demonstration
              </span>
              <span>Sample credentials for design review. No live child record was created in the database.</span>
            </div>
            <h2 id="h-creds" className="text-xl font-bold text-ink sm:text-2xl">
              How {createdCredentials?.name || "Aisha"} signs in
            </h2>
            <p className="mt-1 text-sm text-muted">
              She goes to the same sign-in page you use and chooses &ldquo;I&apos;m a student&rdquo;.
            </p>

            {/* Code & PIN Tiles */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-royal/10 bg-royal/[0.02] p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Login code</p>
                <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-ink sm:text-3xl">
                  {createdCredentials?.code || "K7XJ-2P9R"}
                </p>
                <p className="mt-2 text-xs text-muted">Never changes</p>
              </div>

              <div className="rounded-2xl border border-royal/10 bg-royal/[0.02] p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">PIN</p>
                <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-royal sm:text-3xl">
                  {createdCredentials?.pin || "4 8 2 9 0 1"}
                </p>
                <p className="mt-2 text-xs text-muted">Shown once &middot; you can reset it</p>
              </div>
            </div>

            {/* Security note */}
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-royal/15 bg-royal/[0.04] p-4 text-xs leading-relaxed text-ink">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-royal" aria-hidden="true" />
              <div>
                We keep only a scrambled cryptographic copy of the PIN, so we cannot show it to you again. If it is lost, reset it from {createdCredentials?.name || "Aisha"}&apos;s profile &mdash; that takes a few seconds and loses nothing.
              </div>
            </div>

            {/* Print / Email Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => alert("Print sign-in card preview")}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-royal/15 bg-white px-4 text-xs font-bold text-ink transition hover:border-royal hover:text-royal"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print a sign-in card
              </button>
              <button
                type="button"
                onClick={() => alert("Email details preview")}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-transparent px-4 text-xs font-bold text-royal transition hover:bg-royal/5"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email these to me
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              <span className="mr-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800">
                NEEDS A BUILD
              </span>
              printing and email dispatch both require external template infrastructure; neither is enabled in preview.
            </p>

            {/* Primary Navigation to Family Overview */}
            <div className="mt-8 border-t border-royal/8 pt-6">
              <Link
                href="/parent"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-royal px-6 text-sm font-extrabold text-white shadow-sm transition hover:bg-royal-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 sm:w-auto"
              >
                Continue to Family Overview &rarr;
              </Link>
            </div>
          </section>

          {/* Right Rail: Places summary */}
          <div className="space-y-6 lg:col-span-4">
            <section
              aria-labelledby="h-places-summary"
              className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm"
            >
              <h2 id="h-places-summary" className="text-base font-bold text-ink">
                Paid places
              </h2>
              <p className="mt-1 text-xs text-muted">
                1 of 3 places used on your Family plan. 2 places are available for other children.
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-royal/10" aria-hidden="true">
                <div className="h-full bg-royal" style={{ width: "33%" }} />
              </div>
              <p className="mt-3 text-xs text-muted">
                A place is what lets a child sign in. You can add more children anytime from the Children tab.
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
