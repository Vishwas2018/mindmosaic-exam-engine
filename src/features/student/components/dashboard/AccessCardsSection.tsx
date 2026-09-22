import Link from "next/link";
import { ArrowRight, GraduationCap, Medal, School } from "lucide-react";

interface AccessCard {
  href: string;
  chip: string;
  title: string;
  description: string;
  icon: typeof School;
  iconBoxClassName: string;
  metricLabel: string;
  metricValue: string;
  /** Placeholder second metric to match the Stitch mock — not backed by real state yet. */
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  actionLabel: string;
  wash: string;
}

export function AccessCardsSection({
  mathematicsLessonCount,
  naplanAttemptCount,
  icasAttemptCount,
}: {
  mathematicsLessonCount: number;
  naplanAttemptCount: number;
  icasAttemptCount: number;
}) {
  const cards: readonly AccessCard[] = [
    {
      href: "/student/learn/mathematics",
      chip: "Mathematics",
      title: "Curriculum Learning",
      description: "Victorian Curriculum lessons across Mathematics and English strands.",
      icon: School,
      iconBoxClassName: "bg-primary text-white",
      metricLabel: "Mathematics lessons",
      metricValue: `${mathematicsLessonCount} available`,
      secondaryMetricLabel: "Curriculum Sync",
      secondaryMetricValue: "100% Up to date",
      actionLabel: "Enter Curriculum Hub",
      wash: "from-mm-tint/70 to-white ring-primary/10",
    },
    {
      href: "/practice/naplan",
      chip: "Years 3 & 5",
      title: "NAPLAN Preparation",
      description: "National assessment-style numeracy, reading, and language practice.",
      icon: GraduationCap,
      iconBoxClassName: "bg-amber-700 text-white",
      metricLabel: "Sessions completed",
      metricValue: `${naplanAttemptCount}`,
      secondaryMetricLabel: "Test Mode",
      secondaryMetricValue: "Authentic Timed",
      actionLabel: "Launch NAPLAN Prep",
      wash: "from-amber-50/60 to-white ring-amber-500/10",
    },
    {
      href: "/practice/icas",
      chip: "Years 3 & 5",
      title: "ICAS Competition Suite",
      description: "Higher-order problem solving and competition-style assessment practice.",
      icon: Medal,
      iconBoxClassName: "bg-primary text-white",
      metricLabel: "Sessions completed",
      metricValue: `${icasAttemptCount}`,
      secondaryMetricLabel: "Challenger Sets",
      secondaryMetricValue: "Unlocked",
      actionLabel: "Enter ICAS Arena",
      wash: "from-mm-tint/70 to-white ring-primary/10",
    },
  ];

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-mm-ink tracking-tight">
            Your MindMosaic access
          </h2>
          <p className="text-xs text-mm-muted">Included in your current learning pathway</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.href}
              className={`relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b p-5 shadow-warm-sm ring-1 transition-all hover:shadow-warm-card ${card.wash}`}
            >
              <div>
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-mm-line/60 pb-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active Pathway
                  </div>
                  <span className="rounded-md border border-mm-line bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                    {card.chip}
                  </span>
                </div>
                <div className="mb-3 flex items-start gap-3.5">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-inner ${card.iconBoxClassName}`}>
                    <Icon aria-hidden="true" className="h-[22px] w-[22px]" />
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-base font-bold leading-snug text-mm-ink">
                      {card.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-mm-muted">{card.description}</p>
                  </div>
                </div>
                <div className="my-3 grid grid-cols-2 gap-2.5 rounded-xl border border-mm-line/80 bg-white/90 p-2.5 text-xs">
                  <div>
                    <span className="block text-[10px] font-medium text-mm-muted">{card.metricLabel}</span>
                    <span className="text-[12px] font-semibold text-mm-ink">{card.metricValue}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-medium text-mm-muted">{card.secondaryMetricLabel}</span>
                    <span className="text-[12px] font-semibold text-mm-ink">{card.secondaryMetricValue}</span>
                  </div>
                </div>
              </div>
              <div className="mt-1 pt-1">
                <Link
                  href={card.href}
                  className="flex min-h-11 w-full items-center justify-between rounded-btn border border-primary/30 bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-xs transition-all hover:border-primary hover:bg-mm-tint"
                >
                  {card.actionLabel}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
