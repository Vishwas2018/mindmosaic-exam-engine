import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display, Geist, Instrument_Sans, Roboto } from "next/font/google";

import { AuthProvider } from "@/features/auth";

import "./globals.css";

/*
 * Product-wide typography: DM Sans is the body/UI typeface, DM Serif
 * Display is the display heading accent. Both are self-hosted via
 * next/font/google and expose CSS variables used in globals.css.
 */
const dmSans = DM_Sans({
  subsets: ["latin"],
  // 300/600 exist for the lighter weight scale in globals.css's `@theme
  // inline` (--font-weight-bold is remapped to 600, semibold to 500), so
  // every `font-bold` in the product renders a real cut, not a synthesised one.
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
  display: "swap",
});

/*
 * Roboto 700 is scoped to the wordmark only (MindMosaicLogo) — it is not
 * part of the body/UI type system, so only its CSS variable is exposed
 * here, never added to the body font stack.
 */
const roboto = Roboto({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-logo",
  display: "swap",
});

/*
 * Marketing-surface type pair from the approved landing design file:
 * Instrument Sans for display, Geist for body. Like `roboto` above, these
 * only expose CSS variables — they are never added to <body>'s own font
 * stack, so they apply exactly where globals.css's `.lp-root, .legal-page`
 * rule opts in and nowhere else.
 */
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-geist",
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
      <body
        className={`${dmSans.variable} ${dmSerif.variable} ${roboto.variable} ${instrumentSans.variable} ${geist.variable}`}
      >
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
