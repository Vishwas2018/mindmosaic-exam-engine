import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";

import { FinalCta, SiteFooter } from "@/features/landing/components/Closing";
import { Experience, Progress } from "@/features/landing/components/Experience";
import { Audiences, Features } from "@/features/landing/components/Features";
import { Hero } from "@/features/landing/components/Hero";
import { Faq, Pricing } from "@/features/landing/components/PricingFaq";
import { HowItWorks, SocialProof } from "@/features/landing/components/Proof";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { Problems, ProductIntro } from "@/features/landing/components/Story";
import { Formats, Subjects } from "@/features/landing/components/Subjects";

/* Loaded here (rather than a nested layout) because this marketing surface
   is the root page itself, not a route segment a layout could scope to —
   see docs/landing-page.md for the design-token/font rationale. Only this
   page gets the `lp-root` wrapper; every other route falls back to the
   system font stack (see --font-display/--font-body in globals.css). */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Original NAPLAN-style & ICAS-style practice for Grades 3 and 5",
  description:
    "MindMosaic gives Grade 3 and Grade 5 children calm, on-screen NAPLAN-style and ICAS-style practice with original questions, instant marking and skill-level progress parents can actually act on.",
  openGraph: {
    title: "MindMosaic — know exactly what to practise next",
    description:
      "Original Grade 3 and Grade 5 NAPLAN-style and ICAS-style practice with skill-level insight for families.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className={`${display.variable} ${body.variable} lp-root min-h-screen`}>
      <SiteNav />
      <main id="main-content">
        <Hero />
        <Problems />
        <ProductIntro />
        <Features />
        <Audiences />
        <Subjects />
        <Formats />
        <Experience />
        <Progress />
        <HowItWorks />
        <SocialProof />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
