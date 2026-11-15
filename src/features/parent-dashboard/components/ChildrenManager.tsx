"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { Button, ConfirmDialog, Input, Modal, Select } from "@/components/ui";
import { isValidPin } from "@/features/auth/student-alias";
import { PrintSignInCardDialog } from "./PrintSignInCardDialog";
import { Card, ChildInitial, SectionTitle, pButtonPrimary, pButtonQuiet, pButtonSecondary, pFocus } from "./parent-ui";

export interface ChildListItem {
  id: string;
  displayName: string;
  yearLevel: number | null;
  sessionCount: number;
  loginCode?: string;
  avatarColor?: string;
  /** Login paused. Results and the parent link are kept, and the child can be restored. */
  archived?: boolean;
}

interface UpdateChildResponse {
  readonly ok: boolean;
  readonly message?: string;
}

export interface ChildrenManagerProps {
  initialChildren: ChildListItem[];
  availableYearLevels: readonly number[];
  paidPlacesUsed?: number;
  totalPaidPlaces?: number;
  planName?: string;
}

/**
 * Children Manager (§3 of Parent Journey specification):
 *
 * Implements Artboards b11–b14 (Children, Children — tablet, Children — mobile, Children states):
 * - Displays paid places versus stored profiles (Decision P5: separate records from seats).
 * - Displays active children with login codes, status, and direct "Manage" and "Progress" links.
 * - Educational guidance on student sign-in with 6-digit PIN and non-changing login codes.
 * - Reversible pause (archive) lifecycle with clean restoration (Decision P6).
 */
