import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { PracticePreviewView } from "@/features/parent-dashboard/components/PracticePreviewView";

interface Props {
  params: Promise<{ childId: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Question Preview | MindMosaic Parent",
    robots: { index: false, follow: false },
  };
}

export default async function PracticePreviewPage({ params }: Props) {
  const { childId } = await params;

  return (
    <ParentShell active="/parent/children">
      <PracticePreviewView childId={childId} />
    </ParentShell>
  );
}
