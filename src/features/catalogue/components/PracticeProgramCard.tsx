import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { UpgradeRequired, buttonClasses } from "@/components/ui";

import type { Program } from "../catalogue";
import {
  estimatedDurationLabel,
  examStyleBadgeVariant,
  examStyleLabel,
  subjectPresentation,
} from "../presentation";
import { SubjectPlate } from "./SubjectPlate";

export interface PracticeProgramCardProps {
  program: Program;
  /**
   * Questions the program's own starting bank can serve for its pinned
   * grade/style/subject. Server-computed by the catalogue page from the same
   * eligibility summaries the setup screen reads, so a card can never
   * advertise a number the configurator then contradicts.
   */
  questionCount?: number;
}

/** NAPLAN warm, ICAS brand purple — the dot beside the style's own name. */
const STYLE_DOT: Record<"orange" | "purple", string> = {
  orange: "bg-royal-orange",
  purple: "bg-mm-brand",
};

/**
 * One live, unlocked practice program, presented as a subject plate.
 *
 * The still life is what distinguishes one card from the next: twelve cards
 * whose only difference was a line of title text made the reader parse every
 * heading to find the one they wanted, and the plate lets them find Reading
 * or Numeracy by shape before reading a word. Everything else on the card is
 * deliberately quiet — one style chip, the title, the blurb, the two numbers
 * that decide whether this program is worth sitting today.
 *
 * The card is a single link with the program name as its accessible name;
 * the "Start practice" row is styled as an action but is deliberately a
 * <span> inside that link, not a nested interactive element — a button
 * inside an anchor is invalid HTML and gives screen readers two controls
 * for one destination.
 */
export function PracticeProgramCard({ program, questionCount }: PracticeProgramCardProps) {
  const presentation = subjectPresentation(program);
  const duration =
    questionCount === undefined ? null : estimatedDurationLabel(questionCount);
  const hasMeta = questionCount !== undefined || duration !== null;

  return (
    <Link
      href={`/practice/${program.slug}`}
      data-testid={`program-card-${program.id}`}
      className="group block h-full rounded-[20px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page"
      /* motion-reduce disables the lift and the plate's zoom for anyone who
         asked the OS for less motion; the border and shadow still mark hover. */
    >
      {/*
        The plate runs down the left edge on a phone and across the top from
        `sm` up. Fifteen full-width plates stacked vertically made the phone
        page roughly 11,000px tall — longer than the flat list it replaced,
        which defeats the point of giving each program a picture.
      */}
      <div className="flex h-full overflow-hidden rounded-[20px] border border-mm-line bg-white shadow-[0_1px_2px_rgba(24,21,31,0.05)] transition duration-200 group-hover:-translate-y-1 group-hover:border-mm-brand/45 group-hover:shadow-[0_18px_40px_rgba(24,21,31,0.10)] motion-reduce:transform-none motion-reduce:transition-none sm:flex-col">
        <SubjectPlate
          presentation={presentation}
          className="m-4 h-24 w-24 shrink-0 rounded-xl border border-mm-line sm:m-0 sm:aspect-[3/2] sm:h-auto sm:w-full sm:rounded-none sm:border-x-0 sm:border-t-0"
          markClassName="h-8 w-8 sm:h-11 sm:w-11"
          zoomOnGroupHover
        />

        <div className="flex min-w-0 flex-1 flex-col py-4 pr-4 sm:p-5">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase leading-none tracking-[0.09em] text-mm-muted">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${STYLE_DOT[examStyleBadgeVariant(program)]}`}
            />
            {examStyleLabel(program)}
          </p>

          <h3 className="mt-2.5 text-[17.5px] font-bold leading-[1.25] text-mm-ink">
            {program.name}
          </h3>
          {/* Two lines on a phone, in full from `sm`: fifteen three-line
              blurbs added roughly a screen and a half of scrolling to a list
              whose job is to be skimmed. The full text is on the program's
              own page, one tap away. */}
          <p className="mt-2 line-clamp-2 flex-1 text-[14.5px] leading-[1.55] text-mm-muted sm:line-clamp-none">
            {program.blurb}
          </p>

          {hasMeta && (
            <dl className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] font-bold uppercase tracking-[0.08em] text-mm-muted">
              {questionCount !== undefined && (
                <div>
                  <dt className="sr-only">Questions available</dt>
                  <dd>{questionCount} questions available</dd>
                </div>
              )}
              {questionCount !== undefined && duration && (
                <span aria-hidden="true" className="text-mm-lilac">
                  &middot;
                </span>
              )}
              {duration && (
                <div>
                  <dt className="sr-only">Estimated length</dt>
                  <dd>{duration}</dd>
                </div>
              )}
            </dl>
          )}

          <span className="mt-4 flex items-center justify-between gap-3 border-t border-mm-line-soft pt-4 text-[15px] font-bold text-mm-brand">
            Start practice
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * A live program gated behind a plan the viewer does not have
 * (isProgramLocked in ../entitlement.ts). No catalogue program sets
 * planTier: "premium" today, so this renders nowhere yet — it exists as
 * the ready-made building block for when entitlement enforcement ships
 * (docs/PRIVACY_AND_BILLING_GUARDRAILS.md), matching the "See plans" copy
 * LearningInsights already uses on the parent dashboard.
 */
export function LockedProgramCard({ program }: { program: Program }) {
  return (
    <UpgradeRequired
      className="h-full"
      title={program.name}
      description={program.blurb}
      planName="Premium"
      action={
        <Link href="/billing" className={buttonClasses({ variant: "orange", size: "sm" })}>
          See plans
        </Link>
      }
    />
  );
}
