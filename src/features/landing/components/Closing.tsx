import Image from "next/image";
import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";

import { closing, footer } from "../content";
import { mmButton } from "./primitives";

/** The tinted closing band: copy left, wide image right. */
export function ClosingCta() {
  return (
    <section id="start" aria-labelledby="closing-heading" className="bg-mm-tint py-[clamp(40px,4vw,64px)]">
      <div className="mm-width grid items-center gap-[clamp(28px,3.2vw,48px)] lg:grid-cols-2">
        <div className="min-w-0">
          <h2
            id="closing-heading"
            className="text-pretty text-[clamp(28px,3.4vw,44px)] font-bold leading-[1.1] tracking-[-0.03em] text-mm-ink"
          >
            {closing.heading}
          </h2>
          <p className="mt-4 max-w-[520px] text-[16px] leading-[1.6] text-mm-muted">{closing.body}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href={closing.primaryCta.href} className={mmButton({ size: "lg" })}>
              {closing.primaryCta.label}
            </Link>
            <Link
              href={closing.secondaryCta.href}
              className={mmButton({ variant: "outline", size: "lg", className: "border-mm-tint-line-strong" })}
            >
              {closing.secondaryCta.label}
            </Link>
            <Link href={closing.tertiaryCta.href} className={mmButton({ variant: "quiet", size: "lg" })}>
              {closing.tertiaryCta.label}
            </Link>
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="relative aspect-video w-full overflow-hidden rounded-[24px] border border-mm-line/80 shadow-[0_4px_24px_rgba(24,21,31,0.06)]">
            <Image
              src={closing.image.src}
              alt={closing.image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Shared by the landing page and every legal page (see
 * src/features/legal/LegalPageShell.tsx), so its link set is the one
 * sitewide footer — every href here must resolve to a real route.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-mm-line bg-mm-page pb-8 pt-[clamp(36px,3.5vw,52px)]">
      <div className="mm-width">
        <div className="grid gap-[clamp(24px,3vw,40px)] sm:grid-cols-2 lg:grid-cols-5">
          <div className="grid content-start gap-3.5">
            <Link href="/" aria-label="MindMosaic home" className="w-fit">
              <MindMosaicLogo size="md" />
            </Link>
            <p className="max-w-[260px] text-sm leading-[1.6] text-mm-muted">{footer.tagline}</p>
          </div>

          {footer.columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="grid content-start gap-[7px]">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-mm-ink">{column.title}</p>
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center py-[2px] text-[14px] text-mm-muted transition-colors hover:text-mm-brand"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="mt-10 border-t border-mm-line/80 pt-6 grid gap-3">
          <p className="max-w-[900px] text-[12.5px] leading-[1.6] text-mm-muted">{footer.disclaimer}</p>
          <p className="text-[12.5px] text-mm-muted">{footer.supportLine}</p>
          <p className="text-[12.5px] text-mm-muted">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
