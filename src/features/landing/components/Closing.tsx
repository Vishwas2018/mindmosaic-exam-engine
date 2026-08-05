import Image from "next/image";
import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";

import { closing, footer } from "../content";
import { mmButton, MosaicRule } from "./primitives";

/** The tinted closing band: copy left, wide image + mosaic rule right. */
export function ClosingCta() {
  return (
    <section id="start" aria-labelledby="closing-heading" className="bg-mm-tint py-[clamp(40px,4vw,64px)]">
      <div className="mm-width grid items-center gap-[clamp(24px,2.6vw,40px)] lg:grid-cols-2">
        <div className="min-w-0">
          <h2
            id="closing-heading"
            className="text-pretty text-[clamp(30px,3.6vw,48px)] font-bold leading-[1.08] tracking-[-0.035em] text-mm-ink"
          >
            {closing.heading}
          </h2>
          <p className="mt-5 max-w-[520px] text-[17px] leading-[1.6] text-mm-muted">{closing.body}</p>

          <div className="mt-8 flex flex-wrap gap-3">
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

        <div className="grid min-w-0 gap-2.5">
          <div className="relative aspect-video w-full overflow-hidden rounded-[18px]">
            <Image
              src={closing.image.src}
              alt={closing.image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <MosaicRule tiles={closing.tiles} className="h-[clamp(22px,2.4vw,34px)] gap-2" />
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
    <footer className="border-t border-mm-line bg-mm-page pb-6 pt-[clamp(36px,3.5vw,52px)]">
      <div className="mm-width">
        <div className="grid gap-[clamp(24px,3vw,40px)] sm:grid-cols-2 lg:grid-cols-5">
          <div className="grid content-start gap-3.5">
            <Link href="/" aria-label="MindMosaic home" className="w-fit">
              <MindMosaicLogo size={30} />
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
                  className="flex items-center py-[3px] text-[14.5px] text-mm-muted transition-colors hover:text-mm-brand"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <MosaicRule
          tiles={footer.tiles}
          className="my-[clamp(22px,2.4vw,30px)] h-2.5 gap-1.5"
          tileClassName="rounded-sm"
        />

        <div className="grid gap-3.5">
          <p className="max-w-[900px] text-[13px] leading-[1.6] text-mm-muted">{footer.disclaimer}</p>
          <p className="text-[13px] text-mm-muted">{footer.supportLine}</p>
          <p className="text-[13px] text-mm-muted">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
