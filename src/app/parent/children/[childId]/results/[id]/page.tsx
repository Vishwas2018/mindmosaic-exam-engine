import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { AttemptResultDetail } from "@/features/parent-dashboard/components/AttemptResultDetail";

interface Props {
  params: Promise<{ childId: string; id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Result Detail | MindMosaic Parent",
    robots: { index: false, follow: false },
  };
}

export default async function ResultDetailPage({ params }: Props) {
  const { childId, id } = await params;

  return (
    <ParentShell active="/parent/children">
      <AttemptResultDetail childId={childId} resultId={id} />
    </ParentShell>
  );
}
