import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ChildWritingHistory,
  ParentShell,
  PREVIEW_CHILDREN,
  type WritingPromptItem,
  type WritingSubmissionItem,
} from "@/features/parent-dashboard";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { loadWritingHistory } from "@/server/writing/queries";
import { listWritingTasks } from "@/server/writing/tasks";

export const metadata: Metadata = {
  title: "Child Writing Practice | MindMosaic Parents",
  description: "Mark your child's written practice against the official rubric.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface ChildWritingPageProps {
  params: Promise<{ childId: string }>;
}

export default async function ChildWritingPage({ params }: ChildWritingPageProps) {
  const { childId } = await params;

  // Local loopback preview demonstration mode
  if (!isSupabaseConfigured) {
    if (await isParentPreviewEnabled()) {
      const previewChild =
        PREVIEW_CHILDREN.find(
          (c) => c.id === childId || c.firstName.toLowerCase() === childId.toLowerCase(),
        ) ?? PREVIEW_CHILDREN[0];

      if (!previewChild) {
        notFound();
      }

      const sampleSubmissions: WritingSubmissionItem[] = [
        {
          id: "preview-sub-1",
          taskId: "the-lost-key",
          taskTitle: "Narrative Writing — The Lost Key",
          genre: "narrative",
          submittedAt: "Yesterday at 4:15 pm",
          status: "pending_parent_review",
        },
        {
          id: "preview-sub-2",
          taskId: "school-uniforms",
          taskTitle: "Persuasive Writing — School Uniforms",
          genre: "persuasive",
          submittedAt: "3 Nov 2026",
          status: "marked",
          marksEarned: 38,
          marksAvailable: 48,
        },
      ];

      const samplePrompts: WritingPromptItem[] = [
        {
          id: "prompt-1",
          title: "The Mystery Box",
          genre: "narrative",
          prompt:
            "Imagine you found an old wooden box hidden at the back of a cupboard. Write a narrative about what was inside and what happened next.",
        },
        {
          id: "prompt-2",
          title: "Weekend Homework",
          genre: "persuasive",
          prompt:
            "Should primary students have homework on weekends? Write a persuasive text giving your reasons and convincing the reader.",
        },
      ];

      return (
        <ParentShell active="/parent/children">
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs font-medium text-amber-900">
              <strong className="font-bold">Preview Demonstration:</strong> Showing sample writing submissions and prompts for {previewChild.firstName}. No live database connection is active.
            </div>
            <ChildWritingHistory
              child={{
                id: previewChild.id,
                displayName: previewChild.firstName,
                yearLevel: previewChild.yearLevel,
              }}
              submissions={sampleSubmissions}
              availablePrompts={samplePrompts}
              isLocalPreview={true}
            />
          </div>
        </ParentShell>
      );
    }

    return (
      <ParentShell active="/parent/children">
        <div className="p-8 text-center text-muted">
          <p className="font-bold text-ink">Database Not Configured</p>
          <p className="mt-2 text-sm">{SUPABASE_NOT_CONFIGURED_MESSAGE}</p>
        </div>
      </ParentShell>
    );
  }

  // Authenticated Production/Dev Mode with Supabase
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Verification of parent ownership
  const { data: link, error: linkError } = await supabase
    .from("parent_children")
    .select("child_id")
    .eq("parent_id", user.id)
    .eq("child_id", childId)
    .maybeSingle();

  if (linkError || !link) {
    notFound();
  }

  // Load child profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, year_level")
    .eq("id", childId)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  const year = profile.year_level ?? 3;

  // Load writing tasks
  const allTasks = listWritingTasks();
  const yearTasks = allTasks.filter((t) => t.yearLevel === year);
  const taskMap = new Map(allTasks.map((t) => [t.id, t]));

  const availablePrompts: WritingPromptItem[] = yearTasks.map((t) => ({
    id: t.id,
    title: t.title,
    genre: t.form === "persuasive" ? "persuasive" : "narrative",
    prompt: t.prompt,
  }));

  // Load child writing history
  const history = await loadWritingHistory(supabase, {
    studentIds: [childId],
    submittedOnly: true,
  });

  const submissions: WritingSubmissionItem[] = history.map((item) => {
    const task = taskMap.get(item.attempt.taskId);
    const title = task?.title ?? "Writing Response";
    const genre: "narrative" | "persuasive" =
      task?.form === "persuasive" ? "persuasive" : "narrative";

    const isMarked = item.mark !== null;
    const submittedDateStr = item.attempt.submittedAt
      ? new Date(item.attempt.submittedAt).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Submitted";

    return {
      id: item.attempt.id,
      taskId: item.attempt.taskId,
      taskTitle: title,
      genre,
      submittedAt: submittedDateStr,
      status: isMarked ? "marked" : "pending_parent_review",
      marksEarned: item.mark?.awardedMarks,
      marksAvailable: item.mark?.maxMarks ?? 48,
    };
  });

  return (
    <ParentShell active="/parent/children">
      <ChildWritingHistory
        child={{
          id: profile.id as string,
          displayName: (profile.display_name as string) ?? "Child",
          yearLevel: profile.year_level as number | null,
        }}
        submissions={submissions}
        availablePrompts={availablePrompts}
        isLocalPreview={false}
      />
    </ParentShell>
  );
}
