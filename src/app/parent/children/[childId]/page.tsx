import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ParentShell } from "@/features/parent-dashboard";
import { ChildProfileDetail } from "@/features/parent-dashboard/components/ChildProfileDetail";
import { PREVIEW_CHILDREN } from "@/features/parent-dashboard/fixtures";
import { requireParentPreview } from "@/features/parent-dashboard/preview-mode";

interface Props {
  params: Promise<{ childId: string }>;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Child Profile | MindMosaic Parent",
  robots: { index: false, follow: false },
};

export default async function ChildProfilePage({ params }: Props) {
  // Fixture-only screen: 404 outside explicit local preview. Real child records
  // are never read here, so a real child id can never surface fixture credentials.
  await requireParentPreview();

  const { childId } = await params;
  const child = PREVIEW_CHILDREN.find((c) => c.id === childId);
  if (!child) notFound();

  return (
    <ParentShell active="/parent/children">
      <ChildProfileDetail child={child} />
    </ParentShell>
  );
}