export function ChildrenManager({
  initialChildren,
  availableYearLevels,
  paidPlacesUsed,
  totalPaidPlaces,
  planName,
}: ChildrenManagerProps) {
  const router = useRouter();
  const [children, setChildren] = useState(initialChildren);
  const [renameTarget, setRenameTarget] = useState<ChildListItem | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ChildListItem | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Print card state
  const [printTarget, setPrintTarget] = useState<ChildListItem | null>(null);

  const editingYear = renameTarget?.yearLevel ?? null;
  const yearOptions =
    editingYear !== null && !availableYearLevels.includes(editingYear)
      ? [...availableYearLevels, editingYear].sort((a, b) => a - b)
      : availableYearLevels;

  const [name, setName] = useState("");
  const [yearLevel, setYearLevel] = useState<string>("");
  const [pin, setPin] = useState("");

  function openRename(child: ChildListItem) {
    setRenameTarget(child);
    setName(child.displayName);
    setYearLevel(child.yearLevel === null ? "" : String(child.yearLevel));
    setPin("");
    setFormError(null);
  }

  function closeRename() {
    setRenameTarget(null);
    setFormError(null);
  }

  async function handleRenameSubmit(event: FormEvent) {
    event.preventDefault();
    if (!renameTarget) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("A name is required.");
      return;
    }
    if (pin.trim() && !isValidPin(pin.trim())) {
      setFormError("PIN must be exactly 6 digits.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    let result: UpdateChildResponse;
    try {
      const response = await fetch(`/api/parent/children/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: trimmedName,
          yearLevel: yearLevel === "" ? null : Number(yearLevel),
          pin: pin.trim() || undefined,
        }),
      });
      result = (await response.json().catch(() => null)) ?? { ok: false };
    } catch {
      result = { ok: false };
    }

    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message ?? "Could not update this child. Please try again.");
      return;
    }

    setChildren((current) =>
      current.map((child) =>
        child.id === renameTarget.id
          ? { ...child, displayName: trimmedName, yearLevel: yearLevel === "" ? null : Number(yearLevel) }
          : child,
      ),
    );
    setRenameTarget(null);
    router.refresh();
  }

  async function handleArchiveConfirm() {
    if (!archiveTarget) return;
    setSubmitting(true);

    let result: UpdateChildResponse;
    try {
      const response = await fetch(`/api/parent/children/${archiveTarget.id}`, { method: "DELETE" });
      result = (await response.json().catch(() => null)) ?? { ok: false };
    } catch {
      result = { ok: false };
    }

    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message ?? "Could not archive this child. Please try again.");
      return;
    }

    setChildren((current) =>
      current.map((child) => (child.id === archiveTarget.id ? { ...child, archived: true } : child)),
    );
    setArchiveTarget(null);
    router.refresh();
  }

  async function handleRestore(child: ChildListItem) {
    setRestoringId(child.id);

    let result: UpdateChildResponse;
    try {
      const response = await fetch(`/api/parent/children/${child.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      result = (await response.json().catch(() => null)) ?? { ok: false };
    } catch {
      result = { ok: false };
    }

    setRestoringId(null);

    if (!result.ok) {
      setFormError(result.message ?? "Could not restore this child. Please try again.");
      return;
    }

    setChildren((current) => current.map((item) => (item.id === child.id ? { ...item, archived: false } : item)));
    router.refresh();
  }

  const activeChildren = children.filter((child) => !child.archived);
  const archivedChildren = children.filter((child) => child.archived);
  /* Shown only when the page passed real plan figures; nothing is assumed about a plan the family may not have. */
  const places =
    paidPlacesUsed !== undefined && totalPaidPlaces !== undefined && planName
      ? { used: paidPlacesUsed, total: totalPaidPlaces, free: Math.max(0, totalPaidPlaces - paidPlacesUsed), planName }
      : null;

  return (
    <div className="grid gap-5">
      {formError && !renameTarget && (
        <p role="alert" className="rounded-xl bg-[#fdecec] px-4 py-3 text-sm font-medium text-[#b91c1c]">
          {formError}
        </p>
      )}

      {/* Paid places (artboard 11, decision P5): only when the page passed real plan figures. */}
      {places && (
        <Card as="section" aria-labelledby="paid-places-heading">
          <SectionTitle id="paid-places-heading">Paid places</SectionTitle>
          <p className="mt-2 text-[15px] leading-[1.6] text-mm-ink-soft">
            {places.used} of {places.total} used on your {places.planName}. A place is what lets a child sign in and
            practise. A profile is the record of who they are &mdash; you can keep more profiles than you have places.
          </p>
          <span aria-hidden="true" className="mt-4 block h-2 max-w-[340px] overflow-hidden rounded-full bg-mm-track">
            <span className="block h-full rounded-full bg-mm-brand" style={{ width: `${Math.min(100, (places.used / Math.max(1, places.total)) * 100)}%` }} />
          </span>
          <p className="mt-4 text-[13px] text-mm-muted">
            {places.free} {places.free === 1 ? "place" : "places"} free ·{" "}
            <Link href="/parent/account/billing" className="text-[15px] font-semibold text-mm-brand hover:underline">
              Change plan
            </Link>
          </p>
        </Card>
      )}

      <Card as="section" aria-labelledby="your-children-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle id="your-children-heading">Your children</SectionTitle>
          <Link href="/parent/setup" className={pButtonPrimary}>
            Add a child
          </Link>
        </div>

        <ul className="mt-5 divide-y divide-mm-line">
          {activeChildren.map((child, index) => (
            <li key={child.id} className="flex flex-wrap items-center justify-between gap-3 py-[18px] first:pt-0">
              <Link
                href={`/parent/children/${child.id}`}
                className={twMerge(
                  "flex min-w-0 items-center gap-3 rounded-2xl border border-mm-line bg-white px-[18px] py-3.5 hover:border-mm-brand/40",
                  pFocus,
                )}
              >
                <ChildInitial name={child.displayName} index={index} />
                <span className="min-w-0">
                  <span className="block truncate text-[17px] font-semibold text-mm-ink">{child.displayName}</span>
                  <span className="block text-[13.5px] text-mm-muted">
                    {child.yearLevel !== null ? `Year ${child.yearLevel}` : "Year not set"}
                    {child.loginCode ? (
                      <>
                        {" "}· signs in with <span className="font-mono tracking-wide">{child.loginCode}</span>
                      </>
                    ) : null}
                  </span>
                </span>
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#d9efec] px-2.5 py-1 text-[13px] font-semibold text-[#0b6b63]">Can sign in</span>
                <Link href={`/parent/children/${child.id}`} className={pButtonSecondary}>
                  Manage<span className="sr-only"> {child.displayName}</span>
                </Link>
                <Link href={`/parent/children/${child.id}/progress`} className={pButtonQuiet}>
                  Progress<span className="sr-only"> for {child.displayName}</span>
                </Link>
              </div>
            </li>
          ))}
          {activeChildren.length === 0 && (
            <li className="py-6 text-[15px] text-mm-ink-soft">
              {children.length === 0 ? "No children yet. Add one to create their sign-in." : "No active children. Restore one below."}
            </li>
          )}
        </ul>
        <p className="mt-2 border-t border-mm-line pt-5 text-sm text-mm-ink-soft">
          Archived profiles are kept and can be restored.{" "}
          <Link href="/parent/help" className="font-semibold text-mm-brand hover:underline">
            See what archiving does
          </Link>
          .
        </p>
      </Card>

      {archivedChildren.length > 0 && (
        <Card as="section" role="region" aria-label="Archived children" className="shadow-none">
          <SectionTitle>Archived children</SectionTitle>
          <p className="mt-1.5 text-sm text-mm-ink-soft">
            These children can&rsquo;t sign in. Their results are kept and you can restore them at any time.
          </p>
          <ul className="mt-4 divide-y divide-mm-line">
            {archivedChildren.map((child, index) => (
              <li key={child.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0">
                <span className="flex items-center gap-3">
                  <ChildInitial name={child.displayName} index={activeChildren.length + index} />
                  <span>
                    <span className="block text-[17px] font-semibold text-mm-ink">{child.displayName}</span>
                    <span className="block text-[13.5px] text-mm-muted">
                      {child.yearLevel !== null ? `Year ${child.yearLevel} · ` : ""}archived
                    </span>
                  </span>
                </span>
                <span className="flex flex-wrap gap-2">
                  <button type="button" className={pButtonQuiet} onClick={() => openRename(child)}>
                    Edit<span className="sr-only"> {child.displayName}</span>
                  </button>
                  <button
                    type="button"
                    className={pButtonSecondary}
                    onClick={() => handleRestore(child)}
                    disabled={restoringId === child.id}
                    aria-label={`Restore ${child.displayName}`}
                  >
                    {restoringId === child.id ? "Restoring…" : `Restore ${child.displayName}`}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card as="section" aria-labelledby="how-signin-heading">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,530px)]">
          <div>
            <SectionTitle id="how-signin-heading">How your children sign in</SectionTitle>
            <p className="mt-3 text-[15px] leading-[1.6] text-mm-ink-soft">
              Children do not use an email address. Each one has a <b className="font-semibold text-mm-ink">login code</b>{" "}
              that never changes and a <b className="font-semibold text-mm-ink">6-digit PIN</b> you can reset at any time.
              They go to the same sign-in page you use and choose &ldquo;I&rsquo;m a student&rdquo;.
            </p>
            {activeChildren.some((child) => child.loginCode) && (
              <div className="mt-4 flex flex-wrap gap-2.5">
                {activeChildren
                  .filter((child) => child.loginCode)
                  .map((child) => (
                    <button key={child.id} type="button" className={pButtonSecondary} onClick={() => setPrintTarget(child)}>
                      Print {child.displayName}&rsquo;s sign-in card
                    </button>
                  ))}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-mm-line bg-mm-tint-soft px-5 py-5">
            <p className="text-sm font-semibold text-mm-ink-soft">On a shared computer</p>
            <ul className="mt-2.5 grid gap-2.5 text-[15px] leading-[1.5] text-mm-ink-soft">
              {[
                "Each child signs out when they finish, so the next one does not land in their work.",
                "Your parent account and a child’s account cannot be open at the same time in one browser.",
                "A PIN is not a secret from you — you can always reset it.",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#0f6b32]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Modals & Dialogs */}
      {/* 1. Edit Child Dialog */}
      <Modal open={renameTarget !== null} onClose={closeRename} title="Edit child details">
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error">
              {formError}
            </p>
          )}

          <div>
            <label htmlFor="edit-name" className="block text-xs font-bold text-ink">
              Name
            </label>
            <Input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-year" className="block text-xs font-bold text-ink">
              Year level
            </label>
            <Select
              id="edit-year"
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="mt-1"
            >
              <option value="">No year level</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  Grade {year}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="edit-pin" className="block text-xs font-bold text-ink">
              Reset PIN
            </label>
            <Input
              id="edit-pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Leave blank to keep existing PIN"
              className="mt-1"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={closeRename} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Archive Confirmation Dialog */}
      <ConfirmDialog
        open={archiveTarget !== null}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={handleArchiveConfirm}
        title={`Pause ${archiveTarget?.displayName}’s profile?`}
        description="This child won't be able to sign in until you restore them. All papers, answers, and history are kept intact."
        confirmLabel="Yes, archive"
        cancelLabel="Keep active"
        isLoading={submitting}
      />

      {/* 3. Print Sign-in Card Dialog */}
      {printTarget?.loginCode && (
        <PrintSignInCardDialog
          open
          onClose={() => setPrintTarget(null)}
          childName={printTarget.displayName}
          loginCode={printTarget.loginCode}
          yearLevel={printTarget.yearLevel}
        />
      )}
    </div>
  );
}
