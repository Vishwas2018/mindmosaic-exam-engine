"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive as ArchiveIcon,
  ArchiveRestore,
  ExternalLink,
  Pencil,
  Plus,
  Printer,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button, Card, ConfirmDialog, Input, Modal, Select } from "@/components/ui";
import { isValidPin } from "@/features/auth/student-alias";
import { PrintSignInCardDialog } from "./PrintSignInCardDialog";

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
  paidPlacesUsed = 2,
  totalPaidPlaces = 3,
  planName = "Family plan",
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
  const freePlaces = Math.max(0, totalPaidPlaces - paidPlacesUsed);

  return (
    <div className="space-y-8">
      {formError && !renameTarget && (
        <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error">
          {formError}
        </p>
      )}

      {/* 1. Paid Places Section (Artboards b11–b13, Decision P5) */}
      <section aria-labelledby="paid-places-heading" className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm">
        <h2 id="paid-places-heading" className="text-xs font-black uppercase tracking-wider text-royal">
          Paid places
        </h2>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="text-2xl font-black text-ink">
            {paidPlacesUsed} of {totalPaidPlaces} used on your {planName}.
          </p>
          <div className="text-xs font-bold text-muted">
            {freePlaces} {freePlaces === 1 ? "place" : "places"} free ·{" "}
            <Link href="/parent/account" className="text-royal underline hover:text-royal/80">
              Change plan
            </Link>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          A place is what lets a child sign in and practise. A profile is the record of who they are — you can keep more profiles than you have places.
        </p>
      </section>

      {/* 2. Your Children List */}
      <section aria-labelledby="your-children-heading" className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-royal/10 pb-4">
          <div>
            <h2 id="your-children-heading" className="text-xl font-black text-ink">
              Your children
            </h2>
            <p className="text-xs text-muted">Profiles and login credentials</p>
          </div>
          <a
            href="#add-child"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-royal px-4 text-xs font-bold text-white shadow-sm transition hover:bg-royal/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <Plus className="h-4 w-4" />
            Add a child
          </a>
        </div>

        <div className="mt-6 divide-y divide-royal/10">
          {activeChildren.map((child) => {
            const initial = child.displayName.trim().charAt(0).toUpperCase() || "C";
            return (
              <div
                key={child.id}
                className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between rounded-3xl"
              >
                <div className="flex items-center gap-4">
                  <div
                    aria-hidden="true"
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-royal/10 text-lg font-black text-royal shadow-sm"
                  >
                    {initial}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/parent/children/${child.id}`}
                        className="text-base font-black text-ink hover:text-royal hover:underline"
                      >
                        {child.displayName}
                      </Link>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Can sign in
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {child.yearLevel !== null && (
                        <span className="inline-flex items-center rounded-full bg-royal/10 px-2.5 py-0.5 text-xs font-bold text-royal">
                          Grade {child.yearLevel}
                        </span>
                      )}
                      <span className="inline-flex items-center rounded-full bg-canvas px-2.5 py-0.5 text-xs font-bold text-muted">
                        {child.sessionCount} {child.sessionCount === 1 ? "session" : "sessions"}
                      </span>
                      {child.loginCode && (
                        <span className="text-xs text-muted">
                          · signs in with{" "}
                          <span className="font-mono font-bold tracking-wider text-royal">
                            {child.loginCode}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/parent/children/${child.id}`}
                    className="inline-flex min-h-9 items-center justify-center rounded-full border border-royal/20 bg-white px-3.5 text-xs font-bold text-ink shadow-sm transition hover:border-royal hover:bg-royal/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
                  >
                    Manage
                  </Link>
                  <Link
                    href={`/parent/children/${child.id}/progress`}
                    className="inline-flex min-h-9 items-center justify-center rounded-full border border-royal/10 bg-canvas px-3.5 text-xs font-bold text-ink transition hover:bg-royal/10 hover:text-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
                  >
                    Progress
                  </Link>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openRename(child)}
                  >
                    <Pencil aria-hidden="true" className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setArchiveTarget(child)}
                  >
                    <ArchiveIcon aria-hidden="true" className="h-3.5 w-3.5 mr-1" />
                    Archive
                  </Button>
                </div>
              </div>
            );
          })}

          {activeChildren.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-muted">
                {children.length === 0
                  ? "No linked children yet."
                  : "No active children. Restore an archived child below."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Archived Profiles (Reversible Pause, Decision P6) */}
      {archivedChildren.length > 0 && (
        <section
          aria-labelledby="archived-children-heading"
          role="region"
          aria-label="Archived children"
          className="rounded-2xl border border-royal/10 bg-canvas/40 p-6"
        >
          <div>
            <h2 id="archived-children-heading" className="text-lg font-black text-ink">
              Archived children
            </h2>
            <p className="mt-1 text-xs text-muted">
              These children can&apos;t sign in. Their results are kept and you can restore them at any time.
            </p>
          </div>

          <div className="mt-4 divide-y divide-royal/10">
            {archivedChildren.map((child) => (
              <div
                key={child.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-ink">{child.displayName}</span>
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Archived
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {child.yearLevel !== null && (
                      <span className="inline-flex items-center rounded-full bg-royal/10 px-2 py-0.5 text-xs font-bold text-royal">
                        Grade {child.yearLevel}
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-canvas px-2 py-0.5 text-xs font-bold text-muted">
                      {child.sessionCount} {child.sessionCount === 1 ? "session" : "sessions"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openRename(child)}
                  >
                    <Pencil aria-hidden="true" className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRestore(child)}
                    disabled={restoringId === child.id}
                    aria-label={`Restore ${child.displayName}`}
                  >
                    <ArchiveRestore aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                    {restoringId === child.id ? "Restoring..." : `Restore ${child.displayName}`}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. How Your Children Sign In (Educational panel) */}
      <section
        aria-labelledby="how-signin-heading"
        className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-royal" />
          <h2 id="how-signin-heading" className="text-xl font-black text-ink">
            How your children sign in
          </h2>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          Children do not use an email address. Each one has a login code that never changes and a 6-digit PIN you can reset at any time. They go to the same sign-in page you use and choose &ldquo;I&rsquo;m a student&rdquo;.
        </p>

        {activeChildren.length > 0 && (
          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPrintTarget(activeChildren[0])}
            >
              <Printer className="mr-1.5 h-4 w-4" />
              Print sign-in card
            </Button>
          </div>
        )}

        {/* Shared Computer Tip */}
        <div className="mt-6 rounded-xl border border-royal/10 bg-royal/5 p-4 text-xs text-ink">
          <strong className="block font-bold text-royal">On a shared computer:</strong>
          <p className="mt-1 text-muted">
            Each child signs out when they finish, so the next one does not land in their work. Your parent account and a child&rsquo;s account cannot be open at the same time in one browser. A PIN is not a secret from you — you can always reset it.
          </p>
        </div>
      </section>

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
      {printTarget && (
        <PrintSignInCardDialog
          open={printTarget !== null}
          onClose={() => setPrintTarget(null)}
          childName={printTarget.displayName}
          loginCode={printTarget.loginCode || "CODE-SET"}
          yearLevel={printTarget.yearLevel}
        />
      )}
    </div>
  );
}
