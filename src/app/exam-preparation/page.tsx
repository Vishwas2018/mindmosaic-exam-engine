import type { Metadata } from "next";

import { Credibility } from "@/features/landing/components/Credibility";
import { MarketingPage } from "@/features/landing/components/MarketingPage";
import { Programmes } from "@/features/landing/components/Programmes";
import { Showcase } from "@/features/landing/components/Showcase";
import { routes } from "@/features/landing/content";

export const metadata: Metadata = {
  title: "Exam Preparation",
  description:
    "NAPLAN-style, ICAS-style, AMC-style and selective school entry-style practice, from short exam-style sets to full-length simulations. Original questions only — never past papers.",
};

export default function ExamPreparationPage() {
  return (
    <MarketingPage
      eyebrow="Exam preparation"
      title="Sit it under exam conditions before the day."
      intro="Assessment-format sessions with realistic instructions, section navigation, flag for review, autosave and a review-before-submit screen. Results and explanations are released after submission. Every question is written for MindMosaic — these are not official examinations or past papers."
      primaryCta={{ label: "Start free", href: routes.startFree }}
      secondaryCta={{ label: "Read the assessment disclaimer", href: routes.disclaimer }}
    >
      <Credibility />
      <Programmes />
      <Showcase />
    </MarketingPage>
  );
}
