import type { Metadata } from "next";
import { BadgeCheck, Flag, Sparkles, Timer, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui";
import { AppFooter } from "@/components/shell/AppFooter";
import { AppHeader } from "@/components/shell/AppHeader";
import { PROGRAMS } from "@/features/catalogue/catalogue";
import { resolveProgramStatuses } from "@/features/taxonomy/coverage";
import { ComingSoonPrograms } from "@/features/catalogue/components/ComingSoonPrograms";
import { parseFilters } from "@/features/catalogue/filter-state";
import { PracticeProgramGrid } from "@/features/catalogue/components/PracticeProgramGrid";
import { ActiveSessionBanner } from "@/features/exam-engine/components/ActiveSessionBanner";
import { eligibilityKey } from "@/features/exam-engine/selection";
import { getBankEligibility } from "@/server/exam-bank";

/*
 * The description used to end "No sign-in required." while the page itself
 * said signing in is what saves your results. Both were true — you can sit a
 * whole session as a guest, and only a signed-in attempt is persisted — but
 * read together they invited the question "so do I need an account or not?".
 * One sentence now answers it in the order a reader asks it.
 */
export const metadata: Metadata = {
  title: "Practice programs",
  description:
    "Browse and start original Grade 3 and Grade 5 NAPLAN-style and ICAS-style practice without signing in. Sign in to save your progress and results.",
};

/*
 * Expansion cells (Years 1-12) are declared coming_soon in the catalogue,
 * which cannot count questions — it is imported by client components. This
 * page is a server component, so it resolves the real status first: a cell
 * goes live once its gated pool clears GATED_COVERAGE_THRESHOLD.
 */
const RESOLVED_PROGRAMS = resolveProgramStatuses(PROGRAMS);

const liveScopedPrograms = RESOLVED_PROGRAMS.filter(
  (program) => program.status === "live" && program.scope !== undefined,
);
const unscopedLiveProgram = RESOLVED_PROGRAMS.find(
  (program) => program.status === "live" && program.scope === undefined,
);
const comingSoonPrograms = RESOLVED_PROGRAMS.filter(
  (program) => program.status === "coming_soon",
);

/*
 * Trust points, each backed by something this product actually does: the
 * question bank is written in-house (docs/CONTENT_RULES.md), the locale is
 * pinned to en-AU in the question schema, scoring is server-side and
 * immediate for auto-marked questions, and attempts are persisted only for
 * a signed-in student. No claim here needs a footnote.
 */
const TRUST_POINTS = [
  { label: "Original questions", icon: BadgeCheck },
  { label: "Australian English", icon: Flag },
  { label: "Instant scoring", icon: Timer },
  { label: "Progress saved when signed in", icon: TrendingUp },
];

/**
 * Questions each scoped program's own starting bank can serve for its
 * pinned grade/style/subject, from the same eligibility summaries the setup
 * screen reads — so a card and the configurator it opens can never disagree
 * about how much content is behind it. Counts only, never question content:
 * this is a server component, and getBankEligibility() returns no items.
 */
function buildQuestionCounts(): Record<string, number> {
  const eligibility = getBankEligibility();
  const counts: Record<string, number> = {};
  for (const program of PROGRAMS) {
    if (!program.scope) continue;
    const summary =
      eligibility[program.scope.initialBankId][eligibilityKey(program.scope)];
    if (summary) counts[program.id] = summary.count;
  }
  return counts;
}

/**
 * The practice catalogue.
 *
 * Two structural notes:
 *
 * - Filter state is read from the query *here*, on the server, and handed to
 *   the grid as `initialFilters`. The obvious alternative — calling
 *   useSearchParams() inside the client grid — forces Next to bail that
 *   Suspense boundary out to client-side rendering, and the production HTML
 *   for this route then contained a skeleton and not one program card. That
 *   is invisible in dev and was caught only by running the e2e suite against
 *   a real build. Reading the query server-side keeps all twelve cards in the
 *   markup, which is what a public catalogue page needs anyway.
 *
 *   That also rules out a segment-level loading.tsx: it would wrap
 *   /practice/[program], whose notFound() would then stream as HTTP 200
 *   (route-loading-boundaries.test.ts enforces this — it caught exactly that
 *   during this work).
 * - The page owns no layout CSS of its own beyond spacing: the header,
 *   footer, cards, badges and buttons are all shared components, so the
 *   catalogue cannot drift away from the rest of the product.
 */
export default async function PracticeCataloguePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const questionCounts = buildQuestionCounts();
  const resolved = await searchParams;
  /* Array values (?grade=3&grade=5) collapse to the first; parseFilters
     rejects anything it does not recognise, so a junk query falls back to
     "all" rather than filtering the grid to nothing. */
  const query = new URLSearchParams(
    Object.entries(resolved).flatMap(([key, value]) =>
      value === undefined ? [] : [[key, Array.isArray(value) ? (value[0] ?? "") : value]],
    ),
  );
  const initialFilters = parseFilters(query);

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <AppHeader />

      <main id="main-content" className="flex-1">
        {/*
          The hero was a full-viewport marketing panel with a
          clamp(2.75rem, 6vw, 5.25rem) headline and a 288px decorative
          circle, which pushed every program below the fold on a page whose
          only job is choosing one. Same promise, one third of the height,
          and the circle is now a soft wash rather than a shape competing
          with the type.
        */}
        <section className="relative isolate overflow-hidden border-b border-royal/8 bg-white/60">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-royal-orange/8 blur-3xl"
          />

          <div className="site-width relative py-10 sm:py-12">
            <Badge variant="orange">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Original Australian practice
            </Badge>

            <h1 className="mt-4 max-w-3xl text-[clamp(2rem,1.5rem+2vw,3rem)] font-black leading-[1.1] tracking-[-0.035em] text-ink">
              Choose the right practice for today
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Explore original Grade 3 and Grade 5 NAPLAN-style and ICAS-style
              practice. Choose a subject, year level and assessment style, then
              start immediately — signing in is what saves your progress.
            </p>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5">
              {TRUST_POINTS.map((point) => {
                const Icon = point.icon;
                return (
                  <li
                    key={point.label}
                    className="inline-flex items-center gap-2 text-sm font-bold text-ink"
                  >
                    <Icon aria-hidden="true" className="h-4 w-4 text-royal" />
                    {point.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <div className="site-width pt-6">
          <ActiveSessionBanner />
        </div>

        <section aria-label="Practice programs" className="site-width py-8 sm:py-10">
          <PracticeProgramGrid
            programs={liveScopedPrograms}
            buildYourOwn={unscopedLiveProgram}
            questionCounts={questionCounts}
            initialFilters={initialFilters}
          />
        </section>

        <div className="site-width pb-16 sm:pb-20">
          <ComingSoonPrograms programs={comingSoonPrograms} />
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
