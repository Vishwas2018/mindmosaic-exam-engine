import Link from "next/link";
import { BookOpenCheck, Lock, Monitor, Smile } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { featureStrip, footer } from "../content";
import { LandingLogo } from "./Brand";
import { DisabledIconButton } from "./primitives";
import { NewsletterForm } from "./NewsletterForm";

const featureIcons: Record<string, LucideIcon> = { Lock, Monitor, BookOpenCheck, Smile };

/**
 * lucide-react dropped its brand-glyph set, and these are non-interactive
 * "coming soon" placeholders anyway (see `DisabledIconButton`) — small
 * inline generic silhouettes, not a reproduction of any brand's actual
 * logo mark.
 */
const socialIcons: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  Facebook: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v6h3v-6h3l1-3h-4v-2c0-.6.4-1 1-1z" />
    </svg>
  ),
  Instagram: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  Youtube: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="4" />
      <path d="M10.5 9.5l5 2.5-5 2.5v-5z" fill="currentColor" stroke="none" />
    </svg>
  ),
  Linkedin: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" fillOpacity="0" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="7.2" cy="8" r="1.3" />
      <rect x="6" y="10.5" width="2.4" height="7" />
      <path d="M11 10.5h2.3v1.2c.5-.8 1.4-1.4 2.6-1.4 2 0 2.9 1.3 2.9 3.6v3.6h-2.4v-3.2c0-1-.4-1.6-1.3-1.6-.9 0-1.4.6-1.4 1.6v3.2H11v-7z" />
    </svg>
  ),
};

export function FeatureStrip() {
  return (
    <section aria-label="Why families trust MindMosaic" className="border-t border-brand/10 bg-paper py-10">
      <ul className="site-width grid grid-cols-2 gap-6 sm:grid-cols-4">
        {featureStrip.items.map((item) => {
          const Icon = featureIcons[item.icon] ?? Lock;
          return (
            <li key={item.title} className="flex items-center gap-3">
              <Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-extrabold text-lp-ink">{item.title}</p>
                <p className="text-xs font-semibold text-lp-muted">{item.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-brand-ink text-white/80">
      <div className="site-width py-14 sm:py-18">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr_1fr_1.1fr]">
          <div>
            <LandingLogo inverse />
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/60">{footer.tagline}</p>
            <div className="mt-5 flex gap-2">
              {footer.socials.map((social) => {
                const Icon = socialIcons[social.icon] ?? socialIcons.Facebook;
                return (
                  <DisabledIconButton key={social.icon} label={social.label}>
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </DisabledIconButton>
                );
              })}
            </div>
          </div>

          <nav aria-label="Footer" className="contents">
            {footer.columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-white">{column.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="rounded text-sm font-semibold text-white/65 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-bright/40"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-white">{footer.newsletter.heading}</h3>
            <p className="mt-4 text-sm leading-6 text-white/60">{footer.newsletter.body}</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-white/50">{footer.copyright}</p>
          <p className="max-w-2xl text-[0.7rem] leading-5 text-white/60">{footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
