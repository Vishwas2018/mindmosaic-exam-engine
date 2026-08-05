import type { Metadata } from "next";

import { Audiences } from "@/features/landing/components/Audiences";
import { ClosingCta, SiteFooter } from "@/features/landing/components/Closing";
import { Credibility } from "@/features/landing/components/Credibility";
import { Evidence } from "@/features/landing/components/Evidence";
import { Faq } from "@/features/landing/components/Faq";
import { ForParents } from "@/features/landing/components/ForParents";
import { Hero } from "@/features/landing/components/Hero";
import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { LearningHub } from "@/features/landing/components/LearningHub";
import { Plans } from "@/features/landing/components/Plans";
import { Programmes } from "@/features/landing/components/Programmes";
import { Quality } from "@/features/landing/components/Quality";
import { QuestionTypes } from "@/features/landing/components/QuestionTypes";
import { Resources } from "@/features/landing/components/Resources";
import { Showcase } from "@/features/landing/components/Showcase";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { Tutorials } from "@/features/landing/components/Tutorials";
import { sections, type SectionKey } from "@/features/landing/content";

export const metadata: Metadata = {
  title: "Learning, Practice & Exam Preparation for Australian Students | MindMosaic",
  description:
    "Curriculum learning, focused practice and realistic exam preparation for Australian students — from foundational skills to NAPLAN-, ICAS-, AMC- and selective-entry-style challenges.",
  openGraph: {
    title: "MindMosaic — Learn with purpose. Practise with confidence.",
    description:
      "Curriculum learning, focused practice and realistic exam preparation for Australian students across primary and secondary years.",
    type: "website",
  },
};

/**
 * Page composition config — `sections` (content.ts) controls both order and
 * visibility. Adding, removing, reordering, or toggling a section is a
 * content.ts edit; this map is only the key -> component lookup.
 */
const sectionComponents: Record<SectionKey, () => React.JSX.Element | null> = {
  hero: Hero,
  credibility: Credibility,
  programmes: Programmes,
  howItWorks: HowItWorks,
  tutorials: Tutorials,
  showcase: Showcase,
  questionTypes: QuestionTypes,
  learningHub: LearningHub,
  forParents: ForParents,
  quality: Quality,
  audiences: Audiences,
  plans: Plans,
  evidence: Evidence,
  resources: Resources,
  faq: Faq,
  closing: ClosingCta,
  footer: SiteFooter,
};

export default function HomePage() {
  return (
    <div className="lp-root min-h-screen">
      <SiteNav />
      <main id="main-content">
        {sections
          .filter((section) => section.enabled && section.key !== "footer")
          .map((section) => {
            const Component = sectionComponents[section.key];
            return <Component key={section.key} />;
          })}
      </main>
      {sections.find((section) => section.key === "footer")?.enabled && <SiteFooter />}
    </div>
  );
}
