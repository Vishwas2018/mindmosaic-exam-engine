"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  KeyRound,
  Lock,
  Pause,
  Play,
  Printer,
  ShieldAlert,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";

import { Badge, Button, Card, ConfirmDialog } from "@/components/ui";
import { PinResetDialog } from "./PinResetDialog";
import { PrintSignInCardDialog } from "./PrintSignInCardDialog";

export interface ChildProfileDetails {
  id: string;
  displayName: string;
  yearLevel: number | null;
  loginCode: string;
  avatarColor?: "purple" | "ember" | "teal" | "coral";
  archived?: boolean;
  finishedPapersCount: number;
  lastSignedIn?: string | null;
}

export interface SiblingLink {
  id: string;
  displayName: string;
  yearLevel: number | null;
}

export interface ChildProfileViewProps {
  child: ChildProfileDetails;
  siblings?: SiblingLink[];
  availableYearLevels: readonly number[];
  isLocalPreview?: boolean;
}

const AVATAR_COLORS = [
  { id: "purple", label: "Royal", bgClass: "bg-mm-brand/10 text-mm-brand border-mm-brand" },
  { id: "ember", label: "Amber", bgClass: "bg-amber-100 text-amber-800 border-amber-500" },
  { id: "teal", label: "Emerald", bgClass: "bg-emerald-100 text-emerald-800 border-emerald-500" },
  { id: "coral", label: "Violet", bgClass: "bg-violet-100 text-violet-800 border-violet-500" },
] as const;

