import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { WRITING_BACK_LINK_CLASS, WritingPageShell } from "@/features/writing/components/WritingPageShell";
import { WritingRunner } from "@/features/writing/components/WritingRunner";
import { resolveWritingTask } from "@/features/writing/task";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { loadOpenWritingAttempt } from "@/server/writing/queries";

export const metadata: Metadata = { title: "Writing task", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * One writing task. An unknown or unapproved id is a 404 (fail closed). If the
 * child already has an open attempt for it, the page resumes that attempt, with
 * the same server-fixed deadline, instead of offering a fresh clock.
 */
export default async function StudentWritingTaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const task = resolveWritingTask(taskId);
  if (!task || !isSupabaseConfigured) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const initialAttempt = await loadOpenWritingAttempt(supabase, user.id, task.id);

  return (
    <WritingPageShell back={<Link href="/student/writing" className={WRITING_BACK_LINK_CLASS}>Back to writing</Link>}>
      <WritingRunner
        task={task}
        initialAttempt={initialAttempt}
        resultsHref="/student/writing"
        printHref={`/writing/print/${task.id}`}
      />
    </WritingPageShell>
  );
}
