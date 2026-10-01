import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/features/landing/components/Closing";
import { ProgrammeDetail } from "@/features/landing/components/Programmes";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { mmButton, Section } from "@/features/landing/components/primitives";
import { programmes, routes } from "@/features/landing/content";

export function generateStaticParams() {
  return programmes.items.map((item) => ({ slug: item.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = programmes.items.find((entry) => entry.id === slug);
  if (!item) return { title: "Program not found" };
  return { title: item.name, description: item.blurb };
}

/**
 * Public/Program Detail.dc.html: one real URL per programme. Reuses
 * ProgrammeDetail (extracted from Programmes.tsx) for the subjects,
 * practice/exam mode, region picker and coverage messaging, so this page
 * can never show different facts than the interactive index at
 * /programs. The design's own "Two ways to use it" and "What you need"
 * sections are generic boilerplate not tied to per-programme data —
 * left out rather than duplicated as static filler text.
 */
export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = programmes.items.find((entry) => entry.id === slug);
  if (!item) notFound();

  return (
    <div className="lp-root min-h-screen">
      <SiteNav />
      <main id="main-content">
        <Section labelledBy="program-heading">
          <nav aria-label="Breadcrumb" className="mb-4 flex gap-2 text-sm text-mm-muted">
            <Link href="/" className="text-mm-muted hover:text-mm-brand">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={routes.programs} className="text-mm-muted hover:text-mm-brand">
              Programs
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{item.name}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
            <div id="program-heading">
              <h1 className="m-0 text-pretty text-[clamp(38px,4.6vw,68px)] font-medium leading-[1.02] tracking-[-0.04em] text-mm-ink">
                {item.name}
              </h1>
              <div className="mt-6 rounded-[20px] border border-mm-line bg-white p-[clamp(24px,2.6vw,38px)]">
                <ProgrammeDetail item={item} />
              </div>
            </div>

            <aside
              aria-label="Get started"
              className="flex flex-col gap-3.5 rounded-3xl border border-mm-line bg-white p-[clamp(20px,2.6vw,32px)]"
            >
              <h2 className="m-0 text-lg font-semibold text-mm-ink">Start practising</h2>
              <p className="m-0 text-[15.5px] leading-[1.55] text-mm-ink-soft">
                Create a parent account and add your child to save their results. You can also try a set as a
                guest.
              </p>
              <Link href={routes.startFree} className={mmButton({ size: "lg", className: "justify-center" })}>
                Start free
              </Link>
              <Link
                href={routes.guestPractice}
                className={mmButton({ variant: "outline", size: "lg", className: "justify-center" })}
              >
                Try a set as a guest
              </Link>
              <p className="m-0 text-[13.5px] leading-[1.5] text-mm-muted">
                Guest practice isn&apos;t saved once you close the tab.
              </p>
            </aside>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
