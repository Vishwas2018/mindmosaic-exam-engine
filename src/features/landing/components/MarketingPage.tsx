import type { ReactNode } from "react";
import Link from "next/link";

import { ClosingCta, SiteFooter } from "./Closing";
import { Eyebrow, mmButton } from "./primitives";
import { SiteNav } from "./SiteNav";

/**
 * Shell for the marketing pages the header and footer link to (/learn,
 * /assessments, /exam-preparation, /methodology, /pricing). Each one wraps
 * the same landing sections that already describe its subject rather than
 * restating them in new prose, so there is exactly one place any of that
 * copy lives — ../content.ts.
 */
export function MarketingPage({
  eyebrow,
  title,
  intro,
  primaryCta,
  secondaryCta,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  children: ReactNode;
}) {
  return (
    <div className="lp-root min-h-screen">
      <SiteNav />
      <main id="main-content">
        <section
          aria-labelledby="page-heading"
          className="border-b border-mm-line bg-mm-page py-[clamp(36px,4vw,64px)]"
        >
          <div className="mm-width max-w-[760px]">
            <Eyebrow rule className="mb-5">
              {eyebrow}
            </Eyebrow>
            <h1
              id="page-heading"
              className="text-[clamp(32px,4vw,52px)] font-bold leading-[1.08] tracking-[-0.035em] text-mm-ink"
            >
              {title}
            </h1>
            <p className="mt-5 text-pretty text-[17px] leading-[1.6] text-mm-muted">{intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={primaryCta.href} className={mmButton({ size: "lg" })}>
                {primaryCta.label}
              </Link>
              {secondaryCta && (
                <Link href={secondaryCta.href} className={mmButton({ variant: "outline", size: "lg" })}>
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          </div>
        </section>

        {children}

        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  );
}
