"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Printer, ShieldCheck } from "lucide-react";

import { Button, Modal } from "@/components/ui";

export interface PrintSignInCardDialogProps {
  open: boolean;
  onClose: () => void;
  childName: string;
  loginCode: string;
  yearLevel: number | null;
}

/**
 * Printable student sign-in card dialog (§3.1 of Parent Journey specification):
 *
 * "Children do not use an email address. Each one has a login code that never changes
 * and a 6-digit PIN you can reset at any time. They go to the same sign-in page you use
 * and choose 'I’m a student'."
 *
 * Designed to look clean on screen and format cleanly when printed via window.print().
 */
const noopSubscribe = () => () => {};

export function PrintSignInCardDialog({
  open,
  onClose,
  childName,
  loginCode,
  yearLevel,
}: PrintSignInCardDialogProps) {
  const printButtonRef = useRef<HTMLButtonElement>(null);
  /* The address the child actually types: this deployment's own sign-in page, never a hard-coded domain that a
     beta or preview family is not using. The server snapshot is null, so server and client markup agree. */
  const signInAddress = useSyncExternalStore(
    noopSubscribe,
    () => `${window.location.host}/sign-in`,
    () => null,
  );

  /* Print only the card. The class scopes the @media print rules in globals.css, so printing anywhere else in the
     app is unaffected; it is removed when the print dialog closes. */
  useEffect(() => {
    const root = document.documentElement;
    const clear = () => root.classList.remove("printing-signin-card");
    window.addEventListener("afterprint", clear);
    return () => {
      window.removeEventListener("afterprint", clear);
      clear();
    };
  }, []);

  if (!open) return null;

  function handlePrint() {
    document.documentElement.classList.add("printing-signin-card");
    window.print();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Student sign-in card"
      description="Keep this card handy or print it for your child to use whenever they practise."
      initialFocusRef={printButtonRef}
    >
      <div className="space-y-6">
        {/* Printable Card Area */}
        <div
          id="student-signin-card"
          className="relative overflow-hidden rounded-2xl border-2 border-royal/20 bg-gradient-to-br from-royal/5 via-white to-royal/10 p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-royal">
                MindMosaic Student Card
              </span>
              <h3 className="mt-0.5 text-xl font-black text-ink">{childName}</h3>
              {yearLevel !== null && (
                <p className="text-xs font-bold text-muted">Grade {yearLevel}</p>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal text-base font-black text-white shadow-sm">
              {childName.trim().charAt(0).toUpperCase() || "S"}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-royal/15 bg-white p-4 shadow-sm">
            <span className="text-xs font-bold text-muted">Login code</span>
            <div className="mt-1 font-mono text-2xl font-black tracking-widest text-royal">
              {loginCode}
            </div>
            <p className="mt-2 text-xs text-muted">
              Sign in at{" "}
              <strong className="text-ink" data-testid="signin-card-address">
                {signInAddress ?? "the MindMosaic sign-in page"}
              </strong>{" "}
              &rarr; choose &ldquo;I&rsquo;m a student&rdquo;, then enter this code and the PIN.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-muted">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-600" />
            <span>PIN is set by parent. Reset anytime in your Parent account.</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            ref={printButtonRef}
            type="button"
            variant="primary"
            onClick={handlePrint}
          >
            <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
            Print card
          </Button>
        </div>
      </div>
    </Modal>
  );
}
