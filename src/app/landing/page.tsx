import type { Metadata } from "next";

import { FinalCta, SiteFooter } from "@/features/landing/components/Closing";
import { Experience, Progress } from "@/features/landing/components/Experience";
import { Audiences, Features } from "@/features/landing/components/Features";
import { Hero } from "@/features/landing/components/Hero";
import { Faq, Pricing } from "@/features/landing/components/PricingFaq";
import { HowItWorks, SocialProof } from "@/features/landing/components/Proof";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { Problems, ProductIntro } from "@/features/landing/components/Story";
import { Formats, Subjects } from "@/features/landing/components/Subjects";

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

export default function LandingPage() {
  return (
    <div className="min-h-screen">
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
