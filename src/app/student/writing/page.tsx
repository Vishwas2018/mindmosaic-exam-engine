import type { Metadata } from "next";
import Link from "next/link";

import { WRITING_BACK_LINK_CLASS, WritingPageShell } from "@/features/writing/components/WritingPageShell";
import { WritingResultsList } from "@/features/writing/components/WritingResultsList";
import { listWritingTasks } from "@/features/writing/task";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { loadWritingHistory } from "@/server/writing/queries";

export const metadata: Metadata = { title: "Writing practice" };
export const dynamic = "force-dynamic";

/**
 * Writing tasks a child can sit, and their own marks over time. Role and
 * subscription gating happen in src/app/student/layout.tsx. Until a task has
 * been approved the list is empty and says so; nothing here is a placeholder
 * for content that does not exist.
 */
export default async function StudentWritingPage() {
  const tasks = listWritingTasks();
  const taskTitles = Object.fromEntries(tasks.map((task) => [task.id, task.title]));

  const history = isSupabaseConfigured ? await loadWritingHistory(await createClient()) : [];

  return (
    <WritingPageShell back={<Link href="/student" className={WRITING_BACK_LINK_CLASS}>Back to my dashboard</Link>}>
      <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink">Writing practice</h1>

      <section aria-labelledby="writing-tasks" className="mt-6">
        <h2 id="writing-tasks" className="text-lg font-extrabold text-ink">
          Tasks
        </h2>
        {tasks.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-royal/20 p-5 text-muted">
            No writing tasks are ready yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/writing/sit/${task.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-royal/10 bg-white p-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
                >
                  <span className="font-extrabold text-ink">{task.title}</span>
                  <span className="text-sm text-muted">{task.timeLimitMinutes} minutes</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="writing-results" className="mt-8">
        <h2 id="writing-results" className="text-lg font-extrabold text-ink">
          My writing and marks
        </h2>
        <div className="mt-3">
          <WritingResultsList
            items={history}
            taskTitles={taskTitles}
            emptyText="When you hand in a piece of writing, it will appear here with its marks."
          />
        </div>
      </section>
    </WritingPageShell>
  );
}
