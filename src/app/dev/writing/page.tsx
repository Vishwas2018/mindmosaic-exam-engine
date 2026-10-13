import Link from "next/link";

import { DEV_FIXTURE_WRITING_TASK } from "@/features/writing/task";
import { scholarshipWrittenExpressionRubric } from "@/features/writing/rubrics/scholarship-written-expression";

/**
 * A walkthrough of the whole writing flow with seeded local accounts. It shows
 * no secrets: sign-in values come from your own .env.e2e.local.
 */
export default function WritingPreviewPage() {
  const task = DEV_FIXTURE_WRITING_TASK;
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-[-0.025em] text-ink">Writing practice: dev preview</h1>
        <p className="mt-2 text-muted">
          Internal QA page. It is a 404 in production and on any Vercel production deployment. The fixture task below is
          not one of the draft prompts and is never shown to children outside this preview.
        </p>
      </header>

      <section aria-labelledby="seed" className="space-y-2">
        <h2 id="seed" className="text-xl font-extrabold text-ink">
          1. Seed a test child and parent
        </h2>
        <p className="text-ink">
          With a local Supabase running and <code>.env.e2e.local</code> filled in, run <code>npm run e2e:seed</code>. Then:
        </p>
        <ul className="list-disc space-y-1 pl-6 text-ink">
          <li>
            Child: sign in at <Link className="font-bold text-royal underline" href="/student-sign-in">/student-sign-in</Link>{" "}
            with login code <code>E2STUD01</code> and <code>E2E_FIXTURE_STUDENT_PIN</code>.
          </li>
          <li>
            Parent of that child: <code>parent-one-child@e2e.mindmosaic.local</code> at{" "}
            <Link className="font-bold text-royal underline" href="/sign-in">/sign-in</Link> with{" "}
            <code>E2E_FIXTURE_PASSWORD</code>.
          </li>
          <li>
            A parent who is <em>not</em> linked to that child (to see the denial): <code>parent-multi-children@e2e.mindmosaic.local</code>.
          </li>
        </ul>
        <p className="text-sm text-muted">
          The app must be started with <code>WRITING_PREVIEW_ENABLED=1</code> if it is a production build.
        </p>
      </section>

      <section aria-labelledby="flow" className="space-y-2">
        <h2 id="flow" className="text-xl font-extrabold text-ink">
          2. Try the flow
        </h2>
        <ol className="list-decimal space-y-2 pl-6 text-ink">
          <li>
            <Link className="font-bold text-royal underline" href="/dev/writing/print">Print preview</Link>: the A4 prompt and ruled sheet.
          </li>
          <li>
            As the child: <Link className="font-bold text-royal underline" href={`/student/writing/${task.id}`}>the timed task</Link>. Choose
            timed on screen, or untimed.
          </li>
          <li>
            As the parent: <Link className="font-bold text-royal underline" href="/parent/writing">add a paper response or mark a hand-in</Link>.
          </li>
          <li>
            As the child again: <Link className="font-bold text-royal underline" href="/student/writing">see the marks</Link>.
          </li>
        </ol>
      </section>

      <section aria-labelledby="task" className="space-y-2">
        <h2 id="task" className="text-xl font-extrabold text-ink">
          Fixture task
        </h2>
        <p className="rounded-2xl border border-royal/10 bg-white p-4 text-ink">{task.prompt}</p>
        <p className="text-sm text-muted">
          {task.timeLimitMinutes} minutes · rubric &ldquo;{scholarshipWrittenExpressionRubric.title}&rdquo; ({scholarshipWrittenExpressionRubric.criteria.length} criteria,{" "}
          {scholarshipWrittenExpressionRubric.scaleMin}-{scholarshipWrittenExpressionRubric.scaleMax}).
        </p>
      </section>
    </main>
  );
}
