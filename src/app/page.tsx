import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";

import { FeatureStrip, SiteFooter } from "@/features/landing/components/Closing";
import { FitsEveryStudent } from "@/features/landing/components/FitsEveryStudent";
import { ForParents } from "@/features/landing/components/ForParents";
import { Hero, TrustStrip } from "@/features/landing/components/Hero";
import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { Educators, Testimonials } from "@/features/landing/components/SocialProof";
import { StatsBand } from "@/features/landing/components/StatsBand";
import { SubjectCards, SubjectGrid } from "@/features/landing/components/Subjects";
import { WhyLove } from "@/features/landing/components/WhyLove";
import { sections, type SectionKey } from "@/features/landing/content";

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
  title: "Smart Practice, Bright Futures | MindMosaic",
  description:
    "Interactive NAPLAN-style and ICAS-style practice for Australian students from Year 3 to Year 5. Original questions, instant feedback, and progress parents can track.",
  openGraph: {
    title: "MindMosaic — Smart Practice, Bright Futures",
    description:
      "Interactive NAPLAN-style and ICAS-style practice for Australian students from Year 3 to Year 5.",
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
  trustStrip: TrustStrip,
  whyLove: WhyLove,
  subjectCards: SubjectCards,
  subjectGrid: SubjectGrid,
  statsBand: StatsBand,
  howItWorks: HowItWorks,
  fitsEveryStudent: FitsEveryStudent,
  forParents: ForParents,
  educators: Educators,
  testimonials: Testimonials,
  featureStrip: FeatureStrip,
  footer: SiteFooter,
};

export default function HomePage() {
  return (
    <div className={`${display.variable} ${body.variable} lp-root min-h-screen`}>
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
