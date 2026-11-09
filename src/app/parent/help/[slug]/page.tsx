import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { HelpArticleDetail } from "@/features/parent-dashboard/components/HelpArticleDetail";
import { PREVIEW_HELP_ARTICLES, type PreviewHelpArticle } from "@/features/parent-dashboard/fixtures";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = PREVIEW_HELP_ARTICLES[slug] || PREVIEW_HELP_ARTICLES["forgotten-pin"];
  return {
    title: `${article.title} | Help Centre`,
    robots: { index: false, follow: false },
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article: PreviewHelpArticle =
    PREVIEW_HELP_ARTICLES[slug] || {
      slug,
      title: "Help Article",
      category: "General Assistance",
      lead: "Guides and answers for MindMosaic parents.",
      paragraphs: [
        "This article is available in preview mode.",
        "You can explore our full Help Centre or contact our support team directly.",
      ],
      action: {
        label: "Return to Help Centre",
        href: "/parent/help",
      },
    };

  return (
    <ParentShell active="/parent/account">
      <HelpArticleDetail article={article} />
    </ParentShell>
  );
}
