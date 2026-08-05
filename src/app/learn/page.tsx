import type { Metadata } from "next";

import { LearningHub } from "@/features/landing/components/LearningHub";
import { MarketingPage } from "@/features/landing/components/MarketingPage";
import { Programmes } from "@/features/landing/components/Programmes";
import { routes } from "@/features/landing/content";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Structured Australian Curriculum pathways, Singapore Maths and the Learning Hub — explanations, worked examples and skill lessons for Australian students.",
};

export default function LearnPage() {
  return (
    <MarketingPage
      eyebrow="Learning"
      title="Concepts explained, then practised."
      intro="Structured Australian Curriculum pathways, a Singapore Maths track that runs alongside them, and a Learning Hub where every explanation, worked example and skill lesson stays browsable. Each programme lists only the year levels it currently covers."
      primaryCta={{ label: "Start free", href: routes.startFree }}
      secondaryCta={{ label: "Explore practice", href: routes.practice }}
    >
      <LearningHub />
      <Programmes />
    </MarketingPage>
  );
}
