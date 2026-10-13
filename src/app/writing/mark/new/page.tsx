import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PaperMarkEntry } from "@/features/writing/components/MarkEntry";
import { WRITING_BACK_LINK_CLASS, WritingPageShell } from "@/features/writing/components/WritingPageShell";
import { scholarshipWrittenExpressionRubric } from "@/features/writing/rubrics/scholarship-written-expression";
import { listWritingTasks, resolveWritingRubric } from "@/features/writing/task";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { loadLinkedChildren } from "@/server/writing/queries";

export const metadata: Metadata = { title: "Mark a paper response", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Marked on paper: the parent scores the six criteria from the sheet in their
 * hand, with no response text required. Gated to parents by the layout above.
 * Which children and tasks are offered is decided by RLS and by the published
 * task list, not by this page.
 */
export default async function MarkPaperResponsePage() {
  if (!isSupabaseConfigured) redirect("/parent");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const children = await loadLinkedChildren(supabase, user.id);
  const tasks = listWritingTasks();
  const rubric = (tasks[0] ? resolveWritingRubric(tasks[0].rubricId) : null) ?? scholarshipWrittenExpressionRubric;

  return (
    <WritingPageShell back={<Link href="/parent/writing" className={WRITING_BACK_LINK_CLASS}>Back to writing</Link>}>
      <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink">Mark a paper response</h1>
      <p className="mt-2 text-muted">
        Score the writing from the sheet. You do not need to type it in. MindMosaic does not mark or comment on
        children&apos;s writing.
      </p>

      <div className="mt-6">
        {children.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-royal/20 p-5 text-muted">
            Link a child to your account to mark their writing.
          </p>
        ) : tasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-royal/20 p-5 text-muted">No writing tasks are ready yet.</p>
        ) : (
          <PaperMarkEntry
            rubric={rubric}
            linkedChildren={children}
            tasks={tasks.map((task) => ({ id: task.id, title: task.title }))}
            backHref="/parent/writing"
          />
        )}
      </div>
    </WritingPageShell>
  );
}
