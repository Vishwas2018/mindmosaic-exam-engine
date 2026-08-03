import Link from "next/link";
import { ArrowRight, Clock3, Pencil } from "lucide-react";

import { Card } from "@/components/ui";

/*
 * The same two choices this screen has always offered — practice mode and
 * exam simulation, with the same claims about each. Only the framing
 * changed: they were a pair of full-height marketing cards under a centred
 * hero headline, which is the shape of a landing page. On a dashboard the
 * launcher is one panel among several, so each mode is now a compact row
 * that still carries its three defining facts.
 */
const MODES = [
  {
    key: "practice",
    subtitle: "Practice mode",
    title: "Build your skills",
    description:
      "Work through questions at your own pace with no timer. See your full review and explanations when you finish.",
    features: [
      "Untimed — take the time you need",
      "Choose subject, style and length",
      "Full review with explanations after submitting",
    ],
    cta: "Start practising",
    icon: Pencil,
    accent: "royal" as const,
  },
  {
    key: "exam",
    subtitle: "Exam simulation",
    title: "Test under pressure",
    description:
      "Sit a timed session mirroring NAPLAN or ICAS conditions. Results and full review when you finish.",
    features: [
      "Timed — mirrors real exam conditions",
      "No feedback during the session",
      "Server-scored results you can trust",
    ],
    cta: "Start an exam sim",
    icon: Clock3,
    accent: "orange" as const,
  },
];

export function SessionModeCards() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const isOrange = mode.accent === "orange";
        return (
          <li key={mode.key} className="contents">
            <Card variant="default" className="flex flex-col p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    isOrange ? "bg-royal-orange/10 text-warning" : "bg-royal/8 text-royal"
                  }`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
                    {mode.subtitle}
                  </p>
                  <h3 className="mt-0.5 text-lg font-black tracking-[-0.02em] text-ink">
                    {mode.title}
                  </h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted">{mode.description}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {mode.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm font-semibold text-ink"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        isOrange ? "bg-royal-orange" : "bg-royal"
                      }`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/practice"
                className={`mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 focus-visible:ring-offset-2 focus-visible:ring-offset-page ${
                  isOrange
                    ? "bg-royal-orange text-ink shadow-[0_10px_24px_rgba(255,138,0,0.2)]"
                    : "bg-royal text-white shadow-[0_10px_24px_color-mix(in_srgb,var(--purple)_20%,transparent)]"
                }`}
              >
                {mode.cta}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
