import type { Metadata } from "next";
import Link from "next/link";

import { AppFooter } from "@/components/shell/AppFooter";
import { AppHeader } from "@/components/shell/AppHeader";
import { EYEBROW_CLASSES } from "@/features/catalogue/components/controls";
import { ActiveSessionBanner } from "@/features/exam-engine/components/ActiveSessionBanner";
import { groupExamPatterns } from "@/features/exam-engine/exam-patterns";
import { ExamPatternCard } from "@/features/exam-engine/exam-patterns/components/ExamPatternCard";
import { EXAM_STYLE_NAMES } from "@/features/exam-engine/exam-patterns/pattern-presentation";
import { getPatternReadiness } from "@/server/exam-bank";

export const metadata: Metadata = {
  title: "Full-length practice papers",
  description:
    "Sit a full-length NAPLAN-style or ICAS-style practice paper for Year 3 or Year 5 — the same number of questions and the same time limit as the real assessment. Practice written by MindMosaic, not official papers.",
};

/**
 * The full-length practice paper picker.
 *
 * Grouped year level → assessment → subject, which is the order a parent or
 * child narrows down: "she's in Year 5", "she's sitting ICAS", "maths". A flat
 * list of twenty papers would make them read every heading to find one.
 *
 * Readiness is computed server-side from the gated bank, by running the real
 * selection (see pattern-readiness.ts) — so a card that says "Ready to sit"
 * has had its sub-quotas and stimulus groups actually satisfied, not just its
 * totals counted. Counts only reach the client; no question content and no
 * answer key is in this page's payload.
 *
 * Nothing on this page calls a paper official, real, or a simulation. The
 * standing wording is "full-length practice", the disclaimer is linked from
 * the top of the page, and every paper carries its own adaptations note one
 * click away on its own route.
 */
export default function ExamPatternPickerPage() {
  const readiness = getPatternReadiness();
  const groups = groupExamPatterns();

  return (
    <div className="mm-root flex min-h-screen flex-col bg-mm-page">
      <AppHeader />

      <main id="main-content" className="flex-1">
        <section className="border-b border-mm-line bg-white">
          <div className="site-width py-[clamp(28px,3.2vw,44px)]">
            <p className={EYEBROW_CLASSES}>
              <span
                aria-hidden="true"
                className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral"
              />
              Full-length practice
            </p>
            <h1 className="mt-5 max-w-[18ch] text-[clamp(30px,3.4vw,44px)] font-bold leading-[1.08] tracking-[-0.035em] text-mm-ink">
              Sit a whole paper, start to finish
            </h1>
            <p className="mt-4 max-w-[62ch] text-pretty text-[clamp(16px,1.3vw,17.5px)] leading-[1.6] text-mm-muted">
              Each paper has the same number of questions and the same time limit as
              the real assessment it is modelled on. Every question is written by
              MindMosaic — these are practice papers, not real NAPLAN or ICAS papers,
              and each one says exactly how it differs.{" "}
              <Link
                href="/assessment-disclaimer"
                className="font-bold text-mm-brand underline underline-offset-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
              >
                Read the assessment disclaimer
              </Link>
              .
            </p>
          </div>
        </section>

        <div className="site-width pt-6">
          <ActiveSessionBanner />
        </div>

        {groups.map((yearGroup) => (
          <section
            key={yearGroup.yearLevel}
            aria-labelledby={`year-${yearGroup.yearLevel}-heading`}
            className="site-width py-8 sm:py-10"
          >
            <h2
              id={`year-${yearGroup.yearLevel}-heading`}
              className="text-[clamp(22px,2.4vw,30px)] font-bold leading-[1.2] text-mm-ink"
            >
              Year {yearGroup.yearLevel}
            </h2>

            {yearGroup.styles.map((styleGroup) => (
              <div key={styleGroup.examStyle} className="mt-6">
                <h3
                  id={`year-${yearGroup.yearLevel}-${styleGroup.examStyle}-heading`}
                  className="text-[17px] font-bold leading-[1.2] text-mm-ink-soft"
                >
                  {EXAM_STYLE_NAMES[styleGroup.examStyle]}
                </h3>
                <ul
                  aria-labelledby={`year-${yearGroup.yearLevel}-${styleGroup.examStyle}-heading`}
                  className="mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {styleGroup.patterns.map((pattern) => (
                    <li key={pattern.id}>
                      <ExamPatternCard
                        pattern={pattern}
                        readiness={readiness[pattern.id]!}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}

        <div className="site-width pb-16 sm:pb-20">
          <p className="rounded-[20px] border border-dashed border-mm-line-quiet bg-white/60 p-[clamp(20px,2.4vw,32px)] text-[14.5px] leading-[1.6] text-mm-muted">
            Want to choose the subject and length yourself instead?{" "}
            <Link
              href="/practice"
              className="font-bold text-mm-brand underline underline-offset-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
            >
              Browse the practice programs
            </Link>
            .
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