export function ChildProfileView({
  child,
  siblings = [],
  availableYearLevels,
  isLocalPreview = false,
}: ChildProfileViewProps) {
  const router = useRouter();

  // Form state
  const [firstName, setFirstName] = useState(child.displayName);
  const [yearLevel, setYearLevel] = useState<string>(
    child.yearLevel !== null ? String(child.yearLevel) : "",
  );
  const [selectedColor, setSelectedColor] = useState<"purple" | "ember" | "teal" | "coral">(
    child.avatarColor || "purple",
  );
  const [isArchived, setIsArchived] = useState<boolean>(Boolean(child.archived));

  // Dialogs
  const [pinResetOpen, setPinResetOpen] = useState(false);
  const [printCardOpen, setPrintCardOpen] = useState(false);
  const [pauseConfirmOpen, setPauseConfirmOpen] = useState(false);
  const [deletionRequestOpen, setDeletionRequestOpen] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);

  // Status indicators
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initial = firstName.trim().charAt(0).toUpperCase() || "C";

  async function handleSaveChanges(e: FormEvent) {
    e.preventDefault();
    const trimmed = firstName.trim();
    if (!trimmed) {
      setErrorMessage("First name is required.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      if (!isLocalPreview) {
        const response = await fetch(`/api/parent/children/${child.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: trimmed,
            yearLevel: yearLevel === "" ? null : Number(yearLevel),
          }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || data?.ok === false) {
          setErrorMessage(data?.message || "Could not save changes. Please try again.");
          setSaving(false);
          return;
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      router.refresh();
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePause() {
    setSaving(true);
    const nextArchived = !isArchived;

    try {
      if (!isLocalPreview) {
        const response = await fetch(`/api/parent/children/${child.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived: nextArchived }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || data?.ok === false) {
          setErrorMessage(data?.message || "Could not update pause status.");
          setSaving(false);
          return;
        }
      }

      setIsArchived(nextArchived);
      setPauseConfirmOpen(false);
      router.refresh();
    } catch {
      setErrorMessage("Network error. Could not update pause status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header (artboard 12): eyebrow, name, one status line, breadcrumb. */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mm-brand">Children</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-[1.15] tracking-[-0.028em] text-mm-ink sm:text-4xl">
          {child.displayName}
        </h1>
        <p className="mt-2 text-base text-mm-ink-soft sm:text-lg">
          {yearLevel ? `Year ${yearLevel}` : "No year level"} · {isArchived ? "paused" : "can sign in"} ·{" "}
          {child.finishedPapersCount} {child.finishedPapersCount === 1 ? "finished paper" : "finished papers"}
        </p>
        <nav aria-label="Breadcrumb" className="mt-2 flex items-center gap-1.5 text-sm text-mm-ink-soft">
          <Link href="/parent/children" className="inline-flex min-h-11 items-center hover:text-mm-brand hover:underline">
            Children
          </Link>
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          <span aria-current="page">{child.displayName.split(" ")[0]}</span>
        </nav>
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-error/20 bg-error/5 p-4 text-xs font-semibold text-error">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-900">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>Changes saved successfully.</span>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {/* Left: Details */}
        <div className="space-y-8">
          {/* Card 1: Details */}
          <Card className="p-6">
            <h2 className="font-[family-name:var(--font-display)] tracking-[-0.02em] text-xl font-semibold text-mm-ink">Details</h2>
            <form onSubmit={handleSaveChanges} className="mt-6 space-y-6">
              <div>
                <label htmlFor="child-firstname" className="block text-xs font-semibold text-mm-ink">
                  First name
                </label>
                <input
                  id="child-firstname"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-mm-brand/20 bg-white px-4 py-2.5 text-sm font-semibold text-mm-ink placeholder:text-mm-ink-soft focus:border-mm-brand focus:outline-none focus:ring-4 focus:ring-mm-brand/20"
                />
                <p className="mt-1.5 text-xs text-mm-ink-soft">
                  This is what {firstName || "your child"} sees when they sign in. It is never shown outside your family.
                </p>
              </div>

              <div>
                <label htmlFor="child-yearlevel" className="block text-xs font-semibold text-mm-ink">
                  Year level
                </label>
                <select
                  id="child-yearlevel"
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-mm-brand/20 bg-white px-4 py-2.5 text-sm font-semibold text-mm-ink focus:border-mm-brand focus:outline-none focus:ring-4 focus:ring-mm-brand/20"
                >
                  <option value="">No year level selected</option>
                  {availableYearLevels.map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-mm-ink-soft">
                  Changing the year changes what practice is offered. Past results keep the year they were sat at.
                </p>
              </div>

              {/* Avatar Colour Picker */}
              <fieldset>
                <legend className="text-xs font-semibold text-mm-ink">Avatar</legend>
                <p className="mt-1 text-xs text-mm-ink-soft">
                  Initials in a colour. Photo upload is intentionally not offered to protect children&rsquo;s privacy.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  {AVATAR_COLORS.map((col) => {
                    const isSelected = selectedColor === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        aria-label={`Avatar colour: ${col.label}`}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedColor(col.id)}
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl text-base font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/20 ${
                          col.bgClass
                        } ${
                          isSelected
                            ? "scale-105 border-2 shadow-sm ring-2 ring-mm-brand/30"
                            : "border opacity-70 hover:opacity-100"
                        }`}
                      >
                        {initial}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setFirstName(child.displayName);
                    setYearLevel(child.yearLevel !== null ? String(child.yearLevel) : "");
                    setSelectedColor(child.avatarColor || "purple");
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-[11px] text-mm-ink-soft">
                Nothing is saved until you press Save and we confirm it.
              </p>
            </form>
          </Card>

        </div>

        {/* Right: Student access, pausing, deletion request */}
        <div className="space-y-8">
          {/* Card 2: Student Access */}
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-mm-brand" />
              <h2 className="font-[family-name:var(--font-display)] tracking-[-0.02em] text-xl font-semibold text-mm-ink">Student access</h2>
            </div>

            <dl className="mt-6 divide-y divide-mm-brand/10 text-sm">
              <div className="flex items-center justify-between py-3">
                <dt className="font-semibold text-mm-ink-soft">Login code</dt>
                <dd className="font-mono text-base font-semibold tracking-widest text-mm-brand">
                  {child.loginCode}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="font-semibold text-mm-ink-soft">PIN</dt>
                <dd className="font-semibold text-mm-ink">Set · 6 digits</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="font-semibold text-mm-ink-soft">Last signed in</dt>
                <dd className="font-semibold text-mm-ink-soft">
                  {child.lastSignedIn || "Never recorded"}
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-xs text-mm-ink-soft">
              The login code never changes. The PIN is the only thing you can reset. Any new sign-in will require this new PIN.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPinResetOpen(true)}
              >
                <KeyRound className="mr-1.5 h-4 w-4" />
                Reset PIN
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPrintCardOpen(true)}
              >
                <Printer className="mr-1.5 h-4 w-4" />
                Print sign-in card
              </Button>
            </div>
          </Card>

          {/* Card 3: Pausing (Archive) */}
          <Card className="border-mm-brand/15 bg-mm-tint-soft/40 p-6">
            <div className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-mm-brand" />
              <h2 className="font-[family-name:var(--font-display)] tracking-[-0.02em] text-xl font-semibold text-mm-ink">
                {isArchived ? "Resume this profile" : "Pause this profile"}
              </h2>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-mm-ink/80">
              Pausing stops {firstName} signing in. Everything is kept — the profile, all{" "}
              {child.finishedPapersCount} papers, every answer — and you can restore it whenever you like.
              It does not change your plan or what you pay.
            </p>

            <div className="mt-4 rounded-xl border border-mm-brand/10 bg-white p-3.5 text-xs text-mm-ink-soft">
              <strong className="font-semibold text-mm-ink">Shared family access:</strong> If another parent
              is linked to {firstName}, pausing applies for them too, and either guardian can undo it.
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant={isArchived ? "primary" : "secondary"}
                onClick={() => setPauseConfirmOpen(true)}
                disabled={saving}
              >
                {isArchived ? (
                  <>
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Let {firstName} back in
                  </>
                ) : (
                  <>
                    <Archive className="mr-2 h-4 w-4" />
                    Pause {firstName}
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Card 4: Deleting a profile (Proposal ADR-012, Decision P11) */}
          <details className="group rounded-3xl border border-mm-line bg-white px-5 py-4 sm:px-[26px]"><summary className="flex min-h-11 cursor-pointer list-none items-center text-[15px] font-semibold text-mm-brand hover:underline">Deleting a profile</summary><div className="pt-2">
            <div className="flex items-center gap-2 text-error">
              <ShieldAlert className="h-5 w-5" />
              <h2 className="font-[family-name:var(--font-display)] tracking-[-0.02em] text-xl font-semibold">Deleting a profile</h2>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-error/90">
              <strong className="block font-semibold">Delete {firstName}&rsquo;s profile and everything in it</strong>
              This asks us to erase {child.displayName}’s profile, their {child.finishedPapersCount} papers and every answer.
              It cannot be undone once carried out.
            </p>

            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-error/80">
              <li>We confirm your identity away from this screen.</li>
              <li>You have time to stop the request before erasure begins.</li>
              <li>You receive a message when the erasure has been completed.</li>
            </ul>

            {deletionRequested ? (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-semibold text-amber-950">
                <strong className="block font-semibold text-amber-900">Deletion requested.</strong>
                Check your email to confirm your identity. We will verify your request before anything is erased, and you can stop it at any point until then.
              </div>
            ) : (
              <div className="mt-6 flex items-center gap-3">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setDeletionRequestOpen(true)}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Request deletion
                </Button>
                <span className="text-[11px] font-medium text-mm-ink-soft">
                  Pausing instead keeps everything and is undone in one press.
                </span>
              </div>
            )}
          </div></details>
        </div>
      </div>

      {/* Dialogs */}
      <PinResetDialog
        open={pinResetOpen}
        onClose={() => setPinResetOpen(false)}
        childId={child.id}
        childName={firstName}
      />

      <PrintSignInCardDialog
        open={printCardOpen}
        onClose={() => setPrintCardOpen(false)}
        childName={firstName}
        loginCode={child.loginCode}
        yearLevel={child.yearLevel}
      />

      {/* Pause Confirmation Dialog */}
      <ConfirmDialog
        open={pauseConfirmOpen}
        onCancel={() => setPauseConfirmOpen(false)}
        onConfirm={handleTogglePause}
        title={isArchived ? `Let ${firstName} back in?` : `Pause ${firstName}’s profile?`}
        description={
          isArchived
            ? `${firstName} will be able to sign in and practise again using the same login code, same PIN, and same saved work.`
            : `Pausing stops ${firstName} signing in. Her profile, papers and all answers are completely kept. You can restore access at any time.`
        }
        confirmLabel={isArchived ? "Restore profile" : "Pause profile"}
        cancelLabel="Keep as is"
      />

      {/* Deletion Request Confirmation Dialog */}
      <ConfirmDialog
        open={deletionRequestOpen}
        onCancel={() => setDeletionRequestOpen(false)}
        onConfirm={() => {
          setDeletionRequested(true);
          setDeletionRequestOpen(false);
        }}
        title={`Request deletion for ${firstName}?`}
        description={`This begins the out-of-band erasure process. We will send a confirmation link to your verified parent email. Pausing is completely reversible; deletion permanently erases all records once confirmed and processed.`}
        confirmLabel="Confirm deletion request"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
