import type { Metadata } from "next";

import { ParentShell } from "@/features/parent-dashboard";
import { ChildCurriculumView } from "@/features/parent-dashboard/components/ChildCurriculumView";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { LegacyChildCurriculumPage } from "./legacy-page";

export const metadata: Metadata = {
  title: "Child Curriculum Explorer | MindMosaic Parents",
  description:
    "Explore the Victorian Curriculum F–10 Version 2.0 (Mathematics and English) for your child's year level.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ChildCurriculumPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  // The real catalogue explorer (database-backed, per-child) is the default.
  // The fixture learning view renders only in explicit local preview, where no
  // database exists, so the catalogue explorer is intentionally not mounted.
  if (!(await isParentPreviewEnabled())) return await LegacyChildCurriculumPage({ params });

  const { childId } = await params;
  return (
    <ParentShell active="/parent/children">
      <ChildCurriculumView childId={childId} />
    </ParentShell>
  );
}
