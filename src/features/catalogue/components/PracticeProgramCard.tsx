import Link from "next/link";
import { ArrowRight, ListChecks, Timer } from "lucide-react";

import { Badge, Card, UpgradeRequired, buttonClasses } from "@/components/ui";

import type { Program } from "../catalogue";
import {
  estimatedDurationLabel,
  examStyleBadgeVariant,
  examStyleLabel,
  subjectPresentation,
} from "../presentation";

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

/**
 * One live, unlocked practice program.
 *
 * The card is a single link with the program name as its accessible name;
 * the "Start practice" element is styled as a button but is deliberately a
 * <span> inside that link, not a nested interactive element — a button
 * inside an anchor is invalid HTML and gives screen readers two controls
 * for one destination.
 */
export function PracticeProgramCard({ program, questionCount }: PracticeProgramCardProps) {
  const presentation = subjectPresentation(program);
  const Icon = presentation.icon;
  const duration =
    questionCount === undefined ? null : estimatedDurationLabel(questionCount);

  return (
    <Link
      href={`/practice/${program.slug}`}
      data-testid={`program-card-${program.id}`}
      className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
      /* motion-reduce disables the lift for anyone who asked the OS for less
         motion; the shadow change still marks hover. */
    >
      <Card
        variant="default"
        className="flex h-full flex-col overflow-hidden p-0 transition duration-150 group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_40px_rgba(49,32,86,0.13)] motion-reduce:transform-none motion-reduce:transition-none"
      >
        <span aria-hidden="true" className={`block h-1 w-full ${presentation.rule}`} />

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <span
              aria-hidden="true"
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${presentation.tile}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="flex flex-wrap justify-end gap-1.5">
              {program.scope && (
                <Badge variant="neutral">Grade {program.scope.yearLevel}</Badge>
              )}
              <Badge variant={examStyleBadgeVariant(program)}>{examStyleLabel(program)}</Badge>
            </div>
          </div>

          <h3 className="mt-4 text-lg font-black leading-tight tracking-[-0.02em] text-ink sm:text-xl">
            {program.name}
          </h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-muted">{program.blurb}</p>

          <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-semibold text-muted">
            {questionCount !== undefined && (
              <div className="inline-flex items-center gap-1.5">
                <ListChecks aria-hidden="true" className="h-4 w-4 text-royal" />
                <dt className="sr-only">Questions available</dt>
                <dd>{questionCount} questions available</dd>
              </div>
            )}
            {duration && (
              <div className="inline-flex items-center gap-1.5">
                <Timer aria-hidden="true" className="h-4 w-4 text-royal" />
                <dt className="sr-only">Estimated length</dt>
                <dd>{duration}</dd>
              </div>
            )}
          </dl>

          <span
            className={buttonClasses({
              variant: "primary",
              className: "mt-5 w-full group-hover:brightness-95",
            })}
          >
            Start practice
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </span>
        </div>
      </Card>
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
