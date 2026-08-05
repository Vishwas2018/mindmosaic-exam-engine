import type { Metadata } from "next";

import { MarketingPage } from "@/features/landing/components/MarketingPage";
import { Programmes } from "@/features/landing/components/Programmes";
import { QuestionTypes } from "@/features/landing/components/QuestionTypes";
import { routes } from "@/features/landing/content";

export const metadata: Metadata = {
  title: "Practice",
  description:
    "Focused practice by year, subject or single skill, with a worked explanation after every question. Guest practice is free and needs no account.",
};

export default function AssessmentsPage() {
  return (
    <MarketingPage
      eyebrow="Practice"
      title="Practise by year, subject or single skill."
      intro="Submit an answer and the worked explanation follows, with retry and review available on every question. Practice runs in the browser as a guest — no account, and nothing about a guest session is stored on our servers."
      primaryCta={{ label: "Start practising", href: routes.startFree }}
      secondaryCta={{ label: "See exam preparation", href: routes.examPrep }}
    >
      <QuestionTypes />
      <Programmes />
    </MarketingPage>
  );
}
