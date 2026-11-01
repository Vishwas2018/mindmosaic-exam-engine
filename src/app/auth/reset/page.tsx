"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MailWarning } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/features/auth";
import {
  CROSS_DEVICE_MESSAGE,
  friendlyLinkError,
  readLinkCredentials,
  stripLinkCredentials,
} from "@/features/auth/link-errors";
import { useFocusOnShow } from "@/features/auth/components/use-focus-on-show";
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

/** How long a PKCE `code` link may take to turn into a session before it is treated as unusable here. */
const CODE_EXCHANGE_MS = 6000;

function computeInitialStage(): {
  phase: "checking" | "problem";
  problem: LinkProblem | null;
} {
  if (typeof window === "undefined") return { phase: "checking", problem: null };
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const errorCode = url.searchParams.get("error_code") ?? hash.get("error_code");
  const errorDescription = url.searchParams.get("error_description") ?? hash.get("error_description");
  if (errorCode) {
    return {
      phase: "problem",
      problem: {
        heading: EXPIRED.heading,
        text:
          errorCode === "otp_expired"
            ? "This password reset link has expired."
            : (errorDescription?.replace(/\+/g, " ") ?? "This password reset link is invalid."),
      },
    };
  }
  return { phase: "checking", problem: null };
}

/**
 * Checks if an authenticated session was established via recovery.
 * Ordinary authenticated sessions (e.g. password sign-in) have amr: [{ method: "password" }],
 * not recovery or otp, and cannot bypass recovery requirements by navigating cold to /auth/reset.
 */
function isRecoveryContext(session: unknown): boolean {
  if (!session || typeof session !== "object") return false;
  const s = session as { amr?: Array<{ method: string }>; user?: { amr?: Array<{ method: string }> }; recovery?: boolean };
  if (s.recovery === true) return true;
  const amr = s.amr ?? s.user?.amr;
  if (Array.isArray(amr)) {
    return amr.some((entry) => entry.method === "recovery" || entry.method === "otp");
  }
  // If session exists without explicit non-recovery amr in mock or recovery flow, allow if marked.
  return false;
}

/**
 * Landing page for the password-reset email link (the second half of
 * Account Recovery — the first half is SignInPanel's "forgot" screen).
 *
 * Restyled onto the mm-* auth system to match /sign-in and /sign-up.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, verifyRecoveryToken, adoptSessionTokens, session, configured, status } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const [initial] = useState(computeInitialStage);
  const [phase, setPhase] = useState<"checking" | "form" | "problem">(initial.phase);
  const [problem, setProblem] = useState<LinkProblem | null>(initial.problem);
  const [mode, setMode] = useState<"pending" | "code" | "none" | "settled">(
    initial.phase === "problem" ? "settled" : "pending",
  );

  const shake = useShakeOnInvalidSubmit();
  const headingRef = useFocusOnShow<HTMLHeadingElement>(phase === "problem");

  const showProblem = (next: LinkProblem) => {
    setProblem(next);
    setPhase("problem");
    setMode("settled");
  };

  useEffect(() => {
    if (initial.phase === "problem") return;

    const link = readLinkCredentials(new URL(window.location.href).searchParams, window.location.hash);
    const settle = (result: { ok: boolean; message?: string }) => {
      if (result.ok) {
        stripLinkCredentials();
        setPhase("form");
        setMode("settled");
      } else {
        showProblem({ heading: EXPIRED.heading, text: friendlyLinkError(result.message, EXPIRED.text) });
      }
    };

    if (link.errorCode) {
      const text =
        link.errorCode === "otp_expired"
          ? "This password reset link has expired."
          : (link.errorDescription?.replace(/\+/g, " ") ?? "This password reset link is invalid.");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      showProblem({ heading: EXPIRED.heading, text });
    } else if (link.tokenHash && link.type === "recovery") {
      void verifyRecoveryToken(link.tokenHash).then(settle);
    } else if (link.accessToken && link.refreshToken) {
      void adoptSessionTokens(link.accessToken, link.refreshToken).then(settle);
    } else {
      setMode(link.code ? "code" : "none");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== "code" && mode !== "none") return;

    // Unconfigured environment (guest e2e test suite): show form directly.
    if (status === "unconfigured") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("form");
      return;
    }

    if (status === "loading") return;

    if (mode === "code") {
      if (status === "authenticated") {
        setPhase("form");
        stripLinkCredentials();
        return;
      }
      const timer = setTimeout(
        () => showProblem({ heading: EXPIRED.heading, text: CROSS_DEVICE_MESSAGE }),
        CODE_EXCHANGE_MS,
      );
      return () => clearTimeout(timer);
    }

    if (mode === "none") {
      // Direct access without link credentials:
      // If user has an active recovery session (e.g. established via recovery token or amr), allow form.
      if (status === "authenticated" && isRecoveryContext(session)) {
        setPhase("form");
        return;
      }
      // Otherwise (whether anonymous or an ordinary authenticated session), lock out cold access.
      showProblem(NO_LINK);
    }
  }, [mode, status, session]);

  const ready = evaluatePassword(password).allMet && confirm === password;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready || submitting) return;
    setSubmitting(true);
    setMessage(null);

    const result = await updatePassword(password);
    setSubmitting(false);

    if (result.ok) {
      setMessage({
        tone: "success",
        text: "Your password has been updated. Taking you to sign in…",
      });
      setTimeout(() => {
        router.push("/sign-in");
        router.refresh();
      }, 1500);
    } else if (result.message && /session/i.test(result.message)) {
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
              <MmErrorPanel focusOnMount>{message.text}</MmErrorPanel>
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
