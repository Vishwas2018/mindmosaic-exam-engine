import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ChildLearningHub,
  ParentShell,
  PREVIEW_CHILDREN,
  PREVIEW_PROGRAMMES_YEAR3,
  PREVIEW_PROGRAMMES_YEAR5,
  type ChildSwitcherItem,
  type ProgrammeAvailability,
} from "@/features/parent-dashboard";
import { loadChildLoginCode } from "@/features/parent-dashboard/child-access";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getExamBank } from "@/server/exam-bank";

export const metadata: Metadata = {
  title: "Child Learning Hub | MindMosaic Parents",
  description: "Explore available practice sets and programmes aligned with your child's year level.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface ChildLearningPageProps {
  params: Promise<{ childId: string }>;
}

export default async function ChildLearningPage({ params }: ChildLearningPageProps) {
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

      const programmes =
        previewChild.yearLevel === 5
          ? PREVIEW_PROGRAMMES_YEAR5
          : PREVIEW_PROGRAMMES_YEAR3;

      return (
        <ParentShell active="/parent/children">
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs font-medium text-amber-900">
              <strong className="font-bold">Preview Demonstration:</strong> Showing sample learning programmes for {previewChild.firstName}. No live database connection is active.
            </div>
            <ChildLearningHub
              child={{
                id: previewChild.id,
                displayName: previewChild.firstName,
                yearLevel: previewChild.yearLevel,
                loginCode: previewChild.loginCode,
              }}
              siblings={siblings}
              programmes={programmes}
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
    .select("id, display_name, year_level, student_login_code")
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

  const year = profile.year_level ?? 3;

  // Query published exam bank to determine actual question counts
  const publishedQuestions = getExamBank("published");
  const yearQuestions = publishedQuestions.filter((q) => q.yearLevel === year);

  const numeracyCount = yearQuestions.filter((q) => q.metadata.subject === "numeracy").length;
  const readingCount = yearQuestions.filter((q) => q.metadata.subject === "reading").length;
  const conventionsCount = yearQuestions.filter((q) => q.metadata.subject === "language_conventions").length;

  const programmes: ProgrammeAvailability[] = [
    {
      id: `naplan-numeracy-y${year}`,
      title: "NAPLAN-style Numeracy",
      subject: "numeracy",
      status: numeracyCount > 0 ? "ready" : "not_written",
      questionCountEstimated: numeracyCount > 0 ? numeracyCount : undefined,
      setSizesDescription: "sets of 10, 20 or a full paper",
    },
    {
      id: `naplan-reading-y${year}`,
      title: "NAPLAN-style Reading",
      subject: "reading",
      status: readingCount > 0 ? "ready" : "not_written",
      questionCountEstimated: readingCount > 0 ? readingCount : undefined,
      setSizesDescription: "sets of 10 or 20",
    },
    {
      id: `naplan-conventions-y${year}`,
      title: "NAPLAN-style Language conventions",
      subject: "language_conventions",
      status: conventionsCount > 0 ? "ready" : "not_written",
      questionCountEstimated: conventionsCount > 0 ? conventionsCount : undefined,
      setSizesDescription: "sets of 10 or 20",
    },
    {
      id: `icas-science-y${year}`,
      title: "ICAS-style Science",
      subject: "science",
      status: "not_written",
      description: `There are no questions for this one at Year ${year} yet. It is not hidden from you, and it is not coming this term.`,
    },
    {
      id: `icas-digital-tech-y${year}`,
      title: "ICAS-style Digital Technologies",
      subject: "digital_technologies",
      status: "could_not_check",
      description: "We could not work out what is available here just now. There may be plenty or there may be none — we are not going to guess. Try again shortly.",
    },
  ];

  const realLoginCode = await loadChildLoginCode(childId);

  return (
    <ParentShell active="/parent/children">
      <ChildLearningHub
        child={{
          id: profile.id as string,
          displayName: (profile.display_name as string) ?? "Child",
          yearLevel: profile.year_level as number | null,
          loginCode: realLoginCode ?? (profile.student_login_code as string) ?? "—",
        }}
        siblings={siblings}
        programmes={programmes}
        isLocalPreview={false}
      />
    </ParentShell>
  );
}
