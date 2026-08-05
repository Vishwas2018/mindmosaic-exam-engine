import type { Metadata } from "next";

import { Audiences } from "@/features/landing/components/Audiences";
import { FirstWeek } from "@/features/landing/components/FirstWeek";
import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { MarketingPage } from "@/features/landing/components/MarketingPage";
import { Quality } from "@/features/landing/components/Quality";
import { Tutorials } from "@/features/landing/components/Tutorials";
import { routes } from "@/features/landing/content";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn the concept, practise it with feedback, then sit it under exam conditions — plus what a first week looks like and the ten standards every question is reviewed against.",
};

/**
 * How It Works — design handoff screen 2. Section order follows the design
 * file: the three modes, the video tutorials, the first-week list, then the
 * ten-item quality grid on the tinted band.
 */
export default function MethodologyPage() {
  return (
    <MarketingPage
      eyebrow="How it works"
      title="Three stages, and the standards behind them."
      intro="Students can enter at any stage and move back to learning whenever a skill needs more work. Every question they meet along the way has been reviewed against the same ten standards."
      primaryCta={{ label: "Start free", href: routes.startFree }}
      secondaryCta={{ label: "Explore learning", href: routes.learn }}
    >
      <HowItWorks />
      <Tutorials />
      <FirstWeek />
      <Quality />
      <Audiences />
    </MarketingPage>
  );
}
