"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MailWarning } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/features/auth";
import { CROSS_DEVICE_MESSAGE, friendlyLinkError, readLinkCredentials, stripLinkCredentials } from "@/features/auth/link-errors";
import { useFocusOnShow } from "@/features/auth/components/use-focus-on-show";
import { recoveryStatus, requestGrantForSession, submitNewPassword, verifyRecoveryLink } from "@/features/auth/recovery-client";
import { clearSessionPersistence } from "@/features/auth/session-persistence";
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

/** The outcome of an attempt on this link could not be confirmed. The link is retired for safety; a fresh one is free. */
const UNCERTAIN: LinkProblem = {
  heading: "Request a new reset link",
  text: "We could not confirm whether your password was changed, so this link can no longer be used. Try signing in with your new password first. If that does not work, request a new reset link.",
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
 * Landing page for the password-reset email link (the second half of Account Recovery — the first half is
 * SignInPanel's "forgot" screen).
 *
 * The new password is accepted by OUR server (POST /api/auth/recovery/password), and only with a recovery grant the
 * server issued after verifying a recovery token itself (src/server/auth/recovery-grant.ts). This page never calls
 * Supabase's update-user API. Three link shapes lead here:
 *   token_hash   verified by the server, on whichever device opened the email. The default template puts it in the
 *                URL fragment, so it is in no request log; it is removed from the address bar before anything else.
 *   code         a PKCE link the Supabase client exchanges by itself. We do NOT exchange it a second time: we wait for
 *                the session it creates and ask the server whether that session came from a recovery link.
 *   tokens       an implicit-flow fragment, adopted once into a session and then treated the same way.
 * An expired, reused or malformed link comes back as an error and gets its own screen rather than a confusing form.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { adoptSessionTokens, signOut, session, configured, status } = useAuth();
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
  /* The per-grant CSRF token. Memory only: a reload fetches it again from the server, which needs the grant cookie. */
  const csrf = useRef<string | null>(null);
  const shake = useShakeOnInvalidSubmit();
  const headingRef = useFocusOnShow<HTMLHeadingElement>(phase === "problem");

  const showProblem = (next: LinkProblem) => {
    setProblem(next);
    setPhase("problem");
  };
  const openForm = (token: string) => {
    csrf.current = token;
    setPhase("form");
  };

  useEffect(() => {
    /* Runs once. These setState calls respond to the URL, an external system, after hydration. */
    const link = readLinkCredentials(new URL(window.location.href).searchParams, window.location.hash);
    /* A one-time secret must leave the address bar (history, copy/paste, screenshots) before any network call. A PKCE
       `code` is left for the Supabase client, which is reading it right now. */
    if (link.tokenHash || link.accessToken || link.refreshToken) stripLinkCredentials();
    if (link.errorCode) {
      const text =
        link.errorCode === "otp_expired"
          ? "This password reset link has expired."
          : (link.errorDescription?.replace(/\+/g, " ") ?? "This password reset link is invalid.");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      showProblem({ heading: EXPIRED.heading, text });
      setMode("settled");
    } else if (link.tokenHash && link.type === "recovery") {
      /* Verified by the SERVER, so it works on whichever device the email was opened on. */
      void verifyRecoveryLink(link.tokenHash).then((result) => {
        if (result.ok) {
          /* The session the server just made must not be discarded by an old "don't keep me signed in" marker. */
          clearSessionPersistence();
          openForm(result.csrfToken);
        } else {
          showProblem(
            result.reason === "unavailable"
              ? { heading: "We couldn't check your link", text: "Something went wrong on our side. Please try the link again in a moment." }
              : EXPIRED,
          );
        }
        setMode("settled");
      });
    } else if (link.accessToken && link.refreshToken) {
      void adoptSessionTokens(link.accessToken, link.refreshToken).then(async (adopted) => {
        const grant = adopted.ok ? await requestGrantForSession() : null;
        if (grant?.ok) openForm(grant.csrfToken);
        else if (grant) showProblem(grant.reason === "not_recovery" ? NOT_RECOVERY : EXPIRED);
        else showProblem({ heading: EXPIRED.heading, text: friendlyLinkError(adopted.message, EXPIRED.text) });
        setMode("settled");
      });
    } else {
      setMode(link.code ? "code" : "none");
    }
    // Once, against the URL as it arrived.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The session's token changes when the SDK finishes exchanging a code, so it is a dependency: ask again then. */
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
    /* "none": a reload of the form (the grant cookie may still be valid) or a cold visit. "code": the server decides
       whether the session the SDK just made came from a recovery link. */
    const ask = mode === "none" ? recoveryStatus : requestGrantForSession;
    void ask().then((grant) => {
      if (!active) return;
      if (grant.ok) {
        openForm(grant.csrfToken);
        if (mode === "code") stripLinkCredentials();
      } else if (mode === "none") {
        showProblem(NOT_RECOVERY);
      }
      // mode "code": an ordinary session may exist until the exchange replaces it; keep waiting for the timeout.
    });
    return () => {
      active = false;
    };
  }, [mode, status, accessToken]);

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
    const result = csrf.current
      ? await submitNewPassword(password, csrf.current)
      : ({ ok: false, reason: "recovery_required" } as const);
    setSubmitting(false);
    if (result.ok) {
      setMessage({
        tone: "success",
        text: result.otherSessionsRevoked
          ? "Password updated and other devices signed out — taking you to sign in…"
          : "Password updated — taking you to sign in…",
      });
      csrf.current = null;
      /* The server has already ended every session; this clears the local copy so the next step is a normal sign-in. */
      void signOut();
      setTimeout(() => router.push("/sign-in"), 1500);
    } else if (result.reason === "uncertain") {
      showProblem(UNCERTAIN);
    } else if (result.reason === "recovery_required") {
      // The grant is missing, expired or no longer matches the session — same dead end as an expired link.
      showProblem(EXPIRED);
    } else if (result.reason === "rejected") {
      setMessage({ tone: "error", text: "That password can't be used. Choose a different one." });
      shake.trigger();
    } else {
      setMessage({
        tone: "error",
        text: result.reason === "weak" ? "Choose a stronger password." : "Could not update your password. Please try again.",
      });
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
            href="/sign-in?mode=forgot"
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
