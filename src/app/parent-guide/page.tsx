import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell } from "@/features/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Parent Guide",
  description: "How to read your child's progress on MindMosaic, and how practice is structured.",
};

export default function ParentGuidePage() {
  return (
    <LegalPageShell title="Parent Guide" lastUpdated="29 July 2026">
      <p>
        This page explains what the parent dashboard actually shows and
        how a practice session is put together, so a mark on a screen means
        something concrete.
      </p>

      <h2>How practice is structured</h2>
      <p>
        Every practice session is a combination of four choices: year level
        (Grade 3 or Grade 5), exam style (NAPLAN-style or ICAS-style),
        subject (Numeracy, Reading or Language Conventions — or a mixed set
        covering more, including writing tasks), and length (10, 20 or 30
        questions, or a full set). Sessions can be timed or untimed. A
        parent can also skip the choices entirely and start one of the
        pre-built programs from the practice catalogue.
      </p>

      <h2>How a session is scored</h2>
      <p>
        Most question types are scored automatically the moment your child
        submits — no waiting. Every answer, right or wrong, comes with a
        worked explanation so a mistake becomes something to learn from
        rather than just a lost point. A small number of open-ended
        question types (currently: essay-style responses) are reviewed by
        a teacher rather than scored automatically.
      </p>

      <h2>Reading the dashboard</h2>
      <p>The parent dashboard is built around three things:</p>
      <ul>
        <li>
          <strong>A skill-by-skill breakdown, not just a subject score.</strong>{" "}
          Two children can both score 70% on a Numeracy set for very
          different reasons — the breakdown shows which specific skills
          were strong and which need more practice, instead of averaging
          that difference away.
        </li>
        <li>
          <strong>Session history.</strong> Every attempt a child completes
          while signed in is kept, so you can see whether a skill is
          actually improving over several sessions rather than judging from
          one result.
        </li>
        <li>
          <strong>One dashboard per family, one profile per child.</strong>{" "}
          If you have more than one child, each has their own login and
          their own history — nothing is mixed between siblings.
        </li>
      </ul>

      <h2>What the dashboard won&apos;t do</h2>
      <p>
        It won&apos;t compare your child to other students, and it
        won&apos;t predict a NAPLAN or ICAS result — MindMosaic is
        independent practice, not a diagnostic or predictive tool, and we
        don&apos;t want the dashboard to imply otherwise. It shows what
        your child has actually practised and how they went.
      </p>

      <h2>Related pages</h2>
      <p>
        <Link href="/help">Adding a child and PIN sign-in</Link> ·{" "}
        <Link href="/student-tips">Tips for your child</Link> ·{" "}
        <Link href="/privacy">How we handle your family&apos;s data</Link>
      </p>
    </LegalPageShell>
  );
}
