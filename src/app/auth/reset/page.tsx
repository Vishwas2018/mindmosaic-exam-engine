"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/features/auth";
import { CROSS_DEVICE_MESSAGE, readLinkCredentials, stripLinkCredentials } from "@/features/auth/link-errors";
import { useFocusOnShow } from "@/features/auth/components/use-focus-on-show";
import { forgetRecovery } from "@/features/auth/recovery-marker";
import {
  MmErrorPanel,
  MmField,
  MmRevealButton,
  mmAuthButton,
  mmFocus,
  useShakeOnInvalidSubmit,
} from "@/features/auth/components/auth-fields";
import { PasswordStrength } from "@/features/auth/components/PasswordStrength";
import { evaluatePassword } from "@/features/auth/password";

/**
 * Why the form cannot be shown. The provider reports an expired link by code
 * (`otp_expired`); a link that was already spent arrives as anything else.
 * Those are told apart because they call for different next steps, but the
 * provider's own wording is never shown.
 *   - `other_device`: a PKCE link opened away from the browser that asked for it.
 *   - `no_link`: /auth/reset opened directly, with no link and no session.
 *   - `not_recovery`: a session exists but no password-recovery link made it
 *     (password, signup, magic-link or OTP sign-in), so it may not set a password here.
 */
type LinkProblem = "expired" | "used" | "other_device" | "no_link" | "not_recovery";

const LINK_COPY: Record<LinkProblem, { title: string; body: string; action: string }> = {
  expired: {
    /* The auth server gives a lapsed link, a link that was already used and a made-up one the same `otp_expired`
       code, so this copy covers all three rather than asserting one of them. */
    title: "This reset link has expired or was already used",
    body: "This password reset link has expired or was already used. Reset links work once, for one hour. Ask for a new one and we’ll send it.",
    action: "Start again",
  },
  used: {
    title: "This link can’t be used",
    body: "This link has already been used or isn’t valid. If that was you, your password is already changed — just sign in. If it wasn’t, ask for a new link straight away.",
    action: "Reset again",
  },
  other_device: {
    title: "Open this link on the same device",
    body: CROSS_DEVICE_MESSAGE,
    action: "Request a new reset link",
  },
  no_link: {
    title: "Open your reset link",
    body: "This page opens from the link in your password-reset email. Request a new link if you don’t have it.",
    action: "Request a new reset link",
  },
  not_recovery: {
    title: "Open your reset link",
    body: "This page only opens from the link in a password-reset email, even if you are already signed in. Request a new link if you need one.",
    action: "Request a new reset link",
  },
};

/** How long a PKCE `code` link may take to turn into a session before it is treated as unusable here. */
const CODE_EXCHANGE_MS = 6000;

/**
 * Landing page for the password-reset email link (the second half of
 * Account Recovery — the first half is the "forgot" screen).
 *
 * The form opens only for a session the server accepts AND that a recovery
 * link created; a `token_hash` link is verified by the token alone, so it
 * works on whichever device the email was opened on. A dead link comes back
 * as `error`/`error_code` query or hash params instead of a session — that
 * state gets its own screen rather than a confusing form.
 *
 * Honesty rules: "changed" is shown only once the server accepted the
 * change, and "we signed out your other devices" only when the server
 * confirmed that too.
 */
