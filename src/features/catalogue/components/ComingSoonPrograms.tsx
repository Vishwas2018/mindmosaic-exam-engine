import { Lock } from "lucide-react";

import { Badge, Card } from "@/components/ui";

import type { Program } from "../catalogue";

/**
 * Planned programs, in a 2x2 of clearly locked cards.
 *
 * Nothing here is interactive and nothing pretends to be: no link, no
 * button, no hover lift, and `aria-disabled` plus a visible "Planned" badge
 * so the unavailability is announced rather than implied by a faded card.
 * The section is visually quieter than the live grid above it — a roadmap
 * should not compete with the catalogue a student can sit today.
 */
export function ComingSoonPrograms({ programs }: { programs: readonly Program[] }) {
  if (programs.length === 0) return null;

  return (
    <section aria-labelledby="coming-soon-heading">
      <h2
        id="coming-soon-heading"
        className="text-2xl font-black tracking-[-0.03em] text-ink sm:text-3xl"
      >
        Planned programs
      </h2>
      <p className="mt-2 max-w-2xl text-base leading-7 text-muted">
        Not available to sit yet. These are what we are building next.
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {programs.map((program) => (
          <li key={program.id}>
            <Card
              variant="soft"
              aria-disabled="true"
              className="flex h-full items-start gap-3.5 border-dashed p-5"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-royal/6 text-muted"
              >
                <Lock className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-black tracking-[-0.02em] text-ink">
                    {program.name}
                  </h3>
                  <Badge variant="neutral">Planned</Badge>
                </div>
                <p className="mt-1.5 text-sm leading-6 text-muted">{program.blurb}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
