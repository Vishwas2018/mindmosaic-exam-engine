import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ChildProgressDashboard,
  ParentShell,
  PREVIEW_CHILDREN,
  PREVIEW_RESULTS_AISHA,
  PREVIEW_RESULTS_KABIR,
  PREVIEW_RESULTS_MAYA,
  PREVIEW_SUBJECTS_AISHA,
  PREVIEW_STRANDS_AISHA,
  PREVIEW_RECOMMENDATION_AISHA,
  type ChildSwitcherItem,
  type PreviewPaperResult,
  type SubjectMarksProgress,
  type StrandMarksProgress,
} from "@/features/parent-dashboard";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { fetchSittingRowsWithIdentity } from "@/server/assessment/read-dispatch";
import type { ExamResult } from "@/features/exam-engine/scoring/exam-report";

export const metadata: Metadata = {
  title: "Child Progress | MindMosaic Parents",
  description: "Detailed subject marks, strand insights, and finished papers history.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface ChildProgressPageProps {
  params: Promise<{ childId: string }>;
}

export default async function ChildProgressPage({ params }: ChildProgressPageProps) {
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

      const siblings: ChildSwitcherItem[] = PREVIEW_CHILDREN.map((c) => ({
        id: c.id,
        name: c.firstName,
        avatarColor: c.avatarColor,
      }));

      let papers: PreviewPaperResult[] = [];
      let subjects: SubjectMarksProgress[] = [];
      let strands: StrandMarksProgress[] = [];
      let suggestion = null;
      let forcedState: "below_floor" | "nothing" | undefined = undefined;

      if (previewChild.id === "child-aisha") {
        papers = PREVIEW_RESULTS_AISHA;
        subjects = PREVIEW_SUBJECTS_AISHA;
        strands = PREVIEW_STRANDS_AISHA;
        suggestion = PREVIEW_RECOMMENDATION_AISHA;
      } else if (previewChild.id === "child-kabir") {
        papers = PREVIEW_RESULTS_KABIR;
        subjects = [
          {
            subject: "numeracy",
            label: "Numeracy",
            marksEarned: 24,
            marksAvailable: 30,
            papersCount: 1,
          },
        ];
        strands = [
          {
            strand: "number_and_algebra",
            label: "Number and algebra",
            subject: "numeracy",
            marksEarned: 16,
            marksAvailable: 18,
            papersCount: 1,
            belowFloor: true,
          },
        ];
        forcedState = "below_floor";
      } else {
        // Maya (paused, 0 papers)
        papers = PREVIEW_RESULTS_MAYA;
        forcedState = "nothing";
      }

      return (
        <ParentShell active="/parent/children">
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs font-medium text-amber-900">
              <strong className="font-bold">Preview Demonstration:</strong> Showing sample progress data for {previewChild.firstName}. No live database connection is active.
            </div>
            <ChildProgressDashboard
              child={{
                id: previewChild.id,
                displayName: previewChild.firstName,
                yearLevel: previewChild.yearLevel,
              }}
              siblings={siblings}
              papers={papers}
              subjects={subjects}
              strands={strands}
              suggestion={suggestion}
              isLocalPreview={true}
              forcedState={forcedState}
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

  // Verify parent link (authorization check)
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

  // Load sibling links for switcher
  const { data: allLinks } = await supabase
    .from("parent_children")
    .select("child_id")
    .eq("parent_id", user.id);

  const siblingIds = (allLinks ?? []).map((l) => l.child_id as string);
  const { data: siblingProfiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", siblingIds)
    .order("display_name", { ascending: true });

  const siblings: ChildSwitcherItem[] = (siblingProfiles ?? []).map((s) => ({
    id: s.id as string,
    name: (s.display_name as string) ?? "Child",
  }));

  // Load attempt sitting rows
  const sittings = await fetchSittingRowsWithIdentity(supabase, {
    studentIds: [childId],
    limit: 500,
  });

  // Transform sitting rows into papers, subjects and strands
  const papers: PreviewPaperResult[] = [];
  const subjectTotals = new Map<string, { label: string; marksEarned: number; marksAvailable: number; papersCount: number }>();
  const strandTotals = new Map<string, { label: string; subject: string; marksEarned: number; marksAvailable: number; papersCount: number }>();

  for (const s of sittings) {
    const row = s.row;
    const result = row.result as ExamResult | null;
    if (!result) continue;

    const paperId = row.id as string;
    const submittedDate = row.submitted_at
      ? new Date(row.submitted_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
      : "Recent";

    const title = (row.session?.config as { title?: string } | null)?.title ?? "Practice Paper";
    const subject = (row.session?.config as { subject?: string } | null)?.subject ?? "numeracy";

    const isAwaiting = (result.manualReviewQuestions ?? 0) > 0;
    papers.push({
      id: paperId,
      childId,
      title,
      subject: subject as "numeracy" | "reading" | "language" | "writing",
      date: submittedDate,
      timed: (result.timeTakenSeconds ?? 0) > 0,
      durationMinutes: Math.round((result.timeTakenSeconds ?? 0) / 60),
      allowedMinutes: 40,
      marksEarned: result.objectiveMarksEarned ?? 0,
      marksAvailable: result.objectiveMarksAvailable ?? 0,
      questionsAnswered: result.attemptedQuestions ?? 0,
      totalQuestions: result.totalQuestions ?? 0,
      pendingQuestions: result.manualReviewQuestions ?? 0,
      pendingMarks: result.pendingManualMarks ?? 0,
      status: isAwaiting ? "awaiting_person" : "finished",
      statusLabel: isAwaiting ? `${result.manualReviewQuestions} awaiting a person` : "Complete",
      strands: [],
    });

    // Aggregate subjects
    if (result.breakdowns?.bySubject) {
      for (const [subKey, rowStats] of Object.entries(result.breakdowns.bySubject)) {
        const cur = subjectTotals.get(subKey) ?? {
          label: subKey.charAt(0).toUpperCase() + subKey.slice(1).replace("_", " "),
          marksEarned: 0,
          marksAvailable: 0,
          papersCount: 0,
        };
        cur.marksEarned += rowStats.objectiveMarksEarned;
        cur.marksAvailable += rowStats.objectiveMarksAvailable;
        cur.papersCount += 1;
        subjectTotals.set(subKey, cur);
      }
    }

    // Aggregate strands (skills)
    if (result.breakdowns?.bySkill) {
      for (const [skillKey, rowStats] of Object.entries(result.breakdowns.bySkill)) {
        const cur = strandTotals.get(skillKey) ?? {
          label: skillKey.charAt(0).toUpperCase() + skillKey.slice(1).replace("_", " "),
          subject,
          marksEarned: 0,
          marksAvailable: 0,
          papersCount: 0,
        };
        cur.marksEarned += rowStats.objectiveMarksEarned;
        cur.marksAvailable += rowStats.objectiveMarksAvailable;
        cur.papersCount += 1;
        strandTotals.set(skillKey, cur);
      }
    }
  }

  const subjectsList: SubjectMarksProgress[] = Array.from(subjectTotals.entries()).map(([sub, stat]) => ({
    subject: sub,
    label: stat.label,
    marksEarned: stat.marksEarned,
    marksAvailable: stat.marksAvailable,
    papersCount: stat.papersCount,
  }));

  const strandsList: StrandMarksProgress[] = Array.from(strandTotals.entries()).map(([strand, stat]) => ({
    strand,
    label: stat.label,
    subject: stat.subject,
    marksEarned: stat.marksEarned,
    marksAvailable: stat.marksAvailable,
    papersCount: stat.papersCount,
    belowFloor: stat.papersCount < 2 || stat.marksAvailable < 8,
  }));

  return (
    <ParentShell active="/parent/children">
      <ChildProgressDashboard
        child={{
          id: profile.id as string,
          displayName: (profile.display_name as string) ?? "Child",
          yearLevel: profile.year_level as number | null,
        }}
        siblings={siblings}
        papers={papers}
        subjects={subjectsList}
        strands={strandsList}
        isLocalPreview={false}
      />
    </ParentShell>
  );
}
