"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { FAMILY_PLAN } from "@/lib/billing/prices";

import { useAuth } from "../AuthProvider";
import { evaluatePassword } from "../password";
import {
  MmCheckbox,
  MmErrorPanel,
  MmField,
  MmRevealButton,
  mmAuthButton,
  mmFocus,
} from "./auth-fields";
import { EmailConfirmationPending } from "./EmailConfirmationPending";

/**
 * Sign up — design handoff screen 7. Three steps in one card, with the step
 * tracker living in the plum panel beside it (rendered by the page, driven
 * by the `step` this component reports up through `onStepChange`).
 *
 * Reconciled against the real product (DESIGN_AUDIT.md §4, §7). What
 * changed from the design file, and why:
 *
 *  1. **The account is created at the END, not the start.** The design
 *     treats all three steps as one form. In reality `signUp` creates the
 *     parent in Supabase, and `provisionChild` — the only way a student
 *     profile can exist — requires an authenticated parent session. So the
 *     order is: collect everything, create the parent, then (if a session
 *     came back immediately) create the student.
 *  2. **Email confirmation can interrupt step 2's outcome.** If Supabase is
 *     configured to confirm emails, there is no session after sign-up and
 *     no child can be provisioned yet. That is not hidden: the confirmation
 *     screen says the student will be added from the parent view, because
 *     silently dropping the name that was just typed in is worse.
 *  3. **Year levels 1-12 all render** as the design specifies, but only the
 *     ones with a question bank behind them are selectable. The rest carry
 *     a written "no content yet" note — never colour alone. Today that is
 *     Years 3 and 5 (see ../provision-child.ts, which rejects anything else
 *     outright).
 *  4. **The password meter is driven by the real rules** in ../password.ts
 *     (8+ chars, upper, lower, number, symbol — all required), rendered in
 *     the design's bar-plus-label form. The design's length-only bands
 *     would have shown "Strong" on a password the server then rejects.
 *  5. **Singapore Maths is marked as being confirmed**, because no
 *     Singapore Maths content exists in the bank. Same convention the
 *     marketing surface already uses for unconfirmed coverage.
 */

export const SIGN_UP_STEPS = [
  {
    name: "Parent account",
    heading: "Create the parent account",
    blurb: "The parent or guardian owns the account. Student profiles sit under it.",
    railBody: "Email, password and consent",
  },
  {
    name: "Add a student",
    heading: "Add your first student",
    blurb: "A first name, an initial and a year level is all a student profile holds.",
    railBody: "First name, year level, state",
  },
  {
    name: "First programme",
    heading: "Choose where to start",
    blurb: "This sets the first session. Everything else stays available.",
    railBody: "Pathway or exam programme",
  },
] as const;

/** Year levels with a real question bank behind them. */
const YEARS_WITH_CONTENT = new Set([3, 5]);

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

const PROGRAMMES = [
  {
    id: "australian-curriculum",
    title: "Australian Curriculum",
    body: "Year-level practice across numeracy, reading and language conventions, sequenced by skill.",
    href: "/practice",
    available: true,
  },
  {
    id: "singapore-maths",
    title: "Singapore Maths",
    body: "Model drawing and problem solving. Content for this pathway is still being written.",
    href: "/practice",
    available: false,
  },
  {
    id: "exam-style",
    title: "Exam-style preparation",
    body: "NAPLAN- and ICAS-style papers under exam conditions, with results and explanations after submission.",
    href: "/practice?style=naplan_style",
    available: true,
  },
  {
    id: "placement",
    title: "Let the platform decide",
    body: "A short mixed diagnostic picks the starting point from the year level given.",
    href: "/practice/session?subject=mixed&count=15",
    available: true,
  },
] as const;

