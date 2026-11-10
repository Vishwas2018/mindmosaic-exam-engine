import type { Metadata } from "next";

import {
  MySpaceCanvasScreen,
  resolveMySpaceState,
} from "@/features/student/components/my-space/MySpaceCanvasScreen";
import { requireStudent } from "@/features/student/require-student";
import { isStudentPreviewEnabled } from "@/features/student/preview-mode";

export const metadata: Metadata = {
  title: "My Space — MindMosaic",
  description: "Personalised dashboard for curriculum learning, NAPLAN, and ICAS preparation.",
};

export const dynamic = "force-dynamic";

export default async function StudentHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ state?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const forcedState = resolvedParams.state;
  const isPreview = await isStudentPreviewEnabled();

  if (!isPreview) {
    await requireStudent();
  }

  return <MySpaceCanvasScreen state={resolveMySpaceState(forcedState)} />;
}
