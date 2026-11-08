import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ParentShell } from "@/features/parent-dashboard";
import { WritingResultsList } from "@/features/writing/components/WritingResultsList";
import { listWritingTasks } from "@/server/writing/tasks";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { loadWritingHistory } from "@/server/writing/queries";

export const metadata: Metadata = {
  title: "Child Writing Practice | MindMosaic",
  description: "Mark your child's written responses against the official rubric.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ChildWritingPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;

  if (!isSupabaseConfigured) redirect("/parent");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Load child profile to verify relationship and display name
  const { data: childProfile, error: childError } = await supabase
    .from("profiles")
    .select("id, display_name, year_level")
    .eq("id", childId)
    .single();

  if (childError || !childProfile) {
    redirect("/parent/children");
  }

  const childName = childProfile.display_name?.trim() || "Your child";
  const tasks = listWritingTasks();
  const taskTitles = Object.fromEntries(tasks.map((task) => [task.id, task.title]));
  const history = await loadWritingHistory(supabase, {
    studentIds: [childId],
    submittedOnly: true,
  });

  return (
    <ParentShell active="/parent/children">
      <div className="space-y-6">
        <div>
          <Link
            href="/parent/children"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted transition hover:text-royal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Children
          </Link>
          <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">
                {childName}&apos;s Writing Practice
              </h1>
              <p className="mt-1 text-sm text-muted">
                Score your child&apos;s writing against the standardized rubric. MindMosaic does not generate automated grades for open writing.
              </p>
            </div>
          </div>
        </div>

        {/* Paper Response Action Card */}
        <div className="rounded-2xl border border-royal/10 bg-white p-5 shadow-sm">
          <h2 className="text-base font-extrabold text-ink">Completed on paper?</h2>
          <p className="mt-1 text-sm text-muted">
            Score the sheet directly using the rubric. There is no need to type the student&apos;s writing into the computer.
          </p>
          <Link
            href="/writing/mark/new"
            data-testid="mark-paper-link"
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-royal px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-royal/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/30"
          >
            Mark a paper response
          </Link>
        </div>

        {/* Child Writing History */}
        <section aria-labelledby="writing-history-heading">
          <h2 id="writing-history-heading" className="text-lg font-extrabold text-ink">
            Handed-in Responses
          </h2>
          <div className="mt-3">
            <WritingResultsList
              items={history}
              taskTitles={taskTitles}
              markHref={(attemptId) => `/writing/mark/${attemptId}`}
              emptyText={`${childName} hasn't handed in any writing yet.`}
            />
          </div>
        </section>
      </div>
    </ParentShell>
  );
}
