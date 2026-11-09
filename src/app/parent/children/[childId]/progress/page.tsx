import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { ChildProgressView } from "@/features/parent-dashboard/components/ChildProgressView";
import { PREVIEW_CHILDREN } from "@/features/parent-dashboard/fixtures";

interface Props {
  params: Promise<{ childId: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { childId } = await params;
  const child = PREVIEW_CHILDREN.find((c) => c.id === childId) || PREVIEW_CHILDREN[0];
  return {
    title: `${child.firstName}'s Progress | MindMosaic Parent`,
    robots: { index: false, follow: false },
  };
}

export default async function ChildProgressPage({ params }: Props) {
  const { childId } = await params;

  return (
    <ParentShell active="/parent/children">
      <ChildProgressView childId={childId} />
    </ParentShell>
  );
}
