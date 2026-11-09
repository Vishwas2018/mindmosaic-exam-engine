"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, PauseCircle, PlayCircle, Info } from "lucide-react";
import { PREVIEW_CHILDREN, PREVIEW_FAMILY_PLAN, type PreviewChild } from "../fixtures";

export interface ChildrenHubProps {
  initialChildren?: PreviewChild[];
  isLiveAccount?: boolean;
}

export function ChildrenHub({
  initialChildren = PREVIEW_CHILDREN,
  isLiveAccount = false,
}: ChildrenHubProps) {
  const [children, setChildren] = useState<PreviewChild[]>(initialChildren);
  const [placesLimitReached, setPlacesLimitReached] = useState(false);

  const activeCount = children.filter((c) => c.status === "active").length;
  const maxPlaces = PREVIEW_FAMILY_PLAN.maxPlaces;
  const placesPercent = Math.round((activeCount / maxPlaces) * 100);

  const togglePauseChild = (childId: string) => {
    setChildren((prev) =>
      prev.map((c) => {
        if (c.id === childId) {
          const nextStatus = c.status === "active" ? "paused" : "active";
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
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
      {/* Test State Selector for Reviewers / Artboards - isolated to preview demonstrations */}
      {!isLiveAccount && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-royal/10 bg-white/60 p-2.5 text-xs">
          <span className="font-semibold text-muted">Preview Artboard State:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPlacesLimitReached(false)}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                !placesLimitReached
                  ? "bg-royal text-white"
                  : "bg-royal/5 text-muted hover:text-royal"
              }`}
            >
              Normal (b10/b13/b14: 2 of 3 used)
            </button>
            <button
              type="button"
              onClick={() => setPlacesLimitReached(true)}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                placesLimitReached
                  ? "bg-royal text-white"
                  : "bg-royal/5 text-muted hover:text-royal"
              }`}
            >
              Plan Limit Reached (b12-2: 3 of 3 used)
            </button>
          </div>
        </div>
      )}

      {/* Greeting Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Children</h1>
          <p className="mt-1 text-base text-muted sm:text-lg">
            Profiles, sign-in details and paid places.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          Illustrative sample family
        </span>
      </div>

      {/* Paid Places Card (b10) */}
      <section
        aria-labelledby="h-places"
        className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-7"
      >
        <div className="max-w-xl">
          <h2 id="h-places" className="text-lg font-bold text-ink">
            Paid places
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
            {placesLimitReached ? 3 : activeCount} of {maxPlaces} used on your Family plan. A place is what lets a child sign in and practise. A profile is the record of who they are &mdash; you can keep more profiles than you have places.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-royal/10" aria-hidden="true">
            <div
              className={`h-full transition-all ${
                placesLimitReached || activeCount >= maxPlaces ? "bg-amber-600" : "bg-royal"
              }`}
              style={{ width: `${placesLimitReached ? 100 : placesPercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted">
            <span>
              {placesLimitReached ? 0 : maxPlaces - activeCount} place{placesLimitReached || maxPlaces - activeCount === 1 ? "" : "s"} free
            </span>
            <Link
              href="/billing"
              className="font-bold text-royal underline underline-offset-2 hover:text-royal-deep"
            >
              Change plan
            </Link>
          </div>
        </div>
      </section>

      {/* Plan Limit Warning (b12-2) */}
      {placesLimitReached && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 sm:text-sm"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <b className="font-semibold">All 3 Family places are in use.</b>
            <p className="mt-0.5">
              To add another child or give Maya a place, pause an active child first or upgrade your membership. Profiles are never deleted when paused.
            </p>
          </div>
        </div>
      )}

      {/* Children Directory List */}
      <div className="grid gap-4 sm:gap-6">
        {children.map((child) => {
          const isActive = child.status === "active";
          return (
            <article
              key={child.id}
              className={`rounded-2xl border p-6 shadow-sm transition sm:p-7 ${
                isActive
                  ? "border-royal/10 bg-white"
                  : "border-dashed border-royal/20 bg-royal/[0.015]"
              }`}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                {/* Child Identifiers */}
                <div className="flex items-start gap-4">
                  <div
                    aria-hidden="true"
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border font-bold text-xl ${getAvatarBg(
                      child.avatarColor
                    )}`}
                  >
                    {child.firstName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-ink">
                        {child.firstName} {child.lastName || ""}
                      </h3>
                      {isActive ? (
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
                    <p className="mt-1 text-xs text-muted">
                      Year {child.yearLevel} &middot; {child.curriculum}
                    </p>

                    {/* Practice stats */}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-ink">
                      <span>
                        Login code: <span className="font-mono tracking-wider text-royal">{child.loginCode}</span>
                      </span>
                      <span className="text-muted/50">&middot;</span>
                      <span>
                        PIN: <span className="font-mono text-muted">&bull;&bull;&bull;&bull;&bull;&bull;</span>
                      </span>
                      {isActive && child.finishedPapersCount > 0 && (
                        <>
                          <span className="text-muted/50">&middot;</span>
                          <span className="text-muted">
                            {child.finishedPapersCount} finished papers &middot; {child.totalMarksEarned} marks
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Action Links */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                  <Link
                    href={`/parent/children/${child.id}`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-royal/15 bg-white px-4 text-xs font-bold text-ink transition hover:border-royal hover:text-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
                  >
                    View profile
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>

                  {isActive && (
                    <>
                      <Link
                        href={`/parent/children/${child.id}/progress`}
                        className="inline-flex min-h-11 items-center rounded-xl bg-royal/5 px-3.5 text-xs font-bold text-royal transition hover:bg-royal/10"
                      >
                        Progress
                      </Link>
                      <Link
                        href={`/parent/children/${child.id}/curriculum`}
                        className="inline-flex min-h-11 items-center rounded-xl bg-royal/5 px-3.5 text-xs font-bold text-royal transition hover:bg-royal/10"
                      >
                        Learning
                      </Link>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => togglePauseChild(child.id)}
                    className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-xs font-bold text-muted transition hover:bg-royal/5 hover:text-royal"
                  >
                    {isActive ? (
                      <>
                        <PauseCircle className="h-4 w-4" aria-hidden="true" />
                        <span>Pause place</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4" aria-hidden="true" />
                        <span>Restore place</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {/* Add Another Child Card */}
        <div className="rounded-2xl border-2 border-dashed border-royal/20 p-6 text-center transition hover:border-royal/40 sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-royal/8 text-royal">
            <Plus className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-3 text-base font-bold text-ink">Add another child</h3>
          <p className="mt-1 text-xs text-muted">
            {maxPlaces - activeCount > 0
              ? `${maxPlaces - activeCount} place remaining on your Family plan.`
              : "All places in use. Pausing a child frees their place for another."}
          </p>
          <div className="mt-4">
            <Link
              href="/parent/setup"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-royal px-5 text-xs font-extrabold text-white transition hover:bg-royal-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
            >
              Add a child profile &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
