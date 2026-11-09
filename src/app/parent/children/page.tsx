import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { ChildrenHub } from "@/features/parent-dashboard/components/ChildrenHub";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { PREVIEW_CHILDREN } from "@/features/parent-dashboard/fixtures";
import { LegacyParentChildrenPage } from "./legacy-page";

export const metadata: Metadata = {
  title: "Children | MindMosaic Parent",
  description: "Manage your children's profiles, sign-in access codes, and paid plan places.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ParentChildrenPage() {
  // Real, authenticated children management is the default. The fixture-backed
  // redesign only renders in explicit local preview (see preview-mode.ts).
  if (!(await isParentPreviewEnabled())) return await LegacyParentChildrenPage();

  return (
    <ParentShell active="/parent/children">
      <ChildrenHub initialChildren={PREVIEW_CHILDREN} />
    </ParentShell>
  );
}
