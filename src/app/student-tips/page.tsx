import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell } from "@/features/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Student Tips",
  description: "Short, simple tips for Grade 3 and Grade 5 students practising on MindMosaic.",
};

export default function StudentTipsPage() {
  return (
    <LegalPageShell title="Tips for Students" lastUpdated="29 July 2026">
      <p>
        A few short tips for practising on MindMosaic — written for Grade 3
        and Grade 5 students.
      </p>

      <h2>Before you start</h2>
      <ul>
        <li>Find a quiet spot where you won&apos;t be interrupted.</li>
        <li>
          Pick a subject you want to get better at — you don&apos;t have to
          do everything in one go.
        </li>
        <li>
          If you&apos;re not sure how long to practise for, start with 10
          questions. You can always do more after.
        </li>
      </ul>

      <h2>While you&apos;re answering</h2>
      <ul>
        <li>Read the whole question before you pick an answer.</li>
        <li>
          It&apos;s okay to get one wrong — that&apos;s what practice is
          for. Read the explanation after each question so you know why the
          right answer was right.
        </li>
        <li>
          If a question feels hard, take your best guess and keep going.
          You can&apos;t go back and lose marks for trying.
        </li>
      </ul>

      <h2>After you finish</h2>
      <ul>
        <li>
          Look at which questions you got wrong, not just your score — that
          tells you what to practise next.
        </li>
        <li>
          Try the same subject again in a few days. Getting a bit better
          each time matters more than getting everything right once.
        </li>
      </ul>

      <h2>If you get stuck signing in</h2>
      <p>
        Ask the parent who set up your account — they have your login code
        and PIN. If you&apos;ve forgotten them, they can look them up on
        their dashboard.
      </p>

      <p>
        For parents: see the <Link href="/parent-guide">Parent Guide</Link>{" "}
        for how progress and skill breakdowns work.
      </p>
    </LegalPageShell>
  );
}
