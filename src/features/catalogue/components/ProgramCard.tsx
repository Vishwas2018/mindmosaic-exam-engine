import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge, Card, UpgradeRequired, buttonClasses } from "@/components/ui";

import type { Program } from "../catalogue";

/** A live, unlocked program: the original /practice catalogue card. */
export function ProgramCard({ program }: { program: Program }) {
  return (
    <Link
      href={`/practice/${program.slug}`}
      className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
    >
      <Card
        className="flex h-full flex-col p-6 transition group-hover:-translate-y-0.5 group-hover:shadow-[0_20px_45px_rgba(49,32,86,0.14)]"
        variant="default"
      >
        <Badge variant={program.scope?.examStyle === "icas_style" ? "purple" : "orange"}>
          {program.scope
            ? program.scope.examStyle === "naplan_style"
              ? "NAPLAN-style"
              : "ICAS-style"
            : "Build your own"}
        </Badge>
        <h3 className="mt-4 text-xl font-black tracking-[-0.03em] text-ink">{program.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted">{program.blurb}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold text-royal transition group-hover:gap-2.5">
          Start practising
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </span>
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
