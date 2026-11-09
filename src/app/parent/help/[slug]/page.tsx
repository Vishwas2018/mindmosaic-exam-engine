import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { HelpArticleDetail } from "@/features/parent-dashboard/components/HelpArticleDetail";
import { PREVIEW_HELP_ARTICLES } from "@/features/parent-dashboard/fixtures";
import { requireParentPreview } from "@/features/parent-dashboard/preview-mode";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Help Article | MindMosaic Parent",
  robots: { index: false, follow: false },
};

export default async function HelpArticlePage({ params }: Props) {
  // Fixture-only screen: 404 outside explicit local preview.
  await requireParentPreview();

  const { slug } = await params;
  const article = PREVIEW_HELP_ARTICLES[slug];
  if (!article) notFound();

  return (
    <ParentShell active="/parent/account">
      <HelpArticleDetail article={article} />
    </ParentShell>
  );
}
