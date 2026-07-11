import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  Check,
  Clock3,
  Sparkles,
  Target,
} from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import {
  Badge,
  Card,
  CardContent,
  buttonClasses,
} from "@/components/ui";
import { ExamConfigurator } from "@/features/exam-engine/components/ExamConfigurator";

const learningSteps = [
  { label: "Read carefully", detail: "Spot the useful clues", icon: BookOpenCheck },
  { label: "Think it through", detail: "Choose your strategy", icon: Brain },
  { label: "See your progress", detail: "Learn from every answer", icon: BarChart3 },
] as const;

const grades = [
  {
    year: "Grade 3",
    description:
      "Build strong foundations with clear language, guided pacing and age-appropriate challenge.",
    detail: "Foundation skills",
    icon: Sparkles,
  },
  {
    year: "Grade 5",
    description:
      "Stretch reasoning and problem-solving with richer, multi-step questions and visuals.",
    detail: "Growing confidence",
    icon: Target,
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-page">
      <header className="relative z-20 border-b border-royal/8 bg-white/80 backdrop-blur-xl">
        <div className="site-width flex min-h-20 items-center justify-between gap-4 py-3">
          <Link
            href="/"
            aria-label="MindMosaic home"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <MindMosaicLogo />
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/showcase"
              className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-bold text-muted transition hover:bg-royal/5 hover:text-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 sm:inline-flex"
            >
              Renderer showcase
            </Link>
            {/*
              Same-page anchors use plain <a> tags: routing them through
              next/link prefetches the current route again, and those
              redundant in-flight fetches can race a router.push commit.
            */}
            <a
              href="#exam-setup"
              className={buttonClasses({ variant: "primary", size: "sm" })}
            >
              Start practice
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="surface-grid relative border-b border-royal/8 py-16 sm:py-20 lg:py-24">
          <span
            aria-hidden="true"
            className="mosaic-halo -left-20 top-28 h-64 w-64 bg-royal/8"
          />
          <span
            aria-hidden="true"
            className="mosaic-halo -right-20 top-0 h-72 w-72 bg-royal-orange/10"
          />

          <div className="site-width relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <Badge variant="orange" className="mb-6">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                Original Australian practice
              </Badge>
              <h1 className="max-w-3xl text-[clamp(2.75rem,6vw,5.25rem)] font-black leading-[0.98] tracking-[-0.055em] text-ink">
                Practice with purpose. <span className="text-royal">Grow with confidence.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
                Thoughtful Grade 3 and Grade 5 practice for curious learners—designed
                to feel calm, clear and genuinely rewarding.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#exam-setup"
                  className={buttonClasses({ variant: "orange", size: "lg" })}
                >
                  Set up an exam
                  <ArrowRight aria-hidden="true" className="h-5 w-5" />
                </a>
                <Link
                  href="/showcase"
                  className={buttonClasses({ variant: "secondary", size: "lg" })}
                >
                  View renderer showcase
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-muted">
                <span className="inline-flex items-center gap-2">
                  <Check aria-hidden="true" className="h-4 w-4 text-success" />
                  100 original practice questions
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check aria-hidden="true" className="h-4 w-4 text-success" />
                  Timed and untimed modes
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check aria-hidden="true" className="h-4 w-4 text-success" />
                  No sign-in needed
                </span>
              </div>
            </div>

            <Card className="home-preview-card p-3 sm:p-5" variant="default">
              <CardContent className="relative p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant="purple">Sample journey</Badge>
                    <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-ink sm:text-3xl">
                      A calmer way to practise
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Clear steps keep learners focused on the thinking, not the interface.
                    </p>
                  </div>
                  <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-royal text-white shadow-[0_12px_28px_rgba(75,46,131,0.22)] sm:flex">
                    <Brain aria-hidden="true" className="h-7 w-7" />
                  </div>
                </div>

                <ol className="mt-7 space-y-3">
                  {learningSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <li
                        key={step.label}
                        className="flex items-center gap-4 rounded-2xl border border-royal/8 bg-white/85 p-4 shadow-[0_8px_20px_rgba(49,32,86,0.05)]"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/8 text-royal">
                          <Icon aria-hidden="true" className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-extrabold text-ink">
                            {step.label}
                          </span>
                          <span className="mt-0.5 block text-sm text-muted">
                            {step.detail}
                          </span>
                        </span>
                        <span className="text-sm font-black tabular-nums text-royal/45">
                          0{index + 1}
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-royal px-5 py-4 text-white">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <Clock3 aria-hidden="true" className="h-4 w-4 text-royal-orange" />
                    Sample time
                  </span>
                  <span className="text-lg font-black tabular-nums">About 5 min</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section
          id="exam-setup"
          className="site-width scroll-mt-6 py-16 sm:py-20"
          aria-labelledby="exam-setup-heading"
        >
          <h2 id="exam-setup-heading" className="sr-only">
            Set up a practice exam
          </h2>
          <Suspense
            fallback={
              <Card className="p-8" variant="default">
                <p className="text-sm font-semibold text-muted">
                  Loading exam setup…
                </p>
              </Card>
            }
          >
            <ExamConfigurator />
          </Suspense>
        </section>

        <section className="site-width pb-16 sm:pb-20" aria-labelledby="choose-grade-heading">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <Badge variant="purple">Choose a level</Badge>
              <h2
                id="choose-grade-heading"
                className="mt-4 text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl"
              >
                Practice that meets learners where they are.
              </h2>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Available assessment styles">
              <Badge variant="orange">NAPLAN-style</Badge>
              <Badge variant="purple">ICAS-style</Badge>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {grades.map((grade, index) => {
              const Icon = grade.icon;
              return (
                <Card key={grade.year} className="grade-card p-7 sm:p-8" variant="default">
                  <div className="relative z-10 flex h-full flex-col">
                    <div className="flex items-center justify-between gap-4">
                      <span
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                          index === 0
                            ? "bg-royal/8 text-royal"
                            : "bg-royal-orange/10 text-warning"
                        }`}
                      >
                        <Icon aria-hidden="true" className="h-7 w-7" />
                      </span>
                      <Badge variant={index === 0 ? "purple" : "orange"}>
                        {grade.detail}
                      </Badge>
                    </div>
                    <h3 className="mt-7 text-3xl font-black tracking-[-0.04em] text-ink">
                      {grade.year}
                    </h3>
                    <p className="mt-3 max-w-xl flex-1 text-base leading-7 text-muted">
                      {grade.description}
                    </p>
                    <a
                      href="#exam-setup"
                      className="mt-7 inline-flex min-h-12 items-center gap-2 self-start rounded-xl font-extrabold text-royal transition hover:gap-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
                    >
                      Start practising
                      <ArrowRight aria-hidden="true" className="h-5 w-5" />
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-royal/8 bg-white">
        <div className="site-width flex flex-col items-start justify-between gap-4 py-7 text-sm text-muted sm:flex-row sm:items-center">
          <MindMosaicLogo />
          <p>Original practice content · Australian English · Built for thoughtful learning</p>
        </div>
      </footer>
    </div>
  );
}
