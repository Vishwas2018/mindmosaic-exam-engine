import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { ChildProgressView } from "@/features/parent-dashboard/components/ChildProgressView";
import { requireParentPreview } from "@/features/parent-dashboard/preview-mode";

interface Props {
  params: Promise<{ childId: string }>;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Child Progress | MindMosaic Parent",
  robots: { index: false, follow: false },
};

export default async function ChildProgressPage({ params }: Props) {
  // Fixture-only screen: 404 outside explicit local preview.
  await requireParentPreview();

  const { childId } = await params;

  return (
    <ParentShell active="/parent/children">
      <ChildProgressView childId={childId} />
    </ParentShell>
  );
}
