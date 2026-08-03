import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";

/*
 * Every href below resolves to a route that exists in src/app — there is no
 * "#" placeholder anywhere in this footer. "Pricing" points at the landing
 * page's plans anchor because that is where plans are actually published;
 * "Report a question" and "Contact support" both land on /contact, which is
 * the one support inbox the product has, so they are labelled by what the
 * reader wants to do rather than invented as two separate destinations.
 */
const FOOTER_GROUPS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Platform",
    links: [
      { label: "Practice", href: "/practice" },
      { label: "Learn", href: "/student/learn" },
      { label: "Results", href: "/results" },
      { label: "Pricing", href: "/#plans" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help centre", href: "/help" },
      { label: "Report a question", href: "/contact" },
      { label: "Contact support", href: "/contact" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Assessment disclaimer", href: "/assessment-disclaimer" },
    ],
  },
];

/** Shared product-surface footer. Matches the landing footer's claims. */
export function AppFooter() {
  return (
    <footer className="border-t border-royal/8 bg-white">
      <div className="site-width grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] lg:py-14">
        <div>
          <MindMosaicLogo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
            Original practice content for Australian students, written in
            Australian English.
          </p>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <nav key={group.heading} aria-label={group.heading}>
            <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
              {group.heading}
            </h2>
            <ul className="mt-3 space-y-0.5">
              {group.links.map((link) => (
                <li key={`${group.heading}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-ink transition hover:text-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-royal/8">
        <p className="site-width py-6 text-sm leading-6 text-muted">
          MindMosaic provides original practice content inspired by common
          assessment formats. It is not affiliated with or endorsed by NAPLAN,
          ICAS, AMC or other assessment organisations.
        </p>
      </div>
    </footer>
  );
}
