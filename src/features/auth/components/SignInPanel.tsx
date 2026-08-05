"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { useAuth } from "../AuthProvider";
import { roleHomePath } from "../roles";
import { recordSessionPersistence } from "../session-persistence";
import { PUBLIC_SIGNUP_ENABLED } from "../signup-policy";
import { formatLoginCode } from "../student-alias";
import {
  MmCheckbox,
  MmErrorPanel,
  MmField,
  MmRevealButton,
  mmAuthButton,
  mmFocus,
} from "./auth-fields";
import { SocialButtons } from "./SocialButtons";

/**
 * Log in — design handoff screen 6, reconciled against what this codebase
 * actually authenticates with (see DESIGN_AUDIT.md §3 and §3b).
 *
 * Three deliberate deviations from the design file, all because the design
 * was drawn before the repo audit and its own README calls the auth field
 * inventory "explicitly speculative":
 *
 *  1. The Student tab's fields are **login code + PIN**, not "student
 *     username" + password. A student on MindMosaic has no username and no
 *     email: a parent provisions them and hands over an 8-character code
 *     (displayed `XXXX-XXXX`) and a 6-digit PIN. See ../student-alias.ts.
 *  2. The two alternative sign-in buttons in the design ("school access
 *     code", "one-time email link") describe flows that do not exist. The
 *     slot is filled with the OAuth providers that DO exist, via the
 *     existing SocialButtons.
 *  3. Success routes to the signed-in role's home (`/parent`, `/student`,
 *     `/teacher`, `/admin`), not the design's parent -> Landing /
 *     student -> Learn. An explicit `?next=` still wins.
 *
 * Everything else — the segmented control, the swapping labels, the inline
 * Show/Hide, the keep-signed-in checkbox defaulting to on, the coral input
 * border plus `role="alert"` panel on error — is the design as drawn.
 */

type AccountKind = "parent" | "student";
type Screen = "signin" | "forgot";

const FORGOT_COOLDOWN_SECONDS = 30;
/** Soft, client-side-only guard; real lockout enforcement is Supabase's. */
const LOCKOUT_AFTER_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

const COPY = {
  parent: {
    tab: "Parent",
    idLabel: "Email address",
    idPlaceholder: "you@example.com",
    idAutoComplete: "email",
    secretLabel: "Password",
    secretPlaceholder: "Your password",
    secretAutoComplete: "current-password",
    submit: "Sign in to parent account",
    emptyError:
      "Enter your email address and password to sign in.",
    failedError:
      "We could not find an account with that email and password. Check both, or reset the password.",
  },
  student: {
    tab: "Student",
    idLabel: "Login code",
    /* The real format, from formatLoginCode() — not an invented username. */
    idPlaceholder: formatLoginCode("K7XJ2P9R"),
    idAutoComplete: "off",
    secretLabel: "PIN",
    secretPlaceholder: "6 digits",
    secretAutoComplete: "off",
    submit: "Sign in and start learning",
    emptyError: "Enter the login code and PIN your parent gave you.",
    failedError:
      "That login code and PIN do not match. A parent can look up both from the parent view.",
  },
} as const satisfies Record<AccountKind, Record<string, string>>;

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof Error && /network|fetch/i.test(error.message));
}

