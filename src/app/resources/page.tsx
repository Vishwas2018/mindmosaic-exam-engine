import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/features/landing/components/Closing";
import { ImageSlot } from "@/features/landing/components/primitives";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { resourcesPage } from "@/features/landing/content";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Short guides for parents and students, and the details behind how MindMosaic works. More guides are being written.",
};

/**
 * Public/Resources.dc.html. Replaces the previous page, which combined the
 * Learning Hub's browsable brief library (HubLibrary.tsx) with the Help
 * Centre index (HelpIndex.tsx) on one route. The new design keeps this
 * page to three short lists — published guides, guides being written, and
 * policy documents — and moves Help to its own merged /help page (owner
 * ruling, 1 Oct). HubLibrary and its `hub` content are left in place,
 * unrendered: Learning Hub stays a Planned pathway (Programs page) with no
 * dedicated route approved yet.
 */
export default function ResourcesPage() {
  return (
    <div className="lp-root min-h-screen">
      <SiteNav />
      <main id="main-content" className="mm-width grid gap-12 py-[clamp(32px,5vw,72px)]">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="flex min-w-0 flex-col gap-[18px]">
            <h1 className="text-[clamp(40px,5vw,76px)] font-bold leading-none tracking-[-0.04em] text-mm-ink">
              {resourcesPage.heading}
            </h1>
            <p className="max-w-[540px] text-pretty text-lg leading-[1.6] text-mm-muted">
              {resourcesPage.intro}
            </p>
          </div>
          <ImageSlot
            assetId={resourcesPage.image.assetId}
            alt={resourcesPage.image.alt}
            aspectRatio="16 / 10"
            className="rounded-[24px]"
          />
        </div>

        <section aria-labelledby="pub-h" className="grid gap-4">
          <h2 id="pub-h" className="text-[clamp(26px,2.6vw,36px)] font-bold tracking-[-0.03em] text-mm-ink">
            Published
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-4">
            {resourcesPage.published.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex flex-col gap-2.5 rounded-[20px] border border-mm-line bg-white p-[clamp(20px,2.4vw,28px)] text-mm-ink no-underline transition-colors hover:border-mm-brand"
              >
                <span className="text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">
                  {item.kind}
                </span>
                <span className="text-xl font-bold tracking-[-0.015em] leading-[1.25]">{item.title}</span>
                <span className="text-[15px] leading-[1.55] text-mm-muted">{item.blurb}</span>
                <span className="mt-auto flex items-center gap-2 text-[15px] font-semibold text-mm-brand">
                  {item.cta}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="wip-h" className="grid gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="wip-h" className="text-[clamp(26px,2.6vw,36px)] font-bold tracking-[-0.03em] text-mm-ink">
              Being written
            </h2>
            <p className="text-[15px] text-mm-ink-soft">Not published yet.</p>
          </div>
          <ul className="m-0 grid list-none border-t border-mm-line p-0">
            {resourcesPage.beingWritten.map((item) => (
              <li
                key={item.title}
                className="flex items-center justify-between gap-4 border-b border-mm-line py-[18px]"
              >
                <span className="grid gap-1">
                  <span className="text-[17px] font-semibold text-mm-ink-soft">{item.title}</span>
                  <span className="text-[14.5px] text-mm-ink-soft">{item.blurb}</span>
                </span>
                <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border border-dashed border-mm-line-quiet px-2.5 py-1 text-[13px] font-semibold text-mm-quiet">
                  Being written
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="legal-h" className="grid gap-3">
          <h2 id="legal-h" className="text-[17px] font-semibold text-mm-ink">
            {resourcesPage.policies.heading}
          </h2>
          <p className="max-w-[680px] text-[15px] leading-[1.55] text-mm-ink-soft">
            {resourcesPage.policies.intro}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {resourcesPage.policies.links.map((link) => (
              <Link key={link.href} href={link.href} className="flex min-h-11 items-center font-semibold">
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
