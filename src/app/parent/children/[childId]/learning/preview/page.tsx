import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ParentPracticePreview,
  ParentShell,
  PREVIEW_CHILDREN,
  PREVIEW_PROGRAMMES_YEAR3,
  PREVIEW_PROGRAMMES_YEAR5,
  PREVIEW_SAMPLE_QUESTIONS_NUMERACY,
  PREVIEW_SAMPLE_QUESTIONS_READING,
  type PreviewSampleQuestion,
} from "@/features/parent-dashboard";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getExamBank } from "@/server/exam-bank";

export const metadata: Metadata = {
  title: "Practice Set Preview | MindMosaic Parents",
  description: "Preview sample practice questions without creating attempts or changing student records.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PracticePreviewPageProps {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ programme?: string }>;
}

export default async function PracticePreviewPage({
  params,
  searchParams,
}: PracticePreviewPageProps) {
  const { childId } = await params;
  const { programme: programmeParam } = await searchParams;

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

      const allProgrammes = [
        ...PREVIEW_PROGRAMMES_YEAR3,
        ...PREVIEW_PROGRAMMES_YEAR5,
      ];

      const programme =
        allProgrammes.find((p) => p.id === programmeParam) ??
        PREVIEW_PROGRAMMES_YEAR3[0];

      const sampleQuestions: PreviewSampleQuestion[] =
        programme.subject === "reading"
          ? PREVIEW_SAMPLE_QUESTIONS_READING
          : PREVIEW_SAMPLE_QUESTIONS_NUMERACY;

      return (
        <ParentShell active="/parent/children">
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs font-medium text-amber-900">
              <strong className="font-bold">Preview Demonstration:</strong> Showing sample question preview for {programme.title}. No live database connection is active.
            </div>
            <ParentPracticePreview
              child={{
                id: previewChild.id,
                displayName: previewChild.firstName,
                yearLevel: previewChild.yearLevel,
              }}
              programme={programme}
              sampleQuestions={sampleQuestions}
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
  const isReading = (programmeParam ?? "").includes("reading");
  const subjectKey = isReading ? "reading" : "numeracy";
  const title = isReading ? "NAPLAN-style Reading" : "NAPLAN-style Numeracy";

  // Select sample questions from published bank (zero answer keys exposed)
  const publishedQuestions = getExamBank("published");
  const filteredQuestions = publishedQuestions.filter(
    (q) => q.yearLevel === year && q.metadata.subject === subjectKey,
  );

  const sampleQuestions: PreviewSampleQuestion[] =
    filteredQuestions.length > 0
      ? filteredQuestions.slice(0, 3).map((q) => ({
          id: q.id,
          prompt: q.prompt,
          options: q.options?.map((opt) => opt.text) ?? ["Option A", "Option B", "Option C", "Option D"],
          correctIndex: 0,
        }))
      : isReading
        ? PREVIEW_SAMPLE_QUESTIONS_READING
        : PREVIEW_SAMPLE_QUESTIONS_NUMERACY;

  return (
    <ParentShell active="/parent/children">
      <ParentPracticePreview
        child={{
          id: profile.id as string,
          displayName: (profile.display_name as string) ?? "Child",
          yearLevel: profile.year_level as number | null,
        }}
        programme={{
          id: programmeParam ?? `naplan-${subjectKey}-y${year}`,
          title,
          subject: subjectKey,
        }}
        sampleQuestions={sampleQuestions}
        isLocalPreview={false}
      />
    </ParentShell>
  );
}