export function SignInPanel({
  /**
   * Which tab opens first. `/student-sign-in` is still its own route — it
   * is the URL written on the card a child is handed, and in the Help
   * Centre — so it opens straight onto the Student tab rather than making
   * them find it.
   */
  defaultKind = "parent",
}: {
  defaultKind?: AccountKind;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();

  const explicitNext = searchParams.get("next");
  const [screen, setScreen] = useState<Screen>(() =>
    searchParams.get("mode") === "forgot" ? "forgot" : "signin",
  );
  const [kind, setKind] = useState<AccountKind>(defaultKind);

  const [ident, setIdent] = useState("");
  const [secret, setSecret] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /* Set only when the failure was specifically an unconfirmed email, which
     is the one sign-in failure with an action attached. */
  const [unconfirmed, setUnconfirmed] = useState<string | null>(null);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [forgotCooldown, setForgotCooldown] = useState(0);

  useEffect(() => {
    if (lockedUntil === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  useEffect(() => {
    if (forgotCooldown <= 0) return;
    const id = setInterval(() => setForgotCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [forgotCooldown]);

  const isLocked = lockedUntil !== null && now < lockedUntil;
  const lockSecondsRemaining = isLocked && lockedUntil ? Math.ceil((lockedUntil - now) / 1000) : 0;
  const copy = COPY[kind];

  const switchKind = (next: AccountKind) => {
    setKind(next);
    setError(null);
    setNotice(null);
    setUnconfirmed(null);
    setSecret("");
    setShowSecret(false);
  };

  async function handleSignIn(event: FormEvent) {
    event.preventDefault();
    if (submitting || isLocked) return;

    /* The design triggers the error panel on empty fields rather than
       disabling submit — keeping that, because a disabled button gives a
       keyboard user nothing to act on and no reason why. */
    if (!ident.trim() || !secret.trim()) {
      setError(copy.emptyError);
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const result =
        kind === "parent"
          ? await auth.signInWithPassword(ident.trim(), secret)
          : await auth.signInWithStudentCode(ident, secret);

      if (result.ok) {
        recordSessionPersistence(remember);
        setFailedAttempts(0);
        router.push(explicitNext ?? roleHomePath(await auth.fetchRole()));
        router.refresh();
        return;
      }

      /* Supabase's own wording is not shown for a failed credential check:
         it leaks whether the account exists. The one case worth surfacing
         verbatim is an unconfirmed email, which is actionable. */
      const needsConfirmation = /email.*not.*confirm|confirm.*your.*email/i.test(
        result.message ?? "",
      );
      setUnconfirmed(needsConfirmation ? ident.trim() : null);
      setError(
        needsConfirmation
          ? "Confirm your email before signing in — check your inbox for the link we sent."
          : copy.failedError,
      );

      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= LOCKOUT_AFTER_ATTEMPTS) setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
    } catch (caught) {
      setError(
        isNetworkError(caught)
          ? "Network error — check your connection and try again."
          : "Something went wrong. Please try again.",
      );
    }

    setSubmitting(false);
  }

  async function handleForgot(event: FormEvent) {
    event.preventDefault();
    if (submitting || forgotCooldown > 0) return;
    if (!resetEmail.trim()) {
      setError("Enter the email address on the account.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setNotice(null);
    const result = await auth.sendPasswordReset(resetEmail.trim());
    if (result.ok) {
      setNotice(
        result.message ??
          "If that email has an account, a reset link is on its way. It expires in one hour.",
      );
      setForgotCooldown(FORGOT_COOLDOWN_SECONDS);
    } else {
      setError(result.message ?? "Could not send the reset link. Please try again.");
    }
    setSubmitting(false);
  }

  const tabs = useMemo(
    () => (["parent", "student"] as const).map((value) => ({ value, label: COPY[value].tab })),
    [],
  );

  /* ---------- Forgot password ---------- */

  if (screen === "forgot") {
    return (
      <div className="mm-rise grid w-full max-w-[440px] min-w-0 gap-6">
        <button
          type="button"
          onClick={() => {
            setScreen("signin");
            setError(null);
            setNotice(null);
          }}
          className={twMerge(
            "inline-flex min-h-10 w-fit items-center gap-2 rounded-lg text-sm font-semibold text-mm-muted transition-colors hover:text-mm-brand",
            mmFocus,
          )}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to sign in
        </button>

        <div className="grid gap-2.5">
          <h1 className="text-[clamp(28px,3vw,38px)] font-[700] leading-[1.1] text-mm-ink">
            Reset your password
          </h1>
          <p className="text-base leading-[1.6] text-mm-muted">
            We&apos;ll email a secure link to set a new one. Student PINs are reset by a
            parent from the parent view, not from here.
          </p>
        </div>

        <form onSubmit={handleForgot} className="grid gap-4">
          <MmField
            id="reset-email"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={resetEmail}
            onChange={(e) => {
              setResetEmail(e.currentTarget.value);
              setError(null);
            }}
            invalid={error !== null}
          />
          {error && <MmErrorPanel>{error}</MmErrorPanel>}
          {notice && (
            <p
              role="status"
              className="rounded-xl border border-mm-tint-line bg-mm-tint p-3.5 text-sm leading-[1.5] text-mm-ink-soft"
            >
              {notice}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || forgotCooldown > 0}
            className={mmAuthButton({
              disabled: submitting || forgotCooldown > 0,
              className: "min-h-[54px] w-full rounded-[13px] text-base",
            })}
          >
            {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
            {forgotCooldown > 0 ? `Resend available in ${forgotCooldown}s` : "Send reset link"}
          </button>
        </form>
      </div>
    );
  }

  /* ---------- Sign in ---------- */

  return (
    <div className="mm-rise grid w-full max-w-[440px] min-w-0 gap-6">
      <div className="flex items-center justify-between gap-3.5">
        <Link
          href="/"
          className={twMerge(
            "inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-mm-muted transition-colors hover:text-mm-brand",
            mmFocus,
          )}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to home
        </Link>
        <p className="text-sm text-mm-muted">
          {PUBLIC_SIGNUP_ENABLED ? (
            <>
              New here?{" "}
              <Link href="/sign-up" className={twMerge("rounded font-bold text-mm-brand hover:underline", mmFocus)}>
                Start free
              </Link>
            </>
          ) : (
            /* No "start free" prompt when there is no account to create. */
            <>
              No account?{" "}
              <Link
                href="/practice"
                className={twMerge("rounded font-bold text-mm-brand hover:underline", mmFocus)}
              >
                Practise as a guest
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="grid gap-2.5">
        <h1 className="text-[clamp(28px,3vw,38px)] font-[700] leading-[1.1] text-mm-ink">Sign in</h1>
        <p className="text-base leading-[1.6] text-mm-muted">
          Parent accounts and student profiles both sign in here.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Account type"
        className="grid grid-cols-2 gap-1.5 rounded-[13px] bg-mm-tint p-[5px]"
      >
        {tabs.map((tab) => {
          const selected = tab.value === kind;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => switchKind(tab.value)}
              className={twMerge(
                clsx(
                  "min-h-11 rounded-[10px] text-[14.5px] font-bold transition-colors",
                  selected
                    ? "bg-white text-mm-brand shadow-[0_2px_8px_rgba(89,37,168,0.12)]"
                    : "bg-transparent text-mm-muted hover:text-mm-ink",
                ),
                mmFocus,
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {!auth.configured && (
        <p
          role="status"
          className="rounded-xl border border-mm-tint-line bg-mm-tint p-3.5 text-sm leading-[1.5] text-mm-ink-soft"
        >
          Accounts aren&apos;t connected on this device yet. Practice still works as a guest —
          add Supabase keys to <code className="font-mono">.env.local</code> to enable sign-in.
        </p>
      )}

      {/* Keyed by `kind` so switching tabs resets field state rather than
          carrying a half-typed email into the login-code field. */}
      <form key={kind} onSubmit={handleSignIn} className="grid gap-4">
        <MmField
          id="auth-ident"
          label={copy.idLabel}
          type="text"
          inputMode={kind === "student" ? "text" : "email"}
          autoComplete={copy.idAutoComplete}
          placeholder={copy.idPlaceholder}
          value={ident}
          onChange={(e) => {
            setIdent(e.currentTarget.value);
            setError(null);
          }}
          invalid={error !== null}
        />

        <MmField
          id="auth-secret"
          label={copy.secretLabel}
          type={showSecret ? "text" : "password"}
          inputMode={kind === "student" ? "numeric" : undefined}
          autoComplete={copy.secretAutoComplete}
          placeholder={copy.secretPlaceholder}
          value={secret}
          onChange={(e) => {
            setSecret(e.currentTarget.value);
            setError(null);
          }}
          invalid={error !== null}
          trailingRoom
          trailing={
            <MmRevealButton
              controls="auth-secret"
              visible={showSecret}
              onToggle={() => setShowSecret((v) => !v)}
            />
          }
          labelAside={
            /* A student's PIN is reset by their parent, so the link would
               be a dead end on that tab. */
            kind === "parent" ? (
              <button
                type="button"
                onClick={() => {
                  setScreen("forgot");
                  setResetEmail(ident);
                  setError(null);
                }}
                className={twMerge(
                  "rounded text-[13px] font-semibold text-mm-brand hover:underline",
                  mmFocus,
                )}
              >
                Forgot password?
              </button>
            ) : undefined
          }
        />

        {error && (
          <MmErrorPanel>
            <span>
              {error}
              {unconfirmed && (
                <button
                  type="button"
                  onClick={() => {
                    void auth.resendConfirmationEmail(unconfirmed).then((result) => {
                      setNotice(
                        result.message ??
                          (result.ok
                            ? "Confirmation email resent."
                            : "Could not resend the email."),
                      );
                    });
                  }}
                  className={twMerge(
                    "mt-1 block rounded font-bold underline underline-offset-2",
                    mmFocus,
                  )}
                >
                  Resend confirmation email
                </button>
              )}
            </span>
          </MmErrorPanel>
        )}

        {notice && (
          <p
            role="status"
            className="rounded-xl border border-mm-tint-line bg-mm-tint p-3.5 text-sm leading-[1.5] text-mm-ink-soft"
          >
            {notice}
          </p>
        )}

        {isLocked && (
          <p
            role="alert"
            className="rounded-xl border border-mm-alert-line bg-mm-alert p-3.5 text-sm leading-[1.5] text-mm-coral-deep"
          >
            Too many failed attempts. Try again in {lockSecondsRemaining}s, or reset the password.
          </p>
        )}

        <MmCheckbox
          id="auth-remember"
          checked={remember}
          onToggle={() => setRemember((v) => !v)}
        >
          Keep me signed in on this device
        </MmCheckbox>

        <button
          type="submit"
          disabled={submitting || isLocked}
          className={mmAuthButton({
            disabled: submitting || isLocked,
            className: "min-h-[54px] w-full rounded-[13px] text-base",
          })}
        >
          {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
          {isLocked ? `Try again in ${lockSecondsRemaining}s` : copy.submit}
        </button>
      </form>

      {/* Parent tab only: the OAuth providers create/attach a real email
          identity, which a student profile does not have. */}
      {kind === "parent" && (
        <>
          <div className="flex items-center gap-3.5">
            <span aria-hidden="true" className="h-px flex-1 bg-mm-line" />
            <span className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-mm-muted-2">
              or
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-mm-line" />
          </div>
          <SocialButtons nextPath={explicitNext ?? "/"} />
        </>
      )}

      {kind === "student" && (
        <p className="rounded-xl border border-mm-tint-line bg-mm-tint p-3.5 text-sm leading-[1.55] text-mm-ink-soft">
          A student never needs an email address. If the code or PIN has been lost, a parent can
          look both up from the{" "}
          <Link href="/parent" className={twMerge("rounded font-bold text-mm-brand hover:underline", mmFocus)}>
            parent view
          </Link>
          .
        </p>
      )}

      <p className="text-[13px] leading-[1.6] text-mm-muted">
        By signing in you accept the{" "}
        <Link href="/terms" className={twMerge("rounded font-bold text-mm-brand hover:underline", mmFocus)}>
          Terms and Conditions
        </Link>{" "}
        and the{" "}
        <Link href="/privacy" className={twMerge("rounded font-bold text-mm-brand hover:underline", mmFocus)}>
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
