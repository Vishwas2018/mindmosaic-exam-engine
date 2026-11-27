"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../AuthProvider";
import { MmErrorPanel, MmField, mmAuthButton } from "./auth-fields";

const GENERIC_FAILURE = "That email and password did not match a staff sign-in. Check them and try again.";

/**
 * Staff sign-in. There is deliberately no sign-up, no role picker and no "request admin access" control here: admin
 * entitlement is granted by MindMosaic through the service role and cannot be requested or self-assigned. A login
 * without it signs in fine and is simply routed to its own workspace by the /admin gate.
 */
export function StaffSignInForm({ next }: { next: string }) {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await auth.signInWithPassword(email.trim(), password);
    if (!result.ok) {
      /* Never echo the auth server's wording: it can reveal whether an account exists. */
      setError(result.failure === "network" || result.failure === "unavailable" ? "Sign-in is unavailable right now. Try again shortly." : GENERIC_FAILURE);
      setSubmitting(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5" aria-labelledby="staff-signin-heading" data-testid="staff-sign-in-form">
      <h1 id="staff-signin-heading" className="text-2xl font-extrabold text-mm-ink">
        Staff sign-in
      </h1>
      <MmField
        id="staff-email"
        label="Work email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        invalid={Boolean(error)}
        errorId="staff-error"
      />
      <MmField
        id="staff-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        invalid={Boolean(error)}
        errorId="staff-error"
      />
      {error && <MmErrorPanel id="staff-error">{error}</MmErrorPanel>}
      <button type="submit" disabled={submitting} className={mmAuthButton({ disabled: submitting })}>
        {submitting ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-mm-muted">
        Admin access is granted by MindMosaic. Looking for the family sign-in?{" "}
        <a className="font-semibold text-mm-brand underline" href="/sign-in">
          Go to sign-in
        </a>
        .
      </p>
    </form>
  );
}