export default function ResetPasswordPage() {
  const {
    updatePassword,
    verifyRecoveryToken,
    verifyRecoverySession,
    adoptSessionTokens,
    signOut,
    session,
    configured,
    status,
  } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* "checking" until the link has been classified; the server and first client render cannot read the URL's hash or
     query, so deciding during render would diverge from the server HTML and break hydration. */
  const [phase, setPhase] = useState<"checking" | "form" | "problem">("checking");
  const [linkProblem, setLinkProblem] = useState<LinkProblem | null>(null);
  /* "code" = a PKCE link the Supabase client exchanges by itself; "none" = no credentials in the URL. */
  const [mode, setMode] = useState<"pending" | "code" | "none" | "settled">("pending");
  const [saved, setSaved] = useState<{ otherDevicesSignedOut: boolean } | null>(null);
  const shake = useShakeOnInvalidSubmit();
  const headingRef = useFocusOnShow<HTMLHeadingElement>(phase === "problem");

  const showProblem = (next: LinkProblem) => {
    setLinkProblem(next);
    setPhase("problem");
  };

  useEffect(() => {
    /* Runs once. These setState calls respond to the URL, an external system, after hydration. */
    const link = readLinkCredentials(new URL(window.location.href).searchParams, window.location.hash);
    const settle = async (result: { ok: boolean; message?: string }) => {
      /* A link that produced a session is still not proof of recovery: a signup or magic-link URL pasted here would
         also yield one. Only a session the server accepts AND that was created by a recovery link opens the form. */
      if (result.ok && (await verifyRecoverySession())) {
        stripLinkCredentials();
        setPhase("form");
      } else if (result.ok) {
        showProblem("not_recovery");
      } else {
        showProblem(
          result.message === "expired" ? "expired" : result.message === "other_device" ? "other_device" : "used",
        );
      }
      setMode("settled");
    };
    if (link.errorCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      showProblem(link.errorCode === "otp_expired" ? "expired" : "used");
      setMode("settled");
    } else if (link.tokenHash && link.type === "recovery") {
      /* Verified by the token alone, so it works on whichever device the email was opened on. */
      void verifyRecoveryToken(link.tokenHash).then(settle);
    } else if (link.accessToken && link.refreshToken) {
      void adoptSessionTokens(link.accessToken, link.refreshToken).then(settle);
    } else {
      setMode(link.code ? "code" : "none");
    }
    // Once, against the URL as it arrived.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The session's token changes when the SDK finishes exchanging a code, so it is a dependency: re-verify then. */
  const accessToken = session?.access_token ?? null;
  useEffect(() => {
    if (mode !== "code" && mode !== "none") return;
    if (status === "unconfigured") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("form");
      return;
    }
    if (status === "loading") return;
    if (status === "anonymous") {
      if (mode === "none") showProblem("no_link");
      return; // "code": the exchange may still be running; the timeout below decides.
    }
    let active = true;
    void verifyRecoverySession().then((isRecovery) => {
      if (!active) return;
      if (isRecovery) {
        setPhase("form");
        if (mode === "code") stripLinkCredentials();
      } else if (mode === "none") {
        showProblem("not_recovery");
      }
      // mode "code": an ordinary session may exist until the exchange replaces it; keep waiting for the timeout.
    });
    return () => {
      active = false;
    };
  }, [mode, status, accessToken, verifyRecoverySession]);

  useEffect(() => {
    if (mode !== "code" || phase !== "checking") return;
    /* A PKCE code is exchanged against a verifier held by the browser that requested the reset. Give that exchange a
       moment, then explain rather than leave the user on a form that cannot work. */
    const timer = setTimeout(() => showProblem("other_device"), CODE_EXCHANGE_MS);
    return () => clearTimeout(timer);
  }, [mode, phase]);

  const rules = evaluatePassword(password);
  const mismatch = confirm.length > 0 && confirm !== password;
  const ready = rules.allMet && confirm === password;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready || submitting) return;
    setSubmitting(true);
    setError(null);
    let result: Awaited<ReturnType<typeof updatePassword>>;
    try {
      result = await updatePassword(password);
    } catch {
      result = { ok: false, failure: "network", message: "We couldn’t reach MindMosaic. Check your connection and try again." };
    }
    setSubmitting(false);
    if (result.ok) {
      /* The recovery session on this device is spent: end it too, so the next
         step really is "sign in with the new password". The recovery marker
         goes with it so it cannot be reused after a successful reset. */
      forgetRecovery();
      await signOut();
      setSaved({ otherDevicesSignedOut: result.otherDevicesSignedOut === true });
    } else if (result.message && /session/i.test(result.message)) {
      // No recovery session (the link was already used, or opened cold
      // without following it from the email) — same dead end as a spent link.
      showProblem("used");
    } else {
      setError(
        result.failure === "network"
          ? (result.message ?? "We couldn’t reach MindMosaic. Check your connection and try again.")
          : (result.message ?? "We couldn’t change your password just now. Please try again."),
      );
      shake.trigger();
    }
  }

  if (saved) {
    return (
      <main
        id="main-content"
        className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
      >
        <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10">
          <CheckCircle2 aria-hidden="true" className="mx-auto h-10 w-10 text-[#0B6B63]" />
          <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
            Password changed
          </h1>
          <p role="status" className="mt-2 text-sm leading-[1.6] text-mm-muted">
            You can sign in with it now.
            {saved.otherDevicesSignedOut &&
              " We signed out your other devices, so they will ask for the new one."}
          </p>
          {/* Only a parent resets a password, so this opens the parent form, not the "who is signing in?" chooser. */}
          <Link href="/sign-in?entry=signin" className={mmAuthButton({ className: "mt-6 w-full" })}>
            Go to sign-in
          </Link>
        </div>
      </main>
    );
  }

  if (phase === "problem" && linkProblem) {
    const copy = LINK_COPY[linkProblem];
    return (
      <main
        id="main-content"
        className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
      >
        <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10">
          <MailWarning aria-hidden="true" className="mx-auto h-10 w-10 text-mm-coral-deep" />
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink outline-none"
          >
            {copy.title}
          </h1>
          <p role="alert" className="mt-2 text-sm leading-[1.5] text-mm-muted">
            {copy.body}
          </p>
          <Link href="/auth/forgot" className={mmAuthButton({ className: "mt-6 w-full" })}>
            {copy.action}
          </Link>
          <Link
            href="/sign-in"
            className={twMerge(
              "mt-5 inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline",
              mmFocus,
            )}
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (phase === "checking") {
    return (
      <main
        id="main-content"
        className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
      >
        <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10">
          <Loader2 aria-hidden="true" className="mx-auto h-10 w-10 animate-spin text-mm-brand" />
          <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">Checking your link…</h1>
          <p role="status" className="mt-2 text-sm text-mm-muted">This only takes a moment.</p>
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
    >
      <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10">
        <h1 className="text-2xl font-[700] tracking-[-0.03em] text-mm-ink">Set a new password</h1>
        <p className="mt-2 text-sm leading-[1.5] text-mm-muted">
          Choose a password you have not used here before.
        </p>

        {!configured && (
          <p
            role="status"
            className="mm-rise-fast mt-5 rounded-xl bg-mm-tint px-4 py-3 text-sm font-semibold text-mm-ink-soft"
          >
            Accounts aren&apos;t connected on this device yet.
          </p>
        )}

        {error && (
          <div className="mt-5">
            <MmErrorPanel id="reset-error">{error}</MmErrorPanel>
          </div>
        )}

        <form
          key={shake.key}
          onSubmit={handleSubmit}
          className={twMerge("mt-6 grid gap-4", shake.className)}
        >
          <div>
            <MmField
              id="new-password"
              label="New password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              invalid={error !== null}
              errorId="reset-error"
              trailingRoom
              trailing={
                <MmRevealButton
                  controls="new-password"
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              }
            />
            {password.length > 0 && <PasswordStrength password={password} />}
          </div>
          <div>
            <MmField
              id="confirm-password"
              label="Confirm new password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={confirm}
              onChange={(e) => setConfirm(e.currentTarget.value)}
              invalid={mismatch}
              errorId="confirm-mismatch"
              trailingRoom
              trailing={
                <MmRevealButton
                  controls="confirm-password"
                  visible={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                />
              }
            />
            {confirm.length > 0 && (
              <p
                id="confirm-mismatch"
                role={mismatch ? "alert" : "status"}
                className={twMerge(
                  "mt-2 text-sm font-semibold",
                  mismatch ? "text-mm-coral-deep" : "text-mm-brand",
                )}
              >
                {mismatch ? "The two passwords don’t match yet." : "Passwords match"}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={!ready || submitting}
            className={mmAuthButton({ disabled: !ready || submitting, className: "w-full" })}
          >
            {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
            Save new password
          </button>
          <p className="text-[13px] leading-[1.5] text-mm-muted">
            Saving this signs you out on your other devices, so you sign in fresh with the new
            password.
          </p>
        </form>
      </div>
    </main>
  );
}
