import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { AttemptAnswerReview } from "@/features/parent-dashboard/components/AttemptAnswerReview";

interface Props {
  params: Promise<{ childId: string; id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Answer Review | MindMosaic Parent",
    robots: { index: false, follow: false },
  };
}

export default async function AnswerReviewPage({ params }: Props) {
  const { childId, id } = await params;

  return (
    <ParentShell active="/parent/children">
      <AttemptAnswerReview childId={childId} resultId={id} />
    </ParentShell>
  );
}
