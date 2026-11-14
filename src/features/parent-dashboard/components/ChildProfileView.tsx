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
  { id: "purple", label: "Royal", bgClass: "bg-royal/10 text-royal border-royal" },
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
      {/* Breadcrumb & Title */}
      <div>
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted">
          <Link
            href="/parent/children"
            className="inline-flex items-center gap-1 hover:text-royal hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            Children
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ink">{firstName}</span>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
              {firstName}
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              {yearLevel ? `Year ${yearLevel}` : "No year level"} ·{" "}
              {isArchived ? (
                <span className="text-amber-800">Paused</span>
              ) : (
                <span className="text-emerald-700">Can sign in</span>
              )}{" "}
              · {child.finishedPapersCount} {child.finishedPapersCount === 1 ? "finished paper" : "finished papers"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPrintCardOpen(true)}
            >
              <Printer className="mr-1.5 h-4 w-4" />
              Sign-in card
            </Button>
            <Link
              href={`/parent/children/${child.id}/progress`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-royal/20 bg-white px-4 text-xs font-bold text-ink shadow-sm transition hover:border-royal hover:bg-royal/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
            >
              Practice progress &rarr;
            </Link>
          </div>
        </div>

        {/* Sibling Switcher Tabs */}
        {siblings.length > 1 && (
          <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-royal/10 pb-4">
            <span className="text-xs font-bold text-muted">Your children:</span>
            {siblings.map((sibling) => {
              const isCurrent = sibling.id === child.id;
              return (
                <Link
                  key={sibling.id}
                  href={`/parent/children/${sibling.id}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                    isCurrent
                      ? "bg-royal text-white shadow-sm"
                      : "border border-royal/10 bg-white text-ink hover:border-royal/30 hover:bg-royal/5"
                  }`}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-black">
                    {sibling.displayName.trim().charAt(0).toUpperCase() || "C"}
                  </span>
                  <span>{sibling.displayName}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-error/20 bg-error/5 p-4 text-xs font-semibold text-error">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-900">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>Changes saved successfully.</span>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column: Details & Student Access */}
        <div className="space-y-8">
          {/* Card 1: Details */}
          <Card className="p-6">
            <h2 className="text-xl font-black text-ink">Details</h2>
            <form onSubmit={handleSaveChanges} className="mt-6 space-y-6">
              <div>
                <label htmlFor="child-firstname" className="block text-xs font-bold text-ink">
                  First name
                </label>
                <input
                  id="child-firstname"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-royal/20 bg-white px-4 py-2.5 text-sm font-semibold text-ink placeholder:text-muted focus:border-royal focus:outline-none focus:ring-4 focus:ring-royal/20"
                />
                <p className="mt-1.5 text-xs text-muted">
                  This is what {firstName || "your child"} sees when they sign in. It is never shown outside your family.
                </p>
              </div>

              <div>
                <label htmlFor="child-yearlevel" className="block text-xs font-bold text-ink">
                  Year level
                </label>
                <select
                  id="child-yearlevel"
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-royal/20 bg-white px-4 py-2.5 text-sm font-semibold text-ink focus:border-royal focus:outline-none focus:ring-4 focus:ring-royal/20"
                >
                  <option value="">No year level selected</option>
                  {availableYearLevels.map((year) => (
                    <option key={year} value={year}>
                      Grade {year}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-muted">
                  Changing the year changes what practice is offered. Past results keep the year they were sat at.
                </p>
              </div>

              {/* Avatar Colour Picker */}
              <fieldset>
                <legend className="text-xs font-bold text-ink">Avatar</legend>
                <p className="mt-1 text-xs text-muted">
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
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl text-base font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                          col.bgClass
                        } ${
                          isSelected
                            ? "scale-105 border-2 shadow-sm ring-2 ring-royal/30"
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
              <p className="text-[11px] text-muted">
                Nothing is saved until you press Save and we confirm it.
              </p>
            </form>
          </Card>

          {/* Card 2: Student Access */}
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-royal" />
              <h2 className="text-xl font-black text-ink">Student access</h2>
            </div>

            <dl className="mt-6 divide-y divide-royal/10 text-sm">
              <div className="flex items-center justify-between py-3">
                <dt className="font-bold text-muted">Login code</dt>
                <dd className="font-mono text-base font-black tracking-widest text-royal">
                  {child.loginCode}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="font-bold text-muted">PIN</dt>
                <dd className="font-semibold text-ink">Set · 6 digits</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="font-bold text-muted">Last signed in</dt>
                <dd className="font-semibold text-muted">
                  {child.lastSignedIn || "Never recorded"}
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-xs text-muted">
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
        </div>

        {/* Right Column: Pausing & Deletion Proposal */}
        <div className="space-y-8">
          {/* Card 3: Pausing (Archive) */}
          <Card className="border-royal/15 bg-canvas/40 p-6">
            <div className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-royal" />
              <h2 className="text-xl font-black text-ink">
                {isArchived ? "Resume this profile" : "Pause this profile"}
              </h2>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-ink/80">
              Pausing stops {firstName} signing in. Everything is kept — the profile, all{" "}
              {child.finishedPapersCount} papers, every answer — and you can restore it whenever you like.
              It does not change your plan or what you pay.
            </p>

            <div className="mt-4 rounded-xl border border-royal/10 bg-white p-3.5 text-xs text-muted">
              <strong className="font-bold text-ink">Shared family access:</strong> If another parent
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
          <Card className="border-error/20 bg-error/5 p-6">
            <div className="flex items-center gap-2 text-error">
              <ShieldAlert className="h-5 w-5" />
              <h2 className="text-xl font-black">Deleting a profile</h2>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-error/90">
              <strong className="block font-bold">Delete {firstName}&rsquo;s profile and everything in it</strong>
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
                <strong className="block font-bold text-amber-900">Deletion requested.</strong>
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
                <span className="text-[11px] font-medium text-muted">
                  Pausing instead keeps everything and is undone in one press.
                </span>
              </div>
            )}
          </Card>
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
