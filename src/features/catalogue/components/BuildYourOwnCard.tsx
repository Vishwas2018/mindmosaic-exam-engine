import Link from "next/link";
import { ArrowRight, Check, Shuffle } from "lucide-react";

import { Badge, Card, buttonClasses } from "@/components/ui";

import type { Program } from "../catalogue";

/**
 * The unscoped configurator, presented as the different pathway it is.
 *
 * It used to render through the same card as the twelve fixed programs,
 * which made "pick a ready-made paper" and "assemble one yourself" look like
 * the same kind of choice. The four things a student actually gets to choose
 * are listed, because that is the whole difference.
 */
const CHOICES = [
  "Grade 3 or Grade 5",
  "Any subject, or a mix",
  "10, 20, 30 or the full set",
  "Timed or untimed",
  "Include writing tasks",
];

export function BuildYourOwnCard({ program }: { program: Program }) {
  return (
    <Card
      variant="default"
      className="flex h-full flex-col overflow-hidden border-royal/15 bg-[linear-gradient(160deg,#FFFFFF_0%,#F7F4FF_100%)] p-0"
    >
      <span
        aria-hidden="true"
        className="block h-1 w-full bg-[linear-gradient(90deg,var(--royal-purple),var(--success),var(--royal-orange))]"
      />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-royal/8 text-royal"
          >
            <Shuffle className="h-5 w-5" />
          </span>
          <Badge variant="purple">Build your own</Badge>
        </div>

        <h3 className="mt-4 text-lg font-black leading-tight tracking-[-0.02em] text-ink sm:text-xl">
          {program.name}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted">{program.blurb}</p>

        <ul className="mt-4 flex-1 space-y-1.5">
          {CHOICES.map((choice) => (
            <li key={choice} className="flex items-start gap-2 text-sm font-semibold text-ink">
              <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-royal" />
              {choice}
            </li>
          ))}
        </ul>

        <Link
          href={`/practice/${program.slug}`}
          data-testid="build-your-own-cta"
          className={buttonClasses({ variant: "secondary", className: "mt-5 w-full" })}
        >
          Build a session
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
