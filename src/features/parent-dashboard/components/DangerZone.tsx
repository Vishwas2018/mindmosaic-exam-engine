"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, TriangleAlert } from "lucide-react";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, buttonClasses } from "@/components/ui";
import { useAuth } from "@/features/auth";

const SUPPORT_EMAIL = "hello@mindmosaic.app";

/**
 * Account-level actions that are hard to undo or that switch things off.
 *
 *  - Pause all children: reversible, self-service (POST /api/parent/children/pause).
 *  - Cancel subscription: stays on /billing, which owns the Stripe flow.
 *  - Delete account: a VERIFIED REQUEST to support, not a button that deletes.
 *    ADR-012 §4 decides that erasure of children's data is admin-processed
 *    after out-of-band guardian verification, with a 30-day window in which it
 *    can still be cancelled. A self-service delete here would bypass that.
 */
export function DangerZone({
  childCount,
  pausedCount,
}: {
  childCount: number;
  pausedCount: number;
}) {
  const router = useRouter();
  const { user, displayName } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const allPaused = childCount > 0 && pausedCount === childCount;

  async function setPaused(paused: boolean) {
    setBusy(true);
    setNotice(null);
    let ok = false;
    let message: string | undefined;
    try {
      const response = await fetch("/api/parent/children/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      ok = Boolean(body?.ok);
      message = body?.message;
    } catch {
      ok = false;
    }
    setBusy(false);
    setConfirming(false);
    if (!ok) {
      setNotice({ ok: false, text: message ?? "Something went wrong. Please try again." });
      return;
    }
    setNotice({
      ok: true,
      text: paused
        ? "All children are paused. They can't sign in until you resume."
        : "All children can sign in again.",
    });
    router.refresh();
  }

  const subject = encodeURIComponent("Account deletion request");
  const body = encodeURIComponent(
    `Hello,\n\nI'd like to request deletion of my MindMosaic parent account and my children's data.\n\nAccount email: ${user?.email ?? ""}\nName: ${displayName ?? ""}\n\nThank you.`,
  );

  return (
    <Card className="border-error/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-error">
          <TriangleAlert aria-hidden="true" className="h-5 w-5" />
          Danger zone
        </CardTitle>
        <CardDescription>Pause access, cancel your plan, or ask us to delete your account.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-line">
        <section className="flex flex-col gap-3 pb-5">
          <h3 className="text-base font-extrabold text-ink">
            {allPaused ? "Resume all children" : "Pause all children"}
          </h3>
          <p className="text-sm text-muted">
            {childCount === 0
              ? "You haven't added any children yet."
              : allPaused
                ? "Every child is paused and can't sign in. Their results are kept."
                : "Stops every child signing in until you resume. Nothing is deleted, and your plan and results are untouched."}
          </p>
          {notice && (
            <p
              role={notice.ok ? "status" : "alert"}
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                notice.ok ? "bg-success/10 text-ink" : "bg-error/10 text-error"
              }`}
            >
              {notice.text}
            </p>
          )}
          {childCount > 0 &&
            (allPaused ? (
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void setPaused(false)}
                className="sm:self-start"
              >
                {busy && <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />}
                Resume all children
              </Button>
            ) : confirming ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-ink">Pause {childCount === 1 ? "your child" : `all ${childCount} children`}?</span>
                <Button type="button" variant="primary" size="sm" disabled={busy} onClick={() => void setPaused(true)}>
                  {busy && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
                  Yes, pause
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button type="button" variant="secondary" onClick={() => setConfirming(true)} className="sm:self-start">
                Pause all children
              </Button>
            ))}
        </section>

        <section className="flex flex-col gap-3 py-5">
          <h3 className="text-base font-extrabold text-ink">Cancel subscription</h3>
          <p className="text-sm text-muted">
            Cancelling keeps access until the end of the period you&apos;ve paid for. You can resume
            before then.
          </p>
          <Link href="/billing" className={buttonClasses({ variant: "secondary", className: "sm:self-start" })}>
            Manage plan &amp; billing
          </Link>
        </section>

        <section className="flex flex-col gap-3 pt-5">
          <h3 className="text-base font-extrabold text-error">Delete account</h3>
          <p className="text-sm text-muted">
            Deleting your account and your children&apos;s data is permanent, so we verify the request
            with you first. Email us from your account address; once verified, nothing is removed for
            30 days, and you can cancel the request any time in that window. Cancel your
            subscription first so you aren&apos;t billed again.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}
            className={buttonClasses({ variant: "secondary", className: "border-error/40 text-error sm:self-start" })}
          >
            Request account deletion
          </a>
        </section>
      </CardContent>
    </Card>
  );
}
