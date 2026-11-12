"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MailWarning } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/features/auth";
import { CROSS_DEVICE_MESSAGE, friendlyLinkError, readLinkCredentials, stripLinkCredentials } from "@/features/auth/link-errors";
import { useFocusOnShow } from "@/features/auth/components/use-focus-on-show";
import { forgetRecovery } from "@/features/auth/recovery-marker";
import {
  MmErrorPanel,
  MmField,
  mmAuthButton,
  mmFocus,
  useShakeOnInvalidSubmit,
} from "@/features/auth/components/auth-fields";
import { PasswordStrength } from "@/features/auth/components/PasswordStrength";
import { evaluatePassword } from "@/features/auth/password";

interface LinkProblem {
  readonly heading: string;
  readonly text: string;
}

const EXPIRED: LinkProblem = {
  heading: "Link expired or invalid",
  text: "This password reset link has expired or has already been used.",
};

/** Opened /auth/reset directly, with no link and no session: there is nothing to reset yet. */
const NO_LINK: LinkProblem = {
  heading: "Open your reset link",
  text: "This page opens from the link in your password-reset email. Request a new link if you don't have it.",
};

/** A session exists but it was not created by a password-recovery link (password, signup, magic-link or OTP sign-in). */
const NOT_RECOVERY: LinkProblem = {
  heading: "Open your reset link",
  text: "This page only opens from the link in a password-reset email, even if you are already signed in. Request a new link if you need one.",
};

/** How long a PKCE `code` link may take to turn into a session before it is treated as unusable here. */
const CODE_EXCHANGE_MS = 6000;

/**
 * Landing page for the password-reset email link (the second half of
 * Account Recovery — the first half is SignInPanel's "forgot" screen).
 * Supabase establishes a short-lived recovery session when the user
 * arrives here, so we simply let them set a new password via
 * `updateUser`. An expired or already-used link comes back as
 * `error`/`error_code` query or hash params instead of a session — that
 * state gets its own screen rather than a confusing form.
 *
 * Restyled onto the mm-* auth system (was the product's generic
 * `@/components/ui` kit) to match /sign-in and /sign-up.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, verifyRecoveryToken, verifyRecoverySession, adoptSessionTokens, signOut, session, configured, status } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  /* "checking" until the link has been classified; the server and first client render cannot read the URL's hash or
     query, so deciding during render would diverge from the server HTML and break hydration. */
  const [phase, setPhase] = useState<"checking" | "form" | "problem">("checking");
  const [problem, setProblem] = useState<LinkProblem | null>(null);
  /* "code" = a PKCE link the Supabase client exchanges by itself; "none" = no credentials in the URL. */
  const [mode, setMode] = useState<"pending" | "code" | "none" | "settled">("pending");
  const shake = useShakeOnInvalidSubmit();
  const headingRef = useFocusOnShow<HTMLHeadingElement>(phase === "problem");

  const showProblem = (next: LinkProblem) => {
    setProblem(next);
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
        showProblem(NOT_RECOVERY);
      } else {
        showProblem({ heading: EXPIRED.heading, text: friendlyLinkError(result.message, EXPIRED.text) });
      }
      setMode("settled");
    };
    if (link.errorCode) {
      const text =
        link.errorCode === "otp_expired"
          ? "This password reset link has expired."
          : (link.errorDescription?.replace(/\+/g, " ") ?? "This password reset link is invalid.");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      showProblem({ heading: EXPIRED.heading, text });
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
      if (mode === "none") showProblem(NO_LINK);
      return; // "code": the exchange may still be running; the timeout below decides.
    }
    let active = true;
    void verifyRecoverySession().then((isRecovery) => {
      if (!active) return;
      if (isRecovery) {
        setPhase("form");
        if (mode === "code") stripLinkCredentials();
      } else if (mode === "none") {
        showProblem(NOT_RECOVERY);
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
    const timer = setTimeout(() => showProblem({ heading: EXPIRED.heading, text: CROSS_DEVICE_MESSAGE }), CODE_EXCHANGE_MS);
    return () => clearTimeout(timer);
  }, [mode, phase]);

  const ready = evaluatePassword(password).allMet && confirm === password;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready || submitting) return;
    setSubmitting(true);
    setMessage(null);
    const result = await updatePassword(password);
    setSubmitting(false);
    if (result.ok) {
      setMessage({ tone: "success", text: "Password updated — taking you to sign in…" });
      /* End the recovery session so the next step is a normal sign-in with the new password.
       * Also clear the recovery marker so it cannot be reused after a successful reset. */
      void signOut();
      forgetRecovery();
      setTimeout(() => router.push("/sign-in"), 1500);
    } else if (result.message && /session/i.test(result.message)) {
      // No recovery session (e.g. the link was already used, or opened cold
      // without following it from the email) — same dead-end as an expired link.
      showProblem(EXPIRED);
    } else {
      setMessage({ tone: "error", text: result.message ?? "Could not update your password." });
      shake.trigger();
    }
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

  if (phase === "problem" && problem) {
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
            {problem.heading}
          </h1>
          <p role="alert" className="mt-2 text-sm leading-[1.5] text-mm-muted">
            {problem.text}
          </p>
          <Link
            href="/auth/forgot"
            className={mmAuthButton({ className: "mt-6 w-full" })}
          >
            Request a new reset link
          </Link>
          <Link
            href="/sign-in"
            className={twMerge(
              "mt-5 inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline",
              mmFocus,
            )}
          >
            ← Back to sign in
          </Link>
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
        <h1 className="text-2xl font-[700] tracking-[-0.03em] text-mm-ink">Choose a new password</h1>
        <p className="mt-2 text-sm leading-[1.5] text-mm-muted">
          Enter a new password for your account below.
        </p>

        {!configured && (
          <p
            role="status"
            className="mm-rise-fast mt-5 rounded-xl bg-mm-tint px-4 py-3 text-sm font-semibold text-mm-ink-soft"
          >
            Accounts aren&apos;t connected on this device yet.
          </p>
        )}

        {message &&
          (message.tone === "error" ? (
            <div className="mt-5">
              <MmErrorPanel>{message.text}</MmErrorPanel>
            </div>
          ) : (
            <p
              role="status"
              className="mm-rise-fast mt-5 rounded-xl bg-mm-tint px-4 py-3 text-sm font-semibold text-mm-brand"
            >
              {message.text}
            </p>
          ))}

        <form
          key={shake.key}
          onSubmit={handleSubmit}
          className={twMerge("mt-6 grid gap-4", shake.className)}
        >
          <div>
            <MmField
              id="new-password"
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            {password.length > 0 && <PasswordStrength password={password} />}
          </div>
          <div>
            <MmField
              id="confirm-password"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.currentTarget.value)}
              invalid={confirm.length > 0 && confirm !== password}
            />
            {confirm.length > 0 && (
              <p
                className={twMerge(
                  "mt-2 text-sm font-semibold",
                  confirm === password ? "text-mm-brand" : "text-mm-coral-deep",
                )}
              >
                {confirm === password ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={!ready || submitting}
            className={mmAuthButton({ disabled: !ready || submitting, className: "w-full" })}
          >
            {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
            Update password
          </button>
        </form>
      </div>
    </main>
  );
}
