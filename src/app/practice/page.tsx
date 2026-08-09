import type { Metadata } from "next";

import { AppFooter } from "@/components/shell/AppFooter";
import { AppHeader } from "@/components/shell/AppHeader";
import { PROGRAMS } from "@/features/catalogue/catalogue";
import { resolveProgramStatuses } from "@/features/taxonomy/coverage";
import { ComingSoonPrograms } from "@/features/catalogue/components/ComingSoonPrograms";
import { SubjectPlate } from "@/features/catalogue/components/SubjectPlate";
import { EYEBROW_CLASSES } from "@/features/catalogue/components/controls";
import { parseFilters } from "@/features/catalogue/filter-state";
import { PracticeProgramGrid } from "@/features/catalogue/components/PracticeProgramGrid";
import { SUBJECT_PRESENTATION } from "@/features/catalogue/presentation";
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
 *
 * The marker beside each is a plain tinted square rather than an icon: four
 * lucide glyphs beside four short claims read as decoration competing with
 * the twelve subject plates below, which are the page's actual imagery.
 */
const TRUST_POINTS = [
  { label: "Original questions", tone: "bg-mm-brand" },
  { label: "Australian English", tone: "bg-mm-coral" },
  { label: "Instant scoring", tone: "bg-mm-lilac" },
  { label: "Progress saved when signed in", tone: "bg-mm-brand" },
];

/*
 * The hero mosaic — the page's one decorative moment, and the reason it is
 * built from the subject still lifes rather than an abstract pattern: the
 * same plates reappear on every card below, so the mosaic is a legend for
 * the grid as much as an ornament, and "MindMosaic" is spelled out in the
 * product's own subjects. One cell is a solid brand tile so the arrangement
 * reads as a mosaic rather than a contact sheet.
 */
const HERO_PLATES = [
  SUBJECT_PRESENTATION.numeracy,
  SUBJECT_PRESENTATION.reading,
  SUBJECT_PRESENTATION.language,
  SUBJECT_PRESENTATION.science,
  SUBJECT_PRESENTATION.digital_technologies,
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
 * Three structural notes:
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
 *   footer, cards and controls are all shared components, so the catalogue
 *   cannot drift away from the rest of the product.
 * - The whole route opts into `.mm-root` (globals.css): the design canvas's
 *   palette and its Instrument Sans / Geist pair, the same surface the
 *   marketing page and the auth screens use. That is what makes the subject
 *   artwork sit *in* the page rather than on it — the still lifes are shot
 *   on the same warm cream `--mm-page` is, and on the old blue-grey
 *   `--bg-page` every plate carried a visible rectangle of the wrong white.
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
    <div className="mm-root flex min-h-screen flex-col bg-mm-page">
      <AppHeader />

      <main id="main-content" className="flex-1">
        {/*
          The hero stays deliberately short. It was once a full-viewport
          marketing panel that pushed every program below the fold on a page
          whose only job is choosing one; the mosaic reintroduces imagery
          without reintroducing that height, and it is hidden below lg where
          there is no spare column for it.
        */}
        <section className="border-b border-mm-line bg-white">
          <div className="site-width grid items-center gap-[clamp(28px,3vw,48px)] py-[clamp(28px,3.2vw,44px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
            <div className="min-w-0 max-w-[640px]">
              <p className={EYEBROW_CLASSES}>
                <span
                  aria-hidden="true"
                  className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral"
                />
                Original Australian practice
              </p>

              <h1 className="mt-5 text-[clamp(30px,3.4vw,44px)] font-bold leading-[1.08] tracking-[-0.035em] text-mm-ink">
                Choose the right practice for today
              </h1>
              <p className="mt-4 max-w-[56ch] text-pretty text-[clamp(16px,1.3vw,17.5px)] leading-[1.6] text-mm-muted">
                Original Grade 3 and Grade 5 practice in the NAPLAN and ICAS formats.
                Pick a subject, year level and assessment style, then start
                immediately — signing in is what saves your progress.
              </p>

              <ul className="mt-7 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {TRUST_POINTS.map((point) => (
                  <li
                    key={point.label}
                    className="flex items-start gap-2.5 text-[14.5px] font-medium text-mm-ink-soft"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-[7px] h-2 w-2 shrink-0 rounded-[2px] ${point.tone}`}
                    />
                    {point.label}
                  </li>
                ))}
              </ul>
            </div>

            <div aria-hidden="true" className="hidden grid-cols-3 gap-2.5 lg:grid">
              {HERO_PLATES.slice(0, 2).map((presentation) => (
                <SubjectPlate
                  key={presentation.label}
                  presentation={presentation}
                  className="aspect-square rounded-[10px]"
                  markClassName="h-7 w-7"
                />
              ))}

              {/* The one solid cell: four squares on brand purple, the same
                  ornament the marketing surface closes its sections with. */}
              <span className="grid aspect-square grid-cols-2 grid-rows-2 gap-1.5 rounded-[10px] bg-mm-brand p-3">
                <span className="rounded-[3px] bg-white/25" />
                <span className="rounded-[3px] bg-mm-coral" />
                <span className="rounded-[3px] bg-white/25" />
                <span className="rounded-[3px] bg-white/55" />
              </span>

              {HERO_PLATES.slice(2).map((presentation) => (
                <SubjectPlate
                  key={presentation.label}
                  presentation={presentation}
                  className="aspect-square rounded-[10px]"
                  markClassName="h-7 w-7"
                />
              ))}
            </div>
          </div>
        </section>

        <div className="site-width pt-6">
          <ActiveSessionBanner />
        </div>

        {/*
          A real heading rather than the aria-label this section used to
          carry. Every program card is an h3, so with nothing between them
          and the page title the outline jumped h1 -> h3 (axe's
          heading-order, and the reason a screen-reader user tabbing by
          heading heard fifteen program names with no idea what they were a
          list of). It also gives "Planned programs" at the foot of the page
          something to be the opposite of.
        */}
        <section aria-labelledby="live-programs-heading" className="site-width py-8 sm:py-10">
          <h2
            id="live-programs-heading"
            className="mb-5 text-[clamp(22px,2.4vw,30px)] font-bold leading-[1.2] text-mm-ink"
          >
            Ready to sit today
          </h2>
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
