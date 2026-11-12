import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ParentShell } from "@/features/parent-dashboard";
import { WritingResultsList } from "@/features/writing/components/WritingResultsList";
import { listWritingTasks } from "@/server/writing/tasks";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { loadLinkedChildren, loadWritingHistory } from "@/server/writing/queries";

export const metadata: Metadata = { title: "Writing practice", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * A parent's view of their linked children's writing: add a response written on
 * paper, mark what has been handed in, and see marks per criterion over time.
 * Role and subscription gating happen in src/app/parent/layout.tsx; which
 * children and attempts appear is decided by RLS, not by this page.
 *
 * Preserves legacy route compatibility across all linked children.
 * Does not redirect child-specific pages to an arbitrary child's account.
 */
export default async function ParentWritingPage() {
  if (!isSupabaseConfigured) {
    redirect("/parent");
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
    return null;
  }

  const tasks = listWritingTasks();
  const taskTitles = Object.fromEntries(tasks.map((task) => [task.id, task.title]));
  const children = await loadLinkedChildren(supabase, user.id);
  const history = await loadWritingHistory(supabase, { studentIds: children.map((child) => child.id), submittedOnly: true });

  return (
    <ParentShell active="/parent/children">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">Writing practice</h1>
          <p className="mt-2 text-muted">
            You mark your child&apos;s writing against a simple rubric. MindMosaic does not mark or comment on children&apos;s
            writing.
          </p>
        </div>

        {children.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-royal/20 p-5 text-muted">
            Link a child to your account to see their writing here.
          </p>
        ) : (
          <div className="space-y-8">
            <div className="rounded-2xl border border-royal/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold text-ink">Sat it on paper?</h2>
              <p className="mt-1 text-sm text-muted">
                Score the sheet straight away. You do not need to type the writing in.
              </p>
              <Link
                href="/writing/mark/new"
                data-testid="mark-paper-link"
                className="mt-3 inline-block rounded-xl bg-royal px-4 py-2 text-sm font-extrabold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/30"
              >
                Mark a paper response
              </Link>
            </div>
            {children.map((child) => (
              <section key={child.id} aria-labelledby={`child-${child.id}`} className="rounded-2xl border border-royal/10 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-royal/10">
                  <h2 id={`child-${child.id}`} className="text-lg font-extrabold text-ink">
                    {child.name}
                  </h2>
                  <Link
                    href={`/parent/children/${child.id}/writing`}
                    className="text-xs font-bold text-royal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/20 rounded"
                  >
                    View {child.name}&apos;s dedicated page &rarr;
                  </Link>
                </div>
                <div className="mt-3">
                  <WritingResultsList
                    items={history.filter((item) => item.studentId === child.id)}
                    taskTitles={taskTitles}
                    markHref={(attemptId) => `/writing/mark/${attemptId}`}
                    emptyText={`${child.name} hasn't handed in any writing yet.`}
                  />
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </ParentShell>
  );
}
