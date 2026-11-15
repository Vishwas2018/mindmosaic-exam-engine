"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight, GraduationCap, Loader2, UserRound } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { useAuth } from "../AuthProvider";
import { configuredOAuthProviders } from "../oauth-providers";
import { roleHomePath } from "../roles";
import { safeNextPath } from "../safe-next";
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
  useShakeOnInvalidSubmit,
} from "./auth-fields";
import { AuthCard, AuthCardHeading } from "./AuthMosaicPanel";
import { PinInput } from "./PinInput";
import { SocialButtons } from "./SocialButtons";

/**
 * Log in — design handoff screen 6, reconciled against what this codebase
 * actually authenticates with.
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
type Screen = "signin" | "forgot" | "choose";

const FORGOT_COOLDOWN_SECONDS = 30;
/** Soft, client-side-only guard; real lockout enforcement is Supabase's. */
const LOCKOUT_AFTER_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

const COPY = {
  parent: {
    tab: "Parent",
    title: "Parent sign-in",
    lead: "Welcome back. Your children\u2019s accounts are reached from here.",
    idLabel: "Email",
    idPlaceholder: "you@example.com",
    idAutoComplete: "email",
    secretLabel: "Password",
    secretPlaceholder: "Your password",
    secretAutoComplete: "current-password",
    submit: "Sign in",
    emptyError:
      "Enter your email address and password to sign in.",
    /* One sentence for a wrong password and for an address with no account,
       so the error cannot be used to test whether an address is registered. */
    failedError:
      "That email and password didn\u2019t match. Check them and try again, or reset your password.",
    lockedMessage: (seconds: number) =>
      `Too many attempts. For your account\u2019s safety, wait ${seconds}s and try again, or reset your password.`,
  },
  student: {
    tab: "Student",
    title: "Student sign-in",
    lead: "Use the login code and PIN a grown-up set up for you.",
    idLabel: "Login code",
    /* The real format, from formatLoginCode() — not an invented username. */
    idPlaceholder: formatLoginCode("K7XJ2P9R"),
    idAutoComplete: "off",
    secretLabel: "Your PIN",
    secretPlaceholder: "6 digits",
    secretAutoComplete: "off",
    submit: "Sign in",
    emptyError: "Enter the login code and PIN your parent gave you.",
    /* Same sentence whether the code is unknown or the PIN is wrong. */
    failedError:
      "That code and PIN didn\u2019t match. Check them with the grown-up who set them up, and try again.",
    lockedMessage: (seconds: number) =>
      `Let\u2019s take a short break. Too many tries. You can sign in again in ${seconds}s, or ask a grown-up for help.`,
  },
} as const satisfies Record<
  AccountKind,
  Record<string, string | ((seconds: number) => string)>
>;

const NETWORK_MESSAGE = "We couldn\u2019t reach MindMosaic. Check your connection and try again.";
/* A failure on the auth server is not an account problem, and must not be
   dressed up as one. */
