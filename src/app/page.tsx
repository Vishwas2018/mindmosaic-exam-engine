import type { Metadata } from "next";

import { SiteFooter } from "@/features/landing/components/Closing";
import { FaqAndStart } from "@/features/landing/components/FaqAndStart";
import { ForParents } from "@/features/landing/components/ForParents";
import { Hero } from "@/features/landing/components/Hero";
import { LearningDemo } from "@/features/landing/components/LearningDemo";
import { ProgramHighlights } from "@/features/landing/components/ProgramHighlights";
import { QualityBand } from "@/features/landing/components/QualityBand";
import { SiteNav } from "@/features/landing/components/SiteNav";
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
 *
 * Six sections, matching Public/Home.dc.html exactly (see content.ts's
 * header comment). The other marketing routes' sections (Credibility,
 * Programmes, HowItWorks, Tutorials, Showcase, QuestionTypes,
 * LearningHub, Quality, Audiences, Plans, Resources) are unchanged and
 * still render on those routes — they're just not part of this page
 * anymore.
 */
const sectionComponents: Record<SectionKey, () => React.JSX.Element | null> = {
  hero: Hero,
  learningDemo: LearningDemo,
  programHighlights: ProgramHighlights,
  forParents: ForParents,
  qualityBand: QualityBand,
  faqAndStart: FaqAndStart,
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
