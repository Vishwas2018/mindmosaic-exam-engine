"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useAuth, type EmailConfirmResult } from "../AuthProvider";
import { friendlyLinkError, readLinkCredentials, stripLinkCredentials } from "../link-errors";
import { roleHomePath } from "../roles";
import { MmErrorPanel, MmField, mmAuthButton, mmFocus } from "./auth-fields";
import { useFocusOnShow } from "./use-focus-on-show";

type Stage = "verifying" | "success" | "error";

/*
 * Read once at mount, via a lazy useState initializer rather than an effect:
 * next/navigation's useSearchParams() (unlike raw window.location) is
 * already consistent between the server and client render, so computing the
 * link's initial stage here carries no hydration-mismatch risk — only the
 * *async* confirmEmail() call genuinely needs to live in an effect.
 */
function computeInitialStage(
  searchParams: URLSearchParams,
  configured: boolean,
): { stage: Stage; message: string | null } {
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (errorCode) return { stage: "error", message: errorMessage(errorCode, errorDescription) };
  if (!configured) {
    return { stage: "error", message: "Accounts aren't connected on this device yet." };
  }
  /* A link with no query credentials may still carry them in the fragment (implicit flow), which neither the server
     nor the first render can see, so every other case verifies first and decides in the effect. */
  return { stage: "verifying", message: null };
}

function errorMessage(errorCode: string | null, errorDescription: string | null): string {
  return errorCode === "otp_expired"
    ? "This verification link has expired."
    : (errorDescription?.replace(/\+/g, " ") ??
        "This verification link is invalid or has already been used.");
}

/**
 * Screen 6: lands from the confirmation-email link (see AuthProvider.signUp's
 * emailRedirectTo and /auth/confirm). Exchanges the `code` for a session,
 * then redirects to the confirmed user's role home — matching the same
 * role-based routing AuthCard uses after sign-in. An expired/invalid link
 * (Supabase reports this via `error_code`/`error_description` query params
 * rather than a `code`) shows a resend form instead of spinning forever.
 *
 * Restyled onto the mm-* auth system (was the product's generic
 * `@/components/ui` kit) to match /sign-in and /sign-up.
 */
export function EmailVerificationScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirmEmail, verifyEmailToken, adoptSessionTokens, resendConfirmationEmail, configured } = useAuth();

  const [initial] = useState(() => computeInitialStage(searchParams, configured));
  const [stage, setStage] = useState<Stage>(initial.stage);
  const [message, setMessage] = useState<string | null>(initial.message);
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [resending, setResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);
  const headingRef = useFocusOnShow<HTMLHeadingElement>(stage === "error");

  useEffect(() => {
    if (initial.stage !== "verifying") return;
    const link = readLinkCredentials(searchParams, window.location.hash);

    let active = true;
    const verify = async (): Promise<EmailConfirmResult> => {
      if (link.errorCode) return { ok: false, message: errorMessage(link.errorCode, link.errorDescription) };
      /* token_hash first: it verifies on any device. A PKCE `code` only works in the browser that requested it. */
      if (link.tokenHash && (link.type === "signup" || link.type === "email")) {
        return verifyEmailToken(link.tokenHash, link.type);
      }
      if (link.code) return confirmEmail(link.code);
      if (link.accessToken && link.refreshToken) {
        return adoptSessionTokens(link.accessToken, link.refreshToken);
      }
      return { ok: false, message: errorMessage(null, null) };
    };
    verify().then((result) => {
      if (!active) return;
      if (!result.ok) {
        setStage("error");
        setMessage(friendlyLinkError(result.message, "Could not verify your email."));
        return;
      }
      /* Single-use credentials do not belong in the address bar, history or a shared screenshot. */
      stripLinkCredentials();
      setStage("success");
      const destination = roleHomePath(result.role);
      setTimeout(() => {
        if (!active) return;
        router.push(destination);
        router.refresh();
      }, 1200);
    });
    return () => {
      active = false;
    };
    // Runs once against the link's query params — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleResend(event: FormEvent) {
    event.preventDefault();
    if (resending || email.trim().length === 0) return;
    setResending(true);
    setResendFeedback(null);
    const result = await resendConfirmationEmail(email.trim());
    setResendFeedback(
      result.message ?? (result.ok ? "Confirmation email resent." : "Could not resend the email."),
    );
    setResending(false);
  }

  return (
    <main
      id="main-content"
      className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
    >
      <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10">
        {stage === "verifying" && (
          <>
            <Loader2 aria-hidden="true" className="mx-auto h-10 w-10 animate-spin text-mm-brand" />
            <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
              Verifying your email…
            </h1>
            <p className="mt-2 text-sm text-mm-muted">This only takes a moment.</p>
          </>
        )}

        {stage === "success" && (
          <>
            <CheckCircle2 aria-hidden="true" className="mx-auto h-10 w-10 text-[#0B6B63]" />
            <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
              Email confirmed!
            </h1>
            <p role="status" className="mt-2 text-sm text-mm-muted">
              Taking you to your dashboard…
            </p>
          </>
        )}

        {stage === "error" && (
          <>
            <MailWarning aria-hidden="true" className="mx-auto h-10 w-10 text-mm-coral-deep" />
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink outline-none"
            >
              Link expired or invalid
            </h1>
            <MmErrorPanel>{message}</MmErrorPanel>

            <form onSubmit={handleResend} className="mt-6 grid gap-4 text-left">
              <MmField
                id="verify-resend-email"
                label="Email address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
              <button
                type="submit"
                disabled={resending || email.trim().length === 0}
                className={mmAuthButton({
                  disabled: resending || email.trim().length === 0,
                  className: "w-full",
                })}
              >
                {resending && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
                Resend verification email
              </button>
            </form>

            {resendFeedback && (
              <p
                role="status"
                className="mm-rise-fast mt-4 rounded-xl bg-mm-tint px-4 py-3 text-sm font-semibold text-mm-brand"
              >
                {resendFeedback}
              </p>
            )}

            <Link
              href="/sign-in"
              className={twMerge(
                "mt-5 inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline",
                mmFocus,
              )}
            >
              ← Back to sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
