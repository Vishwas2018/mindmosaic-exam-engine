import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { RubricMarkForm } from "@/features/writing/components/RubricMarkForm";
import { WRITING_BACK_LINK_CLASS, WritingPageShell } from "@/features/writing/components/WritingPageShell";
import { resolveWritingRubric, resolveWritingTask, listWritingTasks } from "@/features/writing/task";
import { scholarshipWrittenExpressionRubric } from "@/features/writing/rubrics/scholarship-written-expression";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { loadLinkedChildren, loadWritingAttempt } from "@/server/writing/queries";

export const metadata: Metadata = { title: "Mark writing", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * The marking screen. The attempt is read through RLS as the signed-in parent,
 * so an attempt belonging to a child they are not linked to simply is not
 * there, and this is the same 404 as one that never existed.
 */
export default async function ParentMarkWritingPage({ params }: { params: Promise<{ attemptId: string }> }) {
  if (!isSupabaseConfigured) notFound();
  const { attemptId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const found = await loadWritingAttempt(supabase, attemptId);
  if (!found || !found.attempt.submittedAt) notFound();

  const children = await loadLinkedChildren(supabase, user.id);
  const child = children.find((candidate) => candidate.id === found.studentId);
  if (!child) notFound();

  const task = resolveWritingTask(found.attempt.taskId);
  const rubric =
    (found.mark ? resolveWritingRubric(found.mark.rubricId, found.mark.rubricVersion) : null) ??
    (task ? resolveWritingRubric(task.rubricId) : null) ??
    scholarshipWrittenExpressionRubric;

  const initial = found.mark
    ? {
        scores: Object.fromEntries(found.mark.criteria.map((criterion) => [criterion.criterionId, criterion.score])),
        comments: Object.fromEntries(
          found.mark.criteria.filter((criterion) => criterion.comment).map((criterion) => [criterion.criterionId, criterion.comment as string]),
        ),
        feedback: found.mark.feedback,
      }
    : null;
  const taskTitle = (task ?? listWritingTasks().find((candidate) => candidate.id === found.attempt.taskId))?.title ?? "Writing task";

  return (
    <WritingPageShell back={<Link href="/parent/writing" className={WRITING_BACK_LINK_CLASS}>Back to writing</Link>}>
      <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink">Mark {child.name}&apos;s writing</h1>
      <p className="mt-1 text-muted">{taskTitle}</p>

      {task ? (
        <details className="mt-4 rounded-2xl border border-royal/10 bg-white p-4">
          <summary className="cursor-pointer font-bold text-royal">The task</summary>
          <p className="mt-2 whitespace-pre-line text-ink">{task.prompt}</p>
        </details>
      ) : null}

      <section aria-labelledby="response-heading" className="mt-4 rounded-2xl border border-royal/10 bg-white p-5">
        <h2 id="response-heading" className="text-sm font-bold uppercase tracking-wide text-muted">
          {found.attempt.responseSource === "parent_typed" ? "Typed in by a parent from paper" : "Written on screen"}
        </h2>
        <p data-testid="response-text" className="mt-2 whitespace-pre-wrap text-lg leading-8 text-ink">
          {found.attempt.responseText || "(No writing was handed in.)"}
        </p>
      </section>

      <div className="mt-6">
        <RubricMarkForm rubric={rubric} attemptId={found.attempt.id} initial={initial} backHref="/parent/writing" />
      </div>
    </WritingPageShell>
  );
}
