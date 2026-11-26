"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";

/** Shown on /dev/uat after "End UAT session": starting again is always an explicit, re-validated action. */
export function StartUatSessionPanel() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/uat/session", { method: "POST", credentials: "same-origin" });
      if (!res.ok) {
        setError(
          res.status === 403
            ? "You are not currently entitled to run a UAT session (admin sign-in with MFA, or an allowlisted tester, is required)."
            : "Could not start a UAT session.",
        );
        return;
      }
      // Full reload so the layout-level bootstrap re-checks the session and mounts the assistant.
      window.location.assign("/dev/uat");
    } catch {
      setError("Could not start a UAT session. Check your connection.");
    } finally {
      setBusy(false);
      router.refresh();
    }
  };

  return (
    <section
      aria-labelledby="uat-ended-title"
      data-testid="uat-session-ended-panel"
      className="rounded-2xl border border-mm-line bg-mm-surface p-6"
    >
      <h2 id="uat-ended-title" className="text-lg font-semibold tracking-[-0.02em] text-mm-ink">
        UAT session ended
      </h2>
      <p className="mt-1.5 max-w-xl text-sm leading-6 text-mm-muted">
        The UAT Assistant is off in this browser. Defects you saved earlier are still stored locally. Start a new
        session when you are ready to test again.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-error">
          {error}
        </p>
      )}
      <Button type="button" className="mt-4" data-testid="uat-start-session" isLoading={busy} loadingLabel="Starting…" onClick={() => void start()}>
        Start new UAT session
      </Button>
    </section>
  );
}
