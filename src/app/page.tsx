import type { Metadata } from "next";

import { SiteFooter } from "@/features/landing/components/Closing";
import { FaqAndStart } from "@/features/landing/components/FaqAndStart";
import { ForParents } from "@/features/landing/components/ForParents";
import { Hero } from "@/features/landing/components/Hero";
import { LearningDemo } from "@/features/landing/components/LearningDemo";
import { ProductTour } from "@/features/landing/components/ProductTour";
import { ProgramHighlights } from "@/features/landing/components/ProgramHighlights";
import { QualityBand } from "@/features/landing/components/QualityBand";
import { RespondsToStudent } from "@/features/landing/components/RespondsToStudent";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { TrustAndCare } from "@/features/landing/components/TrustAndCare";
import { sections, type SectionKey } from "@/features/landing/content";

export const metadata: Metadata = {
  title: "Learning, Practice & Exam Preparation for Australian Students | MindMosaic",
  description:
    "Learning, practice and exam preparation for Australian students: clear lessons, original questions, worked explanations and a parent progress view. Explore Year 3 and 5 programs and current subject availability.",
  openGraph: {
    title: "MindMosaic — Learn with purpose. Practise with confidence.",
    description:
      "Clear lessons, original questions, worked explanations and a parent progress view for Australian students.",
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
  learningDemo: LearningDemo,
  productTour: ProductTour,
  programHighlights: ProgramHighlights,
  respondsToStudent: RespondsToStudent,
  forParents: ForParents,
  qualityBand: QualityBand,
  trustAndCare: TrustAndCare,
  faqAndStart: FaqAndStart,
  footer: SiteFooter,
};

export default function HomePage() {
  return (
    <div className="lp-root min-h-screen">
      <SiteNav overlay />
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
