"use client";

import Image from "next/image";
import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";

import { closing, footer, routes, SUPPORT_EMAIL } from "../content";
import { useMotionLevel } from "../motion/useMotionLevel";
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
 * Shared by every Public page and every legal page (see
 * src/features/legal/LegalPageShell.tsx), so its link set is the one
 * sitewide footer — every href here must resolve to a real route.
 *
 * Components/Site Footer.dc.html: the mosaic strip sits full-bleed at the
 * very top edge (not inset in the padded column grid), and a light sheen
 * sweeps across it on a 5.2s loop — MOTION_SPEC.md effect 9, "Expressive
 * only". `pointer-events-none` and `aria-hidden` keep it decorative.
 */
export function SiteFooter() {
  const level = useMotionLevel();

  return (
    <footer className="bg-mm-page pb-6 text-mm-ink-soft">
      <div aria-hidden="true" className="relative h-2.5 overflow-hidden">
        <MosaicRule tiles={footer.tiles} className="h-full gap-0" tileClassName="rounded-none" />
        {level === "expressive" && (
          <span
            className="pointer-events-none absolute inset-0 mm-footer-shine"
            style={{
              background:
                "linear-gradient(100deg, transparent 35%, rgba(255,255,255,0.6) 50%, transparent 65%)",
            }}
          />
        )}
      </div>

      <div className="mm-width pt-[clamp(48px,6vw,80px)]">
        <div className="grid gap-9 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          <div className="grid content-start gap-4 sm:col-span-2 sm:max-w-[420px]">
            <Link href="/" aria-label="MindMosaic home" className="w-fit">
              <MindMosaicLogo size="md" />
            </Link>
            <p className="text-[15px] leading-[1.6] text-mm-ink-soft">{footer.tagline}</p>
            <Link href={`${routes.help}#contact`} className="w-fit text-[15px] text-mm-brand hover:text-mm-brand-deep">
              {SUPPORT_EMAIL}
            </Link>
          </div>

          {footer.columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="grid content-start gap-1">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-mm-ink">{column.title}</p>
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex min-h-10 items-center text-[15px] text-mm-ink-soft transition-colors hover:text-mm-brand"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <p className="mt-9 max-w-[900px] text-[13.5px] leading-[1.6] text-mm-muted">{footer.disclaimer}</p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-mm-line pt-6 text-[13.5px] text-mm-muted">
          <span>{footer.copyright}</span>
          <span className="flex gap-5">
            {footer.legalLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-mm-muted hover:text-mm-brand">
                {link.label}
              </Link>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
