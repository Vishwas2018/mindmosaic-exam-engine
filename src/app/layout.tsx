import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { AuthProvider } from "@/features/auth";
import { siteOrigin } from "@/lib/site-url";

import "./globals.css";
/*
 * Product-wide typography: DM Sans is the body/UI typeface, DM Serif
 * Display is the display heading accent. Both are self-hosted via
 * next/font/local and expose CSS variables used in globals.css.
 */
const dmSans = localFont({
  src: "../assets/fonts/dm-sans-latin-variable.woff2",
  variable: "--font-dm-sans",
  weight: "300 700",
  style: "normal",
  display: "swap",
});

const dmSerif = localFont({
  src: "../assets/fonts/dm-serif-display-latin-400.woff2",
  variable: "--font-dm-serif",
  weight: "400",
  style: "normal",
  display: "swap",
});

const roboto = localFont({
  src: "../assets/fonts/roboto-latin-700.woff2",
  variable: "--font-logo",
  weight: "700",
  style: "normal",
  display: "swap",
});

const instrumentSans = localFont({
  src: "../assets/fonts/instrument-sans-latin-variable.woff2",
  variable: "--font-instrument-sans",
  weight: "400 700",
  style: "normal",
  display: "swap",
});

const geist = localFont({
  src: "../assets/fonts/geist-latin-variable.woff2",
  variable: "--font-geist",
  weight: "300 700",
  style: "normal",
  display: "swap",
});

// Browser-chrome tint on mobile; matches the landing --brand token.
export const viewport: Viewport = {
  themeColor: "#5925a8",
};

export const metadata: Metadata = {
  // The live production origin, so relative og:image / twitter:image URLs resolve
  // to absolute ones that exist. See src/lib/site-url.ts.
  metadataBase: new URL(siteOrigin()),
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
}: Readonly<
  children: React.ReactNode;
}> {
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
