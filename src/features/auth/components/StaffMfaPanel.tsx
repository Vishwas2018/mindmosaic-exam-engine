"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import { MmErrorPanel, MmField, mmAuthButton } from "./auth-fields";

type Phase =
  | { kind: "loading" }
  | { kind: "verify"; factorId: string }
  | { kind: "enroll"; factorId: string; qr: string; secret: string }
  | { kind: "error"; message: string };

/**
 * TOTP step-up (Supabase MFA). If the login has a verified authenticator it asks for a code; if it has none it walks
 * through enrolment first. A successful challenge upgrades the session to aal2, which both requireRole("admin") and the
 * database's is_admin() check.
 *
 * Enrol BEFORE the platform switch is turned on (docs/security/multi-role): enrolling the first factor is possible at
 * aal1, so the legitimate owner must claim the authenticator before anyone else could.
 */
export function StaffMfaPanel({ next }: { next: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (!active) return;
      if (listError) {
        setPhase({ kind: "error", message: "Two-step verification is unavailable right now. Try again shortly." });
        return;
      }
      const verified = factors?.totp?.[0];
      if (verified) {
        setPhase({ kind: "verify", factorId: verified.id });
        return;
      }
      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `MindMosaic staff ${new Date().toISOString().slice(0, 10)}`,
      });
      if (!active) return;
      if (enrollError || !enrolled) {
        setPhase({ kind: "error", message: "Could not start authenticator setup. Try again shortly." });
        return;
      }
      setPhase({ kind: "enroll", factorId: enrolled.id, qr: enrolled.totp.qr_code, secret: enrolled.totp.secret });
    })();
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy || (phase.kind !== "verify" && phase.kind !== "enroll")) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: phase.factorId,
      code: code.trim(),
    });
    if (verifyError) {
      setError("That code was not accepted. Wait for a fresh code and try again.");
      setCode("");
      setBusy(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  if (phase.kind === "loading") return <p role="status">Checking your sign-in…</p>;
  if (phase.kind === "error") return <MmErrorPanel>{phase.message}</MmErrorPanel>;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5" data-testid="staff-mfa-form" aria-labelledby="staff-mfa-heading">
      <h1 id="staff-mfa-heading" className="text-2xl font-extrabold text-mm-ink">
        {phase.kind === "enroll" ? "Set up your authenticator" : "Enter your code"}
      </h1>
      {phase.kind === "enroll" && (
        <div className="grid gap-3 text-sm text-mm-ink-soft">
          <p>Scan this with an authenticator app (1Password, Google Authenticator, Authy), then enter the 6-digit code.</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase returns a self-contained data: SVG QR code */}
          <img src={phase.qr} alt="Authenticator QR code" width={192} height={192} className="rounded-lg border border-mm-line bg-white p-2" />
          <p>
            Can&rsquo;t scan? Enter this key instead: <code data-testid="mfa-secret">{phase.secret}</code>
          </p>
        </div>
      )}
      <MmField
        id="staff-mfa-code"
        label="6-digit code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        invalid={Boolean(error)}
        errorId="staff-mfa-error"
      />
      {error && <MmErrorPanel id="staff-mfa-error">{error}</MmErrorPanel>}
      <button type="submit" disabled={busy} className={mmAuthButton({ disabled: busy })}>
        {busy ? "Checking…" : "Verify"}
      </button>
    </form>
  );
}