/** The design's four-band meter, driven by the real five-rule evaluation. */
function meterFor(password: string) {
  const { strength, metCount, total } = evaluatePassword(password);
  switch (strength) {
    case "empty":
      return { label: "", width: "0%", fill: "bg-mm-line-soft", text: "text-mm-muted-2" };
    case "weak":
      return {
        label: `Too weak · ${metCount}/${total}`,
        width: "30%",
        fill: "bg-mm-coral",
        text: "text-mm-coral-text",
      };
    case "fair":
      return {
        label: `Getting there · ${metCount}/${total}`,
        width: "65%",
        fill: "bg-mm-lilac",
        text: "text-mm-brand",
      };
    default:
      return { label: "Strong", width: "100%", fill: "bg-mm-brand", text: "text-mm-brand" };
  }
}

interface ChildResponse {
  readonly ok: boolean;
  readonly message?: string;
  readonly loginCode?: string;
  readonly pin?: string;
}

export function SignUpWizard({
  onStepChange,
}: {
  onStepChange?: (step: number) => void;
}) {
  const router = useRouter();
  const auth = useAuth();

  const [step, setStepState] = useState(1);
  const setStep = (next: number) => {
    setStepState(next);
    onStepChange?.(next);
  };

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Step 2
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentInitial, setStudentInitial] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [skippedStudent, setSkippedStudent] = useState(false);

  // Step 3
  const [programme, setProgramme] = useState<string>(PROGRAMMES[0].id);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ loginCode: string; pin: string } | null>(null);

  const meter = useMemo(() => meterFor(password), [password]);
  const passwordOk = useMemo(() => evaluatePassword(password).allMet, [password]);

  const step1Ready =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    passwordOk &&
    agreed;
  const step2Ready = skippedStudent || (studentFirstName.trim().length > 0 && year !== null);
  const canProceed = step === 1 ? step1Ready : step === 2 ? step2Ready : true;

  const chosenProgramme = PROGRAMMES.find((p) => p.id === programme) ?? PROGRAMMES[0];

  async function createAccount() {
    setSubmitting(true);
    setError(null);

    const result = await auth.signUp({
      email: email.trim(),
      password,
      displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      role: "parent",
    });

    if (!result.ok) {
      setError(result.message ?? "Could not create your account. Please try again.");
      setSubmitting(false);
      return;
    }

    if (result.needsEmailConfirmation) {
      /* No session yet, so the student cannot be provisioned. Say so
         rather than losing the name that was just entered. */
      setConfirmEmail(email.trim());
      setSubmitting(false);
      return;
    }

    if (!skippedStudent && studentFirstName.trim() && year !== null) {
      const displayName = studentInitial.trim()
        ? `${studentFirstName.trim()} ${studentInitial.trim().slice(0, 1).toUpperCase()}`
        : studentFirstName.trim();

      let child: ChildResponse;
      try {
        const response = await fetch("/api/parent/children", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName, yearLevel: year }),
        });
        child = ((await response.json().catch(() => null)) as ChildResponse | null) ?? { ok: false };
      } catch {
        child = { ok: false };
      }

      if (child.ok && child.loginCode && child.pin) {
        /* Shown once and never persisted client-side — same contract as
           AddChildCard on the parent dashboard. */
        setCredentials({ loginCode: child.loginCode, pin: child.pin });
        setSubmitting(false);
        return;
      }

      setError(
        child.message ??
          "Your account was created, but the student profile was not. Add them from the parent view.",
      );
      setSubmitting(false);
      return;
    }

    router.push(chosenProgramme.href);
    router.refresh();
  }

  function handlePrimary() {
    if (!canProceed || submitting) return;
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    void createAccount();
  }

  /* ---------- Terminal screens ---------- */

  if (confirmEmail) {
    return (
      <div className="grid gap-5">
        <EmailConfirmationPending email={confirmEmail} onBack={() => router.push("/sign-in")} />
        {!skippedStudent && studentFirstName.trim() && (
          <p className="rounded-xl border border-mm-tint-line bg-mm-tint p-4 text-sm leading-[1.55] text-mm-ink-soft">
            {studentFirstName.trim()} hasn&apos;t been added yet — a student profile can only be
            created from a signed-in parent account. Confirm your email, sign in, and add them
            from the parent view; it takes one field.
          </p>
        )}
      </div>
    );
  }

  if (credentials) {
    return (
      <div className="mm-rise grid gap-5 rounded-[20px] border border-mm-line bg-white p-[clamp(22px,2.4vw,32px)]">
        <div className="grid gap-2">
          <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-mm-tint px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
            Account created
          </span>
          <h2 className="text-2xl font-[700] text-mm-ink">
            Save {studentFirstName.trim() || "your student"}&apos;s sign-in details
          </h2>
          <p className="text-[15px] leading-[1.6] text-mm-muted">
            These are shown once. A student signs in with them on the Student tab — they never
            need an email address.
          </p>
        </div>

        <dl className="grid gap-3 rounded-[14px] border border-mm-tint-line-strong bg-mm-wash p-4">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[13.5px] font-bold text-mm-ink-soft">Login code</dt>
            <dd className="font-mono text-lg font-bold tracking-wide text-mm-ink">
              {credentials.loginCode}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[13.5px] font-bold text-mm-ink-soft">PIN</dt>
            <dd className="font-mono text-lg font-bold tracking-wide text-mm-ink">
              {credentials.pin}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              router.push(chosenProgramme.href);
              router.refresh();
            }}
            className={mmAuthButton()}
          >
            Start with {chosenProgramme.title}
          </button>
          <Link href="/parent" className={mmAuthButton({ variant: "outline" })}>
            Go to the parent view
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- The wizard ---------- */

  const current = SIGN_UP_STEPS[step - 1];

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3.5">
        <button
          type="button"
          onClick={() => (step === 1 ? router.push("/") : setStep(step - 1))}
          className={twMerge(
            "inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-mm-muted transition-colors hover:text-mm-brand",
            mmFocus,
          )}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {step === 1 ? "Back to home" : `Back to step ${step - 1}`}
        </button>
        <p className="text-sm text-mm-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className={twMerge("rounded font-bold text-mm-brand hover:underline", mmFocus)}>
            Sign in
          </Link>
        </p>
      </div>

      <div className="grid gap-3">
        <div aria-hidden="true" className="flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={clsx(
                "h-1.5 flex-1 rounded-sm transition-colors",
                n <= step ? "bg-mm-brand" : "bg-mm-track",
              )}
            />
          ))}
        </div>
        <p className="font-mono text-[11.5px] uppercase tracking-[0.06em] text-mm-brand">
          Step {step} of 3 · {current.name}
        </p>
        <h1 className="text-[clamp(26px,2.8vw,36px)] font-[700] leading-[1.12] text-mm-ink">
          {current.heading}
        </h1>
        <p className="text-base leading-[1.6] text-mm-muted">{current.blurb}</p>
      </div>

      <div
        /* Keyed by step so each one animates in, as the design specifies. */
        key={step}
        className="mm-rise grid gap-[18px] rounded-[20px] border border-mm-line bg-white p-[clamp(22px,2.4vw,32px)]"
      >
        {step === 1 && (
          <div className="grid gap-4">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <MmField
                id="su-first-name"
                label="First name"
                tone="paper"
                autoComplete="given-name"
                placeholder="Priya"
                value={firstName}
                onChange={(e) => setFirstName(e.currentTarget.value)}
              />
              <MmField
                id="su-last-name"
                label="Last name"
                tone="paper"
                autoComplete="family-name"
                placeholder="Raman"
                value={lastName}
                onChange={(e) => setLastName(e.currentTarget.value)}
              />
            </div>

            <MmField
              id="su-email"
              label="Email address"
              type="email"
              tone="paper"
              autoComplete="email"
              placeholder="you@example.com"
              hint="Used for sign-in, receipts and progress summaries. Nothing else."
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />

            <div className="grid gap-2">
              <MmField
                id="su-password"
                label="Create a password"
                type={showPassword ? "text" : "password"}
                tone="paper"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                trailingRoom
                trailing={
                  <MmRevealButton
                    controls="su-password"
                    visible={showPassword}
                    onToggle={() => setShowPassword((v) => !v)}
                  />
                }
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="h-1.5 flex-1 overflow-hidden rounded-sm bg-mm-line-soft"
                >
                  <span
                    className={clsx("block h-full rounded-sm transition-all duration-300", meter.fill)}
                    style={{ width: meter.width }}
                  />
                </span>
                <span
                  aria-live="polite"
                  className={clsx(
                    "min-w-[112px] text-right text-[12.5px] font-bold",
                    meter.text,
                  )}
                >
                  {meter.label}
                </span>
              </div>
              {password.length > 0 && !passwordOk && (
                <ul className="flex flex-wrap gap-1.5">
                  {evaluatePassword(password).results.map((rule) => (
                    <li
                      key={rule.id}
                      className={clsx(
                        "rounded-[9px] border px-2.5 py-1 text-xs font-semibold",
                        rule.met
                          ? "border-mm-tint-line bg-mm-tint text-mm-brand"
                          : "border-mm-line bg-mm-page text-mm-muted",
                      )}
                    >
                      {rule.met ? "✓ " : ""}
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <MmCheckbox
              id="su-consent"
              align="start"
              checked={agreed}
              onToggle={() => setAgreed((v) => !v)}
            >
              I am the parent or guardian creating this account, and I accept the{" "}
              <Link href="/terms" className={twMerge("rounded font-bold text-mm-brand hover:underline", mmFocus)}>
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className={twMerge("rounded font-bold text-mm-brand hover:underline", mmFocus)}>
                Privacy Policy
              </Link>
              .
            </MmCheckbox>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4">
            <div className="grid gap-3.5 sm:grid-cols-[1fr_140px]">
              <MmField
                id="su-student-name"
                label="Student first name"
                tone="paper"
                autoComplete="off"
                placeholder="Aisha"
                value={studentFirstName}
                onChange={(e) => {
                  setStudentFirstName(e.currentTarget.value);
                  setSkippedStudent(false);
                }}
              />
              <MmField
                id="su-student-initial"
                label="Initial only"
                tone="paper"
                autoComplete="off"
                placeholder="R"
                maxLength={1}
                value={studentInitial}
                onChange={(e) => setStudentInitial(e.currentTarget.value)}
              />
            </div>

            <fieldset className="grid gap-2.5">
              <legend className="text-[13.5px] font-bold text-mm-ink-soft">Year level</legend>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
                  const available = YEARS_WITH_CONTENT.has(n);
                  const on = year === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={on}
                      disabled={!available}
                      aria-label={
                        available ? `Year ${n}` : `Year ${n} — no practice content yet`
                      }
                      onClick={() => {
                        setYear(n);
                        setSkippedStudent(false);
                      }}
                      className={twMerge(
                        clsx(
                          "min-h-[46px] rounded-[11px] border-[1.5px] text-[15px] font-bold transition-colors",
                          !available
                            ? "cursor-not-allowed border-mm-line-quiet bg-mm-surface-quiet text-mm-quiet"
                            : on
                              ? "border-mm-brand bg-mm-brand text-white"
                              : "border-mm-line bg-mm-page text-mm-ink-soft hover:border-mm-brand",
                        ),
                        mmFocus,
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              {/* Never colour alone — the constraint is stated in words. */}
              <p className="text-[13px] leading-[1.5] text-mm-muted">
                Years 3 and 5 have a full question bank today. The other year levels are
                selectable once their content is written, and are shown here so the coverage is
                visible rather than hidden.
              </p>
            </fieldset>

            <fieldset className="grid gap-2.5">
              <legend className="text-[13.5px] font-bold text-mm-ink-soft">
                State or territory
              </legend>
              <div className="flex flex-wrap gap-2">
                {STATES.map((label) => {
                  const on = state === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setState(on ? null : label)}
                      className={twMerge(
                        clsx(
                          "min-h-11 rounded-[10px] border-[1.5px] px-4 text-[14.5px] font-bold transition-colors",
                          on
                            ? "border-mm-brand bg-mm-brand text-white"
                            : "border-mm-line bg-mm-page text-mm-ink-soft hover:border-mm-brand",
                        ),
                        mmFocus,
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[13px] leading-[1.5] text-mm-muted">
                Optional. Recorded for curriculum sequencing and selective entry formats; neither
                varies by jurisdiction on the platform yet.
              </p>
            </fieldset>

            <p className="rounded-xl bg-mm-tint p-4 text-sm leading-[1.55] text-mm-ink-soft">
              More students can be added later from the parent view. The {FAMILY_PLAN.name} plan
              covers up to {FAMILY_PLAN.maxChildren} profiles.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4">
            <fieldset className="grid gap-2.5">
              <legend className="text-[13.5px] font-bold text-mm-ink-soft">
                Choose a starting programme
              </legend>
              <div role="radiogroup" aria-label="Starting programme" className="grid gap-2.5">
                {PROGRAMMES.map((item) => {
                  const on = programme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={!item.available}
                      onClick={() => setProgramme(item.id)}
                      className={twMerge(
                        clsx(
                          "grid grid-cols-[22px_minmax(0,1fr)] items-start gap-3.5 rounded-[14px] border-[1.5px] p-[18px] text-left transition-colors",
                          !item.available
                            ? "cursor-not-allowed border-mm-line-quiet bg-mm-surface-quiet"
                            : on
                              ? "border-mm-brand bg-mm-wash"
                              : "border-mm-line bg-white hover:border-mm-brand",
                        ),
                        mmFocus,
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={clsx(
                          "mt-0.5 grid h-5 w-5 place-items-center rounded-full border-2",
                          on ? "border-mm-brand" : "border-mm-tint-line-strong",
                        )}
                      >
                        {on && <span className="h-2.5 w-2.5 rounded-full bg-mm-brand" />}
                      </span>
                      <span className="grid min-w-0 gap-1">
                        <span className="flex flex-wrap items-center gap-2 text-base font-bold text-mm-ink">
                          {item.title}
                          {!item.available && (
                            <span className="rounded-[9px] bg-mm-alert px-2 py-0.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-mm-coral-text">
                              Being confirmed
                            </span>
                          )}
                        </span>
                        <span className="text-sm leading-[1.5] text-mm-muted">{item.body}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[13px] leading-[1.5] text-mm-muted">
                More than one programme can run at once. This only sets the first session.
              </p>
            </fieldset>

            <div className="grid gap-2.5 rounded-[14px] border border-mm-tint-line-strong bg-mm-wash p-[18px]">
              <p className="text-[15.5px] font-bold text-mm-ink">What happens next</p>
              {/*
                The design's panel promised a 7-day trial and named both
                prices. There is no trial mechanism in this product, so the
                promise is not repeated. The prices are the real ones, read
                from src/lib/billing/prices.ts.
              */}
              <p className="text-[14.5px] leading-[1.6] text-mm-muted">
                Nothing is charged, and no card is asked for. Practice is free and ungated —
                an account is what saves progress across sessions. The {FAMILY_PLAN.name} plan is{" "}
                {FAMILY_PLAN.monthly.display}
                {FAMILY_PLAN.monthly.period} or {FAMILY_PLAN.annual.display}
                {FAMILY_PLAN.annual.period} when you want it, and can be added at any time from
                the parent view.
              </p>
            </div>
          </div>
        )}

        {error && <MmErrorPanel>{error}</MmErrorPanel>}

        <div className="flex flex-wrap items-center gap-3 border-t border-mm-line-soft pt-4">
          <button
            type="button"
            onClick={handlePrimary}
            disabled={!canProceed || submitting}
            aria-disabled={!canProceed || submitting}
            className={mmAuthButton({ disabled: !canProceed || submitting })}
          >
            {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
            {step === 3 ? "Create the account" : "Continue"}
          </button>

          {step === 2 && (
            <button
              type="button"
              onClick={() => {
                setSkippedStudent(true);
                setStep(3);
              }}
              className={mmAuthButton({ variant: "outline" })}
            >
              Skip for now
            </button>
          )}

          <p className="text-[13.5px] text-mm-muted">
            {step === 1
              ? agreed
                ? "No card required."
                : "Accept the terms to continue."
              : step === 2
                ? "You can add more students later."
                : "Nothing is charged today."}
          </p>
        </div>
      </div>
    </div>
  );
}
