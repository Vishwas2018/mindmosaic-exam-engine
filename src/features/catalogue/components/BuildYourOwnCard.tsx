import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import type { Program } from "../catalogue";
import { BUILD_YOUR_OWN_PRESENTATION } from "../presentation";
import { catalogueButton, EYEBROW_CLASSES } from "./controls";
import { SubjectPlate } from "./SubjectPlate";

/**
 * The unscoped configurator, presented as the different pathway it is.
 *
 * It used to render through the same card as the twelve fixed programs,
 * which made "pick a ready-made paper" and "assemble one yourself" look like
 * the same kind of choice. It is now the one full-width panel on the page —
 * a different shape, a different surface and the only place the tri-colour
 * rule appears, because this is the only entry that spans every subject.
 * The five things a student actually gets to choose are listed, because
 * that is the whole difference.
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
    <div className="overflow-hidden rounded-[20px] border border-mm-tint-line bg-mm-tint-soft">
      <span
        aria-hidden="true"
        className={`block h-1 w-full ${BUILD_YOUR_OWN_PRESENTATION.rule}`}
      />

      <div className="grid items-stretch lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_minmax(0,0.7fr)]">
        <div className="p-[clamp(20px,2.4vw,32px)]">
          <p className={EYEBROW_CLASSES}>
            <span aria-hidden="true" className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />
            Build your own
          </p>

          <h3 className="mt-4 text-[clamp(21px,2vw,26px)] font-bold leading-[1.2] text-mm-ink">
            {program.name}
          </h3>
          <p className="mt-3 max-w-[42ch] text-[15.5px] leading-[1.6] text-mm-muted">
            {program.blurb}
          </p>

          <Link
            href={`/practice/${program.slug}`}
            data-testid="build-your-own-cta"
            className={catalogueButton({ className: "mt-7" })}
          >
            Build a session
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>

        <div className="px-[clamp(20px,2.4vw,32px)] pb-[clamp(20px,2.4vw,32px)] lg:border-l lg:border-mm-tint-line lg:py-[clamp(20px,2.4vw,32px)]">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-muted">
            You choose
          </p>
          <ul className="mt-3.5 grid gap-2.5">
            {CHOICES.map((choice) => (
              <li
                key={choice}
                className="flex items-start gap-2.5 text-[15px] font-medium leading-[1.45] text-mm-ink-soft"
              >
                <span
                  aria-hidden="true"
                  className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white text-mm-brand ring-1 ring-mm-tint-line"
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {choice}
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative: the writing still life, full-bleed to the panel's
            right edge. Hidden below lg, where the panel stacks and an
            image column would only push the CTA further down the page. */}
        <SubjectPlate
          presentation={BUILD_YOUR_OWN_PRESENTATION}
          className="hidden h-full min-h-[220px] w-full lg:block"
          markClassName="h-12 w-12"
        />
      </div>
    </div>
  );
}
