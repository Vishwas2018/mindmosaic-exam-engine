import type { Metadata, Viewport } from "next";
import { Roboto, Roboto_Slab } from "next/font/google";

import { AuthProvider } from "@/features/auth";

import "./globals.css";

/*
 * Product-wide typography (brand/BRAND.md "Typography"): Roboto is the
 * body/UI typeface for every surface — auth, dashboards, billing, admin,
 * the exam runner, and landing alike, via the global `--font-sans` token
 * in globals.css. Roboto Slab is the landing-only display accent (hero
 * H1, section H2s, stats-band numerals) plus the legal pages, which
 * share it intentionally — see globals.css's `.lp-root, .legal-page`
 * rule for the actual scoping; `font-display` resolves to an inert
 * system-serif fallback everywhere else.
 *
 * Both are loaded once here (not per-page) and applied to <body>, so
 * their CSS variables are always defined regardless of which token
 * consumes them.
 *
 * Weights: Roboto's Google Fonts distribution only ships static
 * instances at 100/300/400/500/700/900 — there is no 600 or 800. The app
 * uses font-semibold (600, ~163 call sites) and font-extrabold (800,
 * ~138 call sites) throughout; those necessarily browser-match to the
 * nearest loaded weight (700, in both directions) rather than rendering
 * an exact 600/800 face — an inherent limit of Roboto as a static
 * (non-variable) family, not something loading more weights can fix.
 * 900 is loaded because font-black (93 call sites) needs a real face,
 * not a synthesized/faux-bold 700.
 */
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-roboto-slab",
  display: "swap",
});

// Browser-chrome tint on mobile; matches the landing --brand token.
export const viewport: Viewport = {
  themeColor: "#5925a8",
};

export const metadata: Metadata = {
  // Intended production domain — not live yet, but required so relative
  // og:image / twitter:image URLs resolve to absolute ones in metadata.
  metadataBase: new URL("https://mindmosaic.app"),
  title: {
    default: "MindMosaic | Thoughtful practice, real progress",
    template: "%s | MindMosaic",
  },
  description:
    "Premium, original Grade 3 and Grade 5 NAPLAN-style and ICAS-style practice built for confident learners.",
  applicationName: "MindMosaic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" data-scroll-behavior="smooth">
      <body className={`${roboto.variable} ${robotoSlab.variable}`}>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
