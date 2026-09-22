import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Medal } from "lucide-react";

import { CurriculumIllustration, IcasIllustration, NaplanIllustration } from "./dashboard-illustrations";

interface QuickActionCard {
  href: string;
  eyebrow: string;
  eyebrowSub: string;
  title: string;
  description: string;
  actionLabel: string;
  icon: typeof BookOpen;
  iconBoxClassName: string;
  gradientClassName: string;
  illustration: typeof CurriculumIllustration;
}

const CARDS: readonly QuickActionCard[] = [
  {
    href: "/student/learn",
    eyebrow: "Curriculum",
    eyebrowSub: "Core Syllabus",
    title: "Curriculum Learning",
    description: "Lessons across the Victorian Curriculum's Mathematics and English strands.",
    actionLabel: "Explore curriculum",
    icon: BookOpen,
    iconBoxClassName: "bg-mm-tint text-primary",
    gradientClassName: "from-purple-50 to-indigo-50 border-purple-100/80",
    illustration: CurriculumIllustration,
  },
  {
    href: "/practice/naplan",
    eyebrow: "Assessment",
    eyebrowSub: "Years 3 & 5",
    title: "NAPLAN",
    description: "Numeracy, reading, and language conventions practice in the NAPLAN style.",
    actionLabel: "Explore NAPLAN",
    icon: GraduationCap,
    iconBoxClassName: "bg-amber-50 text-amber-700",
    gradientClassName: "from-amber-50 to-orange-50 border-amber-100/80",
    illustration: NaplanIllustration,
  },
  {
    href: "/practice/icas",
    eyebrow: "Competition",
    eyebrowSub: "Years 3 & 5",
    title: "ICAS",
    description: "Higher-order problem solving and competition-style assessment practice.",
    actionLabel: "Explore ICAS",
    icon: Medal,
    iconBoxClassName: "bg-mm-tint text-primary",
    gradientClassName: "from-purple-50 to-pink-50 border-purple-100/80",
    illustration: IcasIllustration,
  },
];

export function QuickActionsSection() {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-mm-ink tracking-tight">
          Quick actions for you
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const Illustration = card.illustration;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-mm-line bg-white p-5 shadow-warm-sm transition-all hover:shadow-warm-card"
            >
              <div
                className={`relative mb-3.5 flex h-24 w-full items-center justify-between overflow-hidden rounded-xl border bg-gradient-to-r p-2.5 ${card.gradientClassName}`}
              >
                <div className="relative z-10 flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {card.eyebrow}
                  </span>
                  <span className="mt-0.5 text-xs font-semibold text-mm-ink">{card.eyebrowSub}</span>
                </div>
                <Illustration className="h-24 w-24 shrink-0" />
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBoxClassName}`}>
                    <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                  </div>
                  <span className="font-[family-name:var(--font-display)] text-sm font-bold text-mm-ink">
                    {card.title}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-mm-muted">{card.description}</p>
              </div>
              <div className="mt-4 border-t border-mm-line/60 pt-4">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                  {card.actionLabel}
                  <ArrowRight aria-hidden="true" className="h-[15px] w-[15px]" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
