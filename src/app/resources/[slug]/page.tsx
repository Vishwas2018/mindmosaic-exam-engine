import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/features/landing/components/Closing";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { resourceArticles, routes, type ResourceArticleSlug } from "@/features/landing/content";

export function generateStaticParams() {
  return Object.keys(resourceArticles).map((slug) => ({ slug }));
}

function articleFor(slug: string) {
  return Object.prototype.hasOwnProperty.call(resourceArticles, slug)
    ? resourceArticles[slug as ResourceArticleSlug]
    : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articleFor(slug);
  if (!article) return {};
  return { title: article.title, description: article.intro };
}

/** Public/Resource Detail.dc.html — currently the one published article the Resources page links to. */
export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articleFor(slug);
  if (!article) notFound();

  return (
    <div className="lp-root min-h-screen">
      <SiteNav />
      <main id="main-content" className="mm-width grid max-w-[760px] gap-8 py-[clamp(32px,5vw,72px)]">
        <nav aria-label="Breadcrumb" className="flex gap-2 text-sm text-mm-ink-soft">
          <Link href="/" className="text-mm-ink-soft hover:text-mm-brand">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={routes.resources} className="text-mm-ink-soft hover:text-mm-brand">
            Resources
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{article.title}</span>
        </nav>
        <h1 className="text-[clamp(34px,4.2vw,56px)] font-bold leading-[1.06] tracking-[-0.04em] text-mm-ink">
          {article.title}
        </h1>
        <p className="text-pretty text-lg leading-[1.6] text-mm-muted">{article.intro}</p>
        <div className="grid gap-7">
          {article.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-[22px] font-bold tracking-[-0.02em] text-mm-ink">{section.heading}</h2>
              <p className="mt-2.5 text-[16px] leading-[1.6] text-mm-ink-soft">{section.body}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
