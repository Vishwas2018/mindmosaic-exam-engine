import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { AttemptAnswerReview } from "@/features/parent-dashboard/components/AttemptAnswerReview";
import { requireParentPreview } from "@/features/parent-dashboard/preview-mode";

interface Props {
  params: Promise<{ childId: string; id: string }>;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Answer Review | MindMosaic Parent",
  robots: { index: false, follow: false },
};

export default async function AnswerReviewPage({ params }: Props) {
  // Fixture-only screen: 404 outside explicit local preview.
  await requireParentPreview();

  const { childId, id } = await params;

  return (
    <ParentShell active="/parent/children">
      <AttemptAnswerReview childId={childId} resultId={id} />
    </ParentShell>
  );
}
