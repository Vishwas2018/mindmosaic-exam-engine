import type { Metadata, Viewport } from "next";
import { Roboto, Roboto_Slab } from "next/font/google";

import { AuthProvider } from "@/features/auth";

import "./globals.css";

/*
 * Landing typography (brand/BRAND.md "Typography"): Roboto is body/UI text,
 * Roboto Slab is the display accent reserved for hero H1, section H2s and
 * the stats-band numerals. Loaded once here (not per-page) per Next.js
 * convention. The generated CSS variables are applied to <body> below, but
 * only `.lp-root` (the marketing root page) actually resolves `font-sans` /
 * `font-display` to these families — see globals.css. Every other route
 * keeps the app-wide `--font-sans` (Aptos) token untouched, so this does
 * not reskin auth/dashboard/billing surfaces.
 */
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
