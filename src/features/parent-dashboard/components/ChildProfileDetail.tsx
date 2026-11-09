"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  PauseCircle,
  PlayCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  LineChart,
  PenTool,
} from "lucide-react";
import { type PreviewChild } from "../fixtures";

export interface ChildProfileDetailProps {
  child: PreviewChild;
}

export function ChildProfileDetail({ child: initialChild }: ChildProfileDetailProps) {
  const [child, setChild] = useState<PreviewChild>(initialChild);
  const [firstName, setFirstName] = useState(child.firstName);
  const [lastName, setLastName] = useState(child.lastName || "");
  const [yearLevel, setYearLevel] = useState(String(child.yearLevel));
  const [curriculum, setCurriculum] = useState(child.curriculum);
  const [avatarColor, setAvatarColor] = useState(child.avatarColor);
  const [savedBanner, setSavedBanner] = useState(false);

  // PIN Reset Modal / State (b12-1)
  const [pinState, setPinState] = useState<"idle" | "confirm" | "revealed" | "error">("idle");
  const [newPin, setNewPin] = useState("4 8 2 9 0 1");

  // Deletion Request Note Modal / State
  const [deletionRequested, setDeletionRequested] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setChild((prev) => ({
      ...prev,
      firstName,
      lastName,
      yearLevel: Number(yearLevel),
      curriculum,
      avatarColor,
    }));
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 4000);
  };

  const handleTogglePause = () => {
    setChild((prev) => ({
      ...prev,
      status: prev.status === "active" ? "paused" : "active",
    }));
  };

  const handleConfirmResetPin = () => {
    // Generate simulated 6-digit PIN
    setNewPin("4 8 2 9 0 1");
    setPinState("revealed");
  };

  const getAvatarBg = (color: PreviewChild["avatarColor"]) => {
    switch (color) {
      case "ember":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "teal":
        return "bg-teal-100 text-teal-900 border-teal-300";
      case "coral":
        return "bg-rose-100 text-rose-900 border-rose-300";
      case "purple":
      default:
        return "bg-royal/10 text-royal border-royal/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Test State Selector for Reviewers / Artboards */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-royal/10 bg-white/60 p-2.5 text-xs">
        <span className="font-semibold text-muted">Preview Artboard State:</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setPinState("idle")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              pinState === "idle"
                ? "bg-royal text-white"
                : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            Normal Profile (b11)
          </button>
          <button
            type="button"
            onClick={() => setPinState("confirm")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              pinState === "confirm"
                ? "bg-royal text-white"
                : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            PIN Reset Confirm (b12-1)
          </button>
          <button
            type="button"
            onClick={() => setPinState("revealed")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              pinState === "revealed"
                ? "bg-royal text-white"
                : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            New PIN Revealed (b12-1)
          </button>
          <button
            type="button"
            onClick={() => setPinState("error")}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              pinState === "error"
                ? "bg-royal text-white"
                : "bg-royal/5 text-muted hover:text-royal"
            }`}
          >
            PIN Reset Failed (b12-1)
          </button>
        </div>
      </div>

      {/* Back Link to Children Hub */}
      <nav aria-label="Breadcrumb">
        <Link
          href="/parent/children"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-muted transition hover:text-royal"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Children</span>
        </Link>
      </nav>

      {/* Profile Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            aria-hidden="true"
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-2xl font-black ${getAvatarBg(
              avatarColor
            )}`}
          >
            {firstName.charAt(0) || "C"}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {firstName} {lastName}
              </h1>
              {child.status === "active" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
                  Active place
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" aria-hidden="true" />
                  Paused &middot; profile kept
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Year {yearLevel} &middot; {curriculum}
            </p>
          </div>
        </div>

        {/* Quick learning jump */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/parent/children/${child.id}/progress`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-royal/15 bg-white px-4 text-xs font-bold text-ink transition hover:border-royal hover:text-royal"
          >
            <LineChart className="h-4 w-4 text-royal" aria-hidden="true" />
            <span>Progress</span>
          </Link>
          <Link
            href={`/parent/children/${child.id}/curriculum`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-royal/15 bg-white px-4 text-xs font-bold text-ink transition hover:border-royal hover:text-royal"
          >
            <BookOpen className="h-4 w-4 text-royal" aria-hidden="true" />
            <span>Learning</span>
          </Link>
        </div>
      </div>

      {savedBanner && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-950 sm:text-sm"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          Changes saved successfully.
        </div>
      )}

      {/* Two Column Layout (b11) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Details form & credentials (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Edit Details Card */}
          <section
            aria-labelledby="h-details"
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-7"
          >
            <h2 id="h-details" className="text-lg font-bold text-ink">
              Details
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Update name, school year level, or curriculum standard.
            </p>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="fn" className="block text-xs font-semibold text-ink">
                    First name
                  </label>
                  <input
                    id="fn"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-royal/15 px-3 py-2 text-sm text-ink focus-visible:border-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                  />
                </div>
                <div>
                  <label htmlFor="ln" className="block text-xs font-semibold text-ink">
                    Last name <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <input
                    id="ln"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-royal/15 px-3 py-2 text-sm text-ink focus-visible:border-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="yl" className="block text-xs font-semibold text-ink">
                  Year level
                </label>
                <select
                  id="yl"
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-royal/15 bg-white px-3 py-2 text-sm text-ink focus-visible:border-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                >
                  <option value="3">Year 3</option>
                  <option value="5">Year 5</option>
                </select>
              </div>

              <div>
                <label htmlFor="cs" className="block text-xs font-semibold text-ink">
                  Curriculum standard
                </label>
                <select
                  id="cs"
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-royal/15 bg-white px-3 py-2 text-sm text-ink focus-visible:border-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/15"
                >
                  <option value="Victorian Curriculum v2.0">Victorian Curriculum v2.0</option>
                  <option value="Australian Curriculum v9.0">Australian Curriculum v9.0</option>
                  <option value="NSW Syllabus">NSW Syllabus</option>
                </select>
              </div>

              {/* Avatar Color Choice */}
              <div>
                <label className="block text-xs font-semibold text-ink">Avatar colour</label>
                <div className="mt-2 flex gap-2">
                  {(["purple", "ember", "teal", "coral"] as const).map((color) => {
                    const isSelected = avatarColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAvatarColor(color)}
                        aria-label={`Select ${color} avatar colour`}
                        aria-pressed={isSelected}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-bold transition ${getAvatarBg(
                          color
                        )} ${isSelected ? "ring-2 ring-royal ring-offset-2" : "hover:scale-105"}`}
                      >
                        {firstName.charAt(0) || "A"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-royal px-5 text-xs font-bold text-white shadow-sm transition hover:bg-royal-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
                >
                  Save changes
                </button>
                <Link
                  href="/parent/children"
                  className="inline-flex min-h-11 items-center px-3 text-xs font-bold text-muted transition hover:text-ink"
                >
                  Cancel
                </Link>
              </div>
              <p className="text-[11px] text-muted">
                Nothing is saved until you press Save and we confirm it.
              </p>
            </form>
          </section>

          {/* Sign-in access card (b11 & b12-1) */}
          <section
            aria-labelledby="h-access"
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-7"
          >
            <h2 id="h-access" className="text-lg font-bold text-ink">
              Sign-in access
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Credentials used by {firstName} to sign in to the student practice space.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Login code</p>
                <p className="mt-1 font-mono text-xl font-bold tracking-wider text-ink sm:text-2xl">
                  {child.loginCode}
                </p>
                <p className="mt-1 text-[11px] text-muted">Never changes</p>
              </div>

              <div className="rounded-xl border border-royal/10 bg-royal/[0.02] p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">PIN</p>
                <p className="mt-1 font-mono text-xl font-bold tracking-wider text-muted sm:text-2xl">
                  &bull;&bull;&bull;&bull;&bull;&bull;
                </p>
                <p className="mt-1 text-[11px] text-muted">Stored securely</p>
              </div>
            </div>

            {/* PIN Reset Flow UI */}
            {pinState === "confirm" ? (
              <div className="mt-5 rounded-xl border border-royal/20 bg-royal/[0.03] p-4 text-xs">
                <p className="font-bold text-ink">Reset {firstName}&apos;s PIN?</p>
                <p className="mt-1 text-muted">
                  The old PIN stops working straight away and {firstName} is signed out on every device. Her login code and all her work stay exactly as they are.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmResetPin}
                    className="rounded-lg bg-royal px-3.5 py-1.5 font-bold text-white transition hover:bg-royal-deep"
                  >
                    Reset the PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setPinState("idle")}
                    className="rounded-lg px-3 py-1.5 font-bold text-muted transition hover:bg-royal/5"
                  >
                    Keep it
                  </button>
                </div>
              </div>
            ) : pinState === "revealed" ? (
              <div className="mt-5 space-y-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <span>New PIN set</span>
                </div>
                <div className="rounded-lg bg-white p-3 text-center shadow-xs">
                  <p className="text-[11px] font-semibold text-muted">{firstName}&apos;s new PIN</p>
                  <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-royal">{newPin}</p>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Write this down now. We cannot show it again &mdash; we only keep a scrambled cryptographic copy, so the next step is another reset.
                </p>
                <button
                  type="button"
                  onClick={() => setPinState("idle")}
                  className="rounded-lg bg-emerald-700 px-3 py-1 font-bold text-white transition hover:bg-emerald-800"
                >
                  Done
                </button>
              </div>
            ) : pinState === "error" ? (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-950"
              >
                <div className="flex items-center gap-2 font-bold text-rose-900">
                  <AlertCircle className="h-4 w-4 text-rose-600" aria-hidden="true" />
                  <span>We couldn&apos;t reset the PIN</span>
                </div>
                <p className="mt-1 text-rose-900">
                  {firstName}&apos;s old PIN still works and nothing has changed. Try again, or contact support if it keeps happening.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmResetPin}
                    className="rounded-lg bg-rose-700 px-3 py-1.5 font-bold text-white transition hover:bg-rose-800"
                  >
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={() => setPinState("idle")}
                    className="rounded-lg px-3 py-1.5 font-bold text-rose-900 transition hover:bg-rose-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setPinState("confirm")}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-royal/15 bg-white px-4 text-xs font-bold text-ink transition hover:border-royal hover:text-royal"
                >
                  <KeyRound className="h-4 w-4 text-royal" aria-hidden="true" />
                  <span>Reset PIN</span>
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Place usage, Pause, Deletion (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Access & Place Usage */}
          <section
            aria-labelledby="h-pause"
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm"
          >
            <h2 id="h-pause" className="text-base font-bold text-ink">
              Place usage &amp; access
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {child.status === "active"
                ? `${firstName} is using 1 of your 3 Family plan places.`
                : `${firstName} is paused and not using a Family plan place.`}
            </p>

            <div className="mt-4 rounded-xl border border-royal/10 bg-royal/[0.02] p-4 text-xs text-muted">
              Pausing {firstName} frees her place for another child. Her login code, PIN, finished papers and writing are kept exactly as they are. You can unpause her at any time.
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleTogglePause}
                className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition ${
                  child.status === "active"
                    ? "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                    : "border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                }`}
              >
                {child.status === "active" ? (
                  <>
                    <PauseCircle className="h-4 w-4" aria-hidden="true" />
                    <span>Pause {firstName}&apos;s access</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" aria-hidden="true" />
                    <span>Restore {firstName}&apos;s place</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Quick Learning & Writing Links */}
          <section
            aria-labelledby="h-shortcuts"
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm"
          >
            <h2 id="h-shortcuts" className="text-base font-bold text-ink">
              Work &amp; curriculum
            </h2>
            <div className="mt-3 space-y-2">
              <Link
                href={`/parent/children/${child.id}/progress`}
                className="flex items-center justify-between rounded-xl border border-royal/8 p-3 text-xs font-semibold text-ink transition hover:border-royal hover:bg-royal/5 hover:text-royal"
              >
                <div className="flex items-center gap-2.5">
                  <LineChart className="h-4 w-4 text-royal" aria-hidden="true" />
                  <span>{firstName}&apos;s progress</span>
                </div>
                <ArrowLeft className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
              </Link>
              <Link
                href={`/parent/children/${child.id}/curriculum`}
                className="flex items-center justify-between rounded-xl border border-royal/8 p-3 text-xs font-semibold text-ink transition hover:border-royal hover:bg-royal/5 hover:text-royal"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="h-4 w-4 text-royal" aria-hidden="true" />
                  <span>Learning for {firstName}</span>
                </div>
                <ArrowLeft className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
              </Link>
              <Link
                href={`/parent/children/${child.id}/writing`}
                className="flex items-center justify-between rounded-xl border border-royal/8 p-3 text-xs font-semibold text-ink transition hover:border-royal hover:bg-royal/5 hover:text-royal"
              >
                <div className="flex items-center gap-2.5">
                  <PenTool className="h-4 w-4 text-royal" aria-hidden="true" />
                  <span>{firstName}&apos;s writing</span>
                </div>
                <ArrowLeft className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
              </Link>
            </div>
          </section>

          {/* Data Deletion Section (ADR-012 model, strictly NO unapproved 30-day timeframe) */}
          <section
            aria-labelledby="h-delete"
            className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-xs"
          >
            <h2 id="h-delete" className="text-base font-bold text-rose-950">
              Data and erasure
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-rose-900/80">
              Under our verified deletion process (ADR-012), educational records deletion requires guardian verification. Pausing preserves results and frees the place; deletion permanently erases all student work.
            </p>

            {deletionRequested ? (
              <div className="mt-3 rounded-xl border border-rose-300 bg-white p-3.5 text-xs text-rose-950">
                <p className="font-bold">Deletion request received.</p>
                <p className="mt-0.5 text-muted">
                  A verification email has been sent to your guardian address to confirm erasure of {firstName}&apos;s data.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setDeletionRequested(true)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 text-xs font-bold text-rose-700 transition hover:bg-rose-100/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span>Request deletion of {firstName}&apos;s data</span>
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