const UNAVAILABLE_MESSAGE =
  "We can\u2019t sign you in right now. This is a problem on our side, not with your account. Nothing has changed. Please try again in a few minutes.";

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
  /**
   * Which screen opens first. When `"choose"`, the welcome "Who is signing
   * in?" entry chooser (design artboards 01-03) is shown before the sign-in
   * form. Overrides `?entry`/`?mode` search params when provided.
   */
  defaultEntry,
}: {
  defaultKind?: AccountKind;
  defaultEntry?: Screen;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();

  /* Same-origin paths only: see ../safe-next.ts. */
  const explicitNext = safeNextPath(searchParams.get("next"));
  const oauthProviders = configuredOAuthProviders();
  const pathname = usePathname();
  const roleParam = searchParams.get("role");
  const [screen, setScreen] = useState<Screen>(() => {
    const entryParam = searchParams.get("entry");
    const modeParam = searchParams.get("mode");
    if (modeParam === "forgot") return "forgot";
    if (roleParam === "parent" || roleParam === "student") return "signin";
    if (entryParam === "signin" || modeParam === "signin") return "signin";
    if (entryParam === "choose" || modeParam === "choose") return "choose";
    if (modeParam === "forgot") return "forgot";
    if (defaultEntry) return defaultEntry;
    return "signin";
  });
  const [kind, setKind] = useState<AccountKind>(() =>
    roleParam === "parent" || roleParam === "student" ? roleParam : defaultKind,
  );

  /* The chosen role and screen live in the URL (replaceState, no navigation), so Back, a refresh, or a trip to
     another page and back returns to the same form rather than to the chooser. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete("entry");
    if (screen === "choose") {
      params.delete("role");
      params.delete("mode");
    } else {
      if (pathname !== "/student-sign-in") params.set("role", kind);
      if (screen === "forgot") params.set("mode", "forgot");
      else params.delete("mode");
    }
    const qs = params.toString();
    const next = qs ? `${pathname}?${qs}` : pathname;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, "", next);
  }, [screen, kind, pathname]);

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
  const shake = useShakeOnInvalidSubmit();

  const switchKind = (next: AccountKind) => {
    setKind(next);
    /* A half-typed email must not carry into the login-code field (the form is no longer remounted per role). */
    setIdent("");
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
      shake.trigger();
      return;
    }

    /* Caught before anything is sent, and says what good looks like. It is a
       format check only: it cannot say whether the address has an account. */
    if (kind === "parent" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ident.trim())) {
      setError("That doesn’t look like a complete email address, like name@example.com.");
      shake.trigger();
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

      /* A failure that is not about the credentials is told apart and does
         not count toward the lockout: a dropped connection, a server-side
         rate limit and an auth-server outage are three different facts. */
      if (result.failure === "network") {
        setError(NETWORK_MESSAGE);
        shake.trigger();
        setSubmitting(false);
        return;
      }
      if (result.failure === "unavailable") {
        setError(UNAVAILABLE_MESSAGE);
        shake.trigger();
        setSubmitting(false);
        return;
      }
      /* A banned account (a paused child, but also an erased or revoked one) is
         deliberately NOT told apart here: the archive contract (QA-003) is one
         generic sentence, and whether the auth server reports a ban before or
         after it checks the PIN is unverified, so a distinct message could
         reveal that a guessed login code exists. */
      if (result.failure === "rate_limited") {
        setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
        setNow(Date.now());
        setSubmitting(false);
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
      shake.trigger();

      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= LOCKOUT_AFTER_ATTEMPTS) setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
    } catch (caught) {
      setError(isNetworkError(caught) ? NETWORK_MESSAGE : UNAVAILABLE_MESSAGE);
      shake.trigger();
    }

    setSubmitting(false);
  }

  async function handleForgot(event: FormEvent) {
    event.preventDefault();
    if (submitting || forgotCooldown > 0) return;
    if (!resetEmail.trim()) {
      setError("Enter the email address on the account.");
      shake.trigger();
      return;
    }
    setSubmitting(true);
    setError(null);
    setNotice(null);
    let result: Awaited<ReturnType<typeof auth.sendPasswordReset>>;
    try {
      result = await auth.sendPasswordReset(resetEmail.trim());
    } catch {
      result = { ok: false, message: NETWORK_MESSAGE };
    }
    if (result.ok) {
      setNotice(
        result.message ??
          "If that email has an account, a reset link is on its way. It expires in one hour.",
      );
      setForgotCooldown(FORGOT_COOLDOWN_SECONDS);
    } else {
      setError(result.message ?? "We couldn\u2019t send a reset link just now. Please try again in a few minutes.");
      shake.trigger();
    }
    setSubmitting(false);
  }

  const tabs = useMemo(
    () => (["parent", "student"] as const).map((value) => ({ value, label: COPY[value].tab })),
    [],
  );

  /* ---------- Forgot password ---------- */

  if (screen === "choose") {
    const chooserCard =
      "group block w-full rounded-[18px] border border-mm-line bg-white p-7 text-left shadow-[0_1px_2px_rgba(24,21,31,0.04)] transition-[border-color,box-shadow] hover:border-mm-brand/40 hover:shadow-[0_18px_50px_rgba(49,32,86,0.09)]";
    return (
      <div className="mm-rise grid w-full min-w-0 gap-4">
        <div className="mb-2 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-[1.3] tracking-[-0.028em] text-mm-ink">
            Welcome to MindMosaic
          </h1>
          <p className="mt-2 text-[15px] text-mm-ink-soft">Who is signing in?</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setKind("parent");
            setScreen("signin");
            setError(null);
          }}
          className={twMerge(chooserCard, mmFocus)}
        >
          <span className="grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-mm-tint text-mm-brand">
            <UserRound className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="mt-5 block font-[family-name:var(--font-display)] text-xl font-semibold text-mm-ink">
            I&apos;m a parent
          </span>
          <span className="mt-2 block text-sm leading-[1.55] text-mm-ink-soft">
            See how your children are doing, manage their accounts and your plan.
          </span>
          <span className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-mm-brand">
            Parent sign-in <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setKind("student");
            setScreen("signin");
            setError(null);
          }}
          className={twMerge(chooserCard, mmFocus)}
        >
          <span className="grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-mm-ember-tint text-mm-ember-ink">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="mt-5 block font-[family-name:var(--font-display)] text-xl font-semibold text-mm-ink">
            I&apos;m a student
          </span>
          <span className="mt-2 block text-sm leading-[1.55] text-mm-ink-soft">
            Sign in with the login code and PIN a parent gave you.
          </span>
          <span className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-mm-brand">
            Student sign-in <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </span>
        </button>

        {PUBLIC_SIGNUP_ENABLED && (
          <p className="mt-4 text-center text-sm text-mm-muted">
            New here?{" "}
            <Link href="/sign-up" className={twMerge("rounded font-semibold text-mm-brand hover:underline", mmFocus)}>
              Create a family account
            </Link>
          </p>
        )}
      </div>
    );
  }

  if (screen === "forgot") {
    return (
      <AuthCard className="grid gap-6">
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

        <AuthCardHeading
          title="Reset your password"
          lead="We’ll email a secure link to set a new one. Student PINs are reset by a parent from the parent view, not from here."
        />

        <form key={shake.key} onSubmit={handleForgot} className={twMerge("grid gap-4", shake.className)}>
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
            errorId="auth-error"
          />
          {error && <MmErrorPanel id="auth-error" focusOnMount>{error}</MmErrorPanel>}
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
      </AuthCard>
    );
  }

  /* ---------- Sign in ---------- */

  return (
    <AuthCard className="grid gap-[22px]">
      {/* Fixed-height heading block: both roles' lead fits two lines, so switching role never moves the form. */}
      <div className="min-h-[104px]">
        <AuthCardHeading title={copy.title} lead={copy.lead} />
      </div>

      <div
        role="tablist"
        aria-label="Sign in as"
        className="grid grid-cols-2 gap-2 rounded-full border border-mm-line bg-mm-tint-soft p-1.5"
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
                  "min-h-[46px] rounded-full text-[14.5px] font-semibold transition-[color,background-color,box-shadow]",
                  selected
                    ? "bg-white text-mm-brand shadow-[0_1px_2px_rgba(24,21,31,0.06),0_12px_32px_rgba(49,32,86,0.08)]"
                    : "bg-transparent text-mm-ink-soft hover:text-mm-ink",
                ),
                mmFocus,
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Parent only: the OAuth providers attach a real email identity, which a student profile does not have.
          Shown only for providers actually configured, so no button does nothing. */}
      {kind === "parent" && oauthProviders.length > 0 && (
        <>
          <SocialButtons nextPath={explicitNext ?? "/"} providers={oauthProviders} />
          <div className="flex items-center gap-3 text-[13px] text-mm-muted">
            <span aria-hidden="true" className="h-px flex-1 bg-mm-line" />
            or with your email
            <span aria-hidden="true" className="h-px flex-1 bg-mm-line" />
          </div>
        </>
      )}

      {!auth.configured && (
        <p
          role="status"
          className="rounded-xl border border-mm-tint-line bg-mm-tint p-3.5 text-sm leading-[1.5] text-mm-ink-soft"
        >
          Accounts aren&apos;t connected on this device yet. Practice still works as a guest —
          add Supabase keys to <code className="font-mono">.env.local</code> to enable sign-in.
        </p>
      )}

      <form
        key={shake.key}
        onSubmit={handleSignIn}
        /* Reserved height = the student form (code + hint, six PIN boxes + hint). The parent form is shorter, so its
           remember row and button are pushed to the bottom (mt-auto below): switching role moves nothing. */
        className={twMerge("flex min-h-[385px] flex-col gap-4", shake.className)}
      >
        <MmField
          id="auth-ident"
          label={copy.idLabel}
          hint={
            kind === "student"
              ? "On the card your parent printed. Letters and numbers, like K7XJ-2P9R."
              : undefined
          }
          type="text"
          inputMode={kind === "student" ? "text" : "email"}
          autoComplete={copy.idAutoComplete}
          /* A login code is not a word: no sentence-casing, no spellcheck
             squiggles, capitals on the keyboard. An email is never
             auto-capitalised. */
          autoCapitalize={kind === "student" ? "characters" : "none"}
          autoCorrect="off"
          spellCheck={false}
          placeholder={copy.idPlaceholder}
          value={ident}
          onChange={(e) => {
            setIdent(e.currentTarget.value);
            setError(null);
          }}
          invalid={error !== null}
          errorId="auth-error"
        />

        {kind === "student" ? (
          <PinInput
            id="auth-secret"
            label={copy.secretLabel}
            hint="6 numbers. Nobody can see what you type."
            value={secret}
            onChange={(next) => {
              setSecret(next);
              setError(null);
            }}
            invalid={error !== null}
            errorId="auth-error"
          />
        ) : (
        <MmField
          id="auth-secret"
          label={copy.secretLabel}
          type={showSecret ? "text" : "password"}
          autoComplete={copy.secretAutoComplete}
          placeholder={copy.secretPlaceholder}
          value={secret}
          onChange={(e) => {
            setSecret(e.currentTarget.value);
            setError(null);
          }}
          invalid={error !== null}
          errorId="auth-error"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          trailingRoom
          trailing={
            <MmRevealButton
              controls="auth-secret"
              visible={showSecret}
              onToggle={() => setShowSecret((v) => !v)}
            />
          }
        />
        )}

        {error && (
          <MmErrorPanel id="auth-error" focusOnMount>
            <span>
              {error}
              {kind === "parent" && error === copy.failedError && (
                <button
                  type="button"
                  onClick={() => {
                    setScreen("forgot");
                    setResetEmail(ident);
                    setError(null);
                  }}
                  className={twMerge(
                    "mt-1 block min-h-11 rounded font-bold underline underline-offset-2",
                    mmFocus,
                  )}
                >
                  Reset password
                </button>
              )}
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
            {copy.lockedMessage(lockSecondsRemaining)}
            {kind === "student" && (
              <>
                {" "}
                <Link
                  href="/student-sign-in/help"
                  className={twMerge("inline-flex min-h-11 items-center rounded font-bold underline", mmFocus)}
                >
                  Ask for help
                </Link>
              </>
            )}
          </p>
        )}

        <div className="mt-auto flex min-h-11 items-center justify-between gap-3">
          <MmCheckbox id="auth-remember" checked={remember} onToggle={() => setRemember((v) => !v)}>
            Keep me signed in
          </MmCheckbox>
          {kind === "parent" && (
            <button
              type="button"
              onClick={() => {
                setScreen("forgot");
                setResetEmail(ident);
                setError(null);
              }}
              className={twMerge(
                "inline-flex min-h-11 shrink-0 items-center rounded text-sm font-semibold text-mm-brand hover:underline",
                mmFocus,
              )}
            >
              Forgot password?
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || isLocked}
          className={mmAuthButton({
            disabled: submitting || isLocked,
            className: "mt-1 min-h-[50px] w-full rounded-xl text-[15px]",
          })}
        >
          {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
          {isLocked ? `Try again in ${lockSecondsRemaining}s` : copy.submit}
        </button>
      </form>

      <p className="flex min-h-11 items-center justify-center text-center text-sm text-mm-muted">
        {kind === "student" ? (
          <Link
            href="/student-sign-in/help"
            className={twMerge("inline-flex min-h-11 items-center rounded font-semibold text-mm-brand hover:underline", mmFocus)}
          >
            I can&apos;t sign in
          </Link>
        ) : PUBLIC_SIGNUP_ENABLED ? (
          <span>
            New here?{" "}
            <Link href="/sign-up" className={twMerge("rounded font-semibold text-mm-brand hover:underline", mmFocus)}>
              Create a family account
            </Link>
          </span>
        ) : (
          /* No "create an account" prompt when there is no account to create. */
          <span>
            No account?{" "}
            <Link href="/practice" className={twMerge("rounded font-semibold text-mm-brand hover:underline", mmFocus)}>
              Practise as a guest
            </Link>
          </span>
        )}
      </p>
    </AuthCard>
  );
}
