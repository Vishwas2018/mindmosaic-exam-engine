"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Archive as ArchiveIcon, Trash2, UserRound } from "lucide-react";

import { Badge, Button, Card, ConfirmDialog, Input, Modal, Select } from "@/components/ui";
import { isValidPin } from "@/features/auth/student-alias";

export interface ChildListItem {
  id: string;
  displayName: string;
  yearLevel: number | null;
  sessionCount: number;
  /** True once the parent has asked for this child's data to be deleted. */
  erasureScheduled?: boolean;
}

interface UpdateChildResponse {
  readonly ok: boolean;
  readonly message?: string;
}

/**
 * Screen 16: list every linked child with a session count, and let a parent
 * rename, change year level / reset PIN, or archive (unlink) one. Both
 * mutations go through /api/parent/children/[childId] rather than any
 * direct Supabase write — a parent has no update policy on a child's
 * profiles row (see supabase/migrations/20260718090000: "profiles: update
 * own row" only lets id === auth.uid()), so the route does the write with
 * the service-role client after confirming the parent_children link, the
 * same pattern already used by provisionChild for creating one.
 *
 * "Archive" removes the parent_children link rather than deleting the
 * child's account or history — reversible in principle, and it keeps this
 * batch schema-free (no archived-flag migration required).
 *
 * "Delete my child's data" is the real erasure: it calls
 * POST /api/parent/children/[childId]/erase, which schedules
 * public.parent_request_child_erasure (sign-in revoked immediately, data
 * removed by the erasure processor after the 30-day window).
 */
export function ChildrenManager({
  initialChildren,
  availableYearLevels,
}: {
  initialChildren: ChildListItem[];
  /* From yearLevelsWithGatedCoverage() — see AddChildCard for why. */
  availableYearLevels: readonly number[];
}) {
  const router = useRouter();
  const [children, setChildren] = useState(initialChildren);
  const [renameTarget, setRenameTarget] = useState<ChildListItem | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ChildListItem | null>(null);
  const [eraseTarget, setEraseTarget] = useState<ChildListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /*
   * A child already recorded at a year that has since stopped being
   * offered must still be editable without silently changing their year,
   * so an existing value is kept in the list even when coverage has moved.
   */
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

    setChildren((current) => current.filter((child) => child.id !== archiveTarget.id));
    setArchiveTarget(null);
    router.refresh();
  }

  async function handleEraseConfirm() {
    if (!eraseTarget) return;
    setSubmitting(true);
    setFormError(null);

    let result: UpdateChildResponse;
    try {
      const response = await fetch(`/api/parent/children/${eraseTarget.id}/erase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      result = (await response.json().catch(() => null)) ?? { ok: false };
    } catch {
      result = { ok: false };
    }

    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message ?? "Could not schedule deletion. Please try again.");
      setEraseTarget(null);
      return;
    }

    const erasedId = eraseTarget.id;
    setChildren((current) =>
      current.map((child) => (child.id === erasedId ? { ...child, erasureScheduled: true } : child)),
    );
    setEraseTarget(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {formError && !renameTarget && (
        <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error">
          {formError}
        </p>
      )}

      {children.map((child) => (
        <Card key={child.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-royal/10 text-royal"
            >
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-extrabold text-ink">{child.displayName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {child.yearLevel !== null && <Badge variant="purple">Grade {child.yearLevel}</Badge>}
                <Badge variant="neutral">
                  {child.sessionCount} {child.sessionCount === 1 ? "session" : "sessions"}
                </Badge>
                {child.erasureScheduled && <Badge variant="neutral">Deletion scheduled</Badge>}
              </div>
              {child.erasureScheduled && (
                <p className="mt-2 max-w-md text-sm font-semibold text-muted">
                  Sign-in is switched off. Their data will be permanently deleted within 30 days.
                  Email hello@mindmosaic.app to cancel.
                </p>
              )}
            </div>
          </div>
          {!child.erasureScheduled && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => openRename(child)}>
                <Pencil aria-hidden="true" className="h-4 w-4" />
                Edit
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setArchiveTarget(child)}>
                <ArchiveIcon aria-hidden="true" className="h-4 w-4" />
                Archive
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEraseTarget(child)}>
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Delete my child&apos;s data
              </Button>
            </div>
          )}
        </Card>
      ))}

      {children.length === 0 && (
        <Card className="p-6">
          <p className="text-sm font-semibold text-muted">No linked children yet.</p>
        </Card>
      )}

      <Modal
        open={renameTarget !== null}
        onClose={closeRename}
        title={renameTarget ? `Edit ${renameTarget.displayName}` : "Edit child"}
        description="Update their name, year level, or reset their PIN."
      >
        <form onSubmit={handleRenameSubmit} className="flex flex-col gap-4">
          {formError && (
            <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error">
              {formError}
            </p>
          )}
          <Input
            id="edit-child-name"
            label="Name"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <Select
            id="edit-child-year"
            label="Year level"
            value={yearLevel}
            onChange={(e) => setYearLevel(e.currentTarget.value)}
          >
            <option value="">Not sure yet</option>
            {yearOptions.map((year) => (
              <option key={year} value={String(year)}>
                Year {year}
              </option>
            ))}
          </Select>
          <Input
            id="edit-child-pin"
            label="Reset PIN (optional)"
            inputMode="numeric"
            autoComplete="off"
            hint="6 digits. Leave blank to keep their current PIN."
            value={pin}
            onChange={(e) => setPin(e.currentTarget.value)}
          />
          <div className="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={closeRename} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} loadingLabel="Saving">
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={archiveTarget !== null}
        title={archiveTarget ? `Archive ${archiveTarget.displayName}?` : "Archive child?"}
        description="They'll no longer appear on your dashboard. This does not delete their account or practice history — contact support to relink them later."
        confirmLabel="Yes, archive"
        variant="danger"
        isLoading={submitting}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveTarget(null)}
      />

      <ConfirmDialog
        open={eraseTarget !== null}
        title={eraseTarget ? `Delete all of ${eraseTarget.displayName}'s data?` : "Delete child's data?"}
        description="This permanently deletes their profile, every practice session, result and writing attempt, and their sign-in. Their sign-in stops working straight away, and the deletion is carried out within 30 days. It cannot be undone once complete."
        confirmLabel="Yes, delete everything"
        variant="danger"
        isLoading={submitting}
        onConfirm={handleEraseConfirm}
        onCancel={() => setEraseTarget(null)}
      />
    </div>
  );
}
