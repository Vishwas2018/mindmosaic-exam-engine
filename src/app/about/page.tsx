import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell } from "@/features/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "About",
  description:
    "What MindMosaic is, who it's built for, and why every question is written from scratch.",
};

export default function AboutPage() {
  return (
    <LegalPageShell title="About MindMosaic" lastUpdated="29 July 2026">
      <p>
        MindMosaic is a practice platform for Grade 3 and Grade 5 students,
        built around original NAPLAN-style and ICAS-style questions. It
        started as a way to give a small number of Australian families
        genuinely original practice content — not a repackaging of past
        official papers — with instant feedback and a clear sense of which
        skills a child has and hasn&apos;t mastered yet.
      </p>

      <h2>Who it&apos;s for</h2>
      <p>
        MindMosaic is built for Grade 3 and Grade 5 students preparing for
        NAPLAN-style or ICAS-style assessments, and for the parents who want
        to see more than a single mark — which skills are solid and which
        need more practice. A child can practise as a guest with no account
        at all; a parent account adds a dashboard with skill-by-skill
        breakdowns for their own children.
      </p>

      <h2>The originality commitment</h2>
      <p>
        Every question on MindMosaic is written from scratch for
        MindMosaic. None are copied or adapted from an official NAPLAN or
        ICAS paper — &quot;NAPLAN-style&quot; and &quot;ICAS-style&quot;
        describe the format and difficulty the question is modelled on, not
        its source. MindMosaic is not affiliated with, endorsed by, or
        administered by ACARA (which administers NAPLAN) or the owner of
        the ICAS trademark.
      </p>

      <h2>What&apos;s live today</h2>
      <p>
        Today MindMosaic covers Numeracy, Reading and Language Conventions
        for Grade 3 and Grade 5, in both NAPLAN-style and ICAS-style
        formats, with instant scoring and worked explanations after every
        question. Guest practice is free and always will be — an account is
        only needed for a parent who wants progress tracked across
        sessions. See{" "}
        <Link href="/#subjects">what&apos;s available today</Link> on the
        home page.
      </p>

      <h2>Where this is heading</h2>
      <p>
        MindMosaic is genuinely early: a personal-use project being built
        out into a real product, not a funded company with a large team.
        We&apos;d rather say a feature doesn&apos;t exist yet than describe
        one that isn&apos;t built — that&apos;s true of this page as much
        as anywhere else on the site.
      </p>

      <h2>Questions</h2>
      <p>
        If you want to know more, <Link href="/contact">get in touch</Link>.
      </p>
    </LegalPageShell>
  );
}
