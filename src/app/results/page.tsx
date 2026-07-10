import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock3,
  RotateCcw,
  Sparkles,
  X,
  ClipboardCheck,
} from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { Badge, Card, ProgressBar, buttonClasses } from "@/components/ui";

const summaryCards = [
  { label: "Correct", value: "2", icon: Check, tone: "success" },
  { label: "Incorrect", value: "1", icon: X, tone: "error" },
  { label: "Manual review", value: "0", icon: ClipboardCheck, tone: "warning" },
] as const;

const breakdown = [
  { label: "Multiple choice", detail: "2 of 2 correct", value: 100, tone: "success" as const },
  { label: "Number entry", detail: "0 of 1 correct", value: 0, tone: "orange" as const },
] as const;

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-royal/8 bg-white">
        <div className="site-width flex min-h-20 items-center justify-between gap-4 py-3">
          <Link
            href="/"
            aria-label="MindMosaic home"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <MindMosaicLogo />
          </Link>
          <Badge variant="success">
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
            Sample complete
          </Badge>
        </div>
      </header>

      <main id="main-content" className="site-width py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <Badge variant="orange">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Great effort
            </Badge>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.045em] text-ink sm:text-5xl">
              Your results
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              This sample gives you a quick view of how MindMosaic turns each attempt
              into a clear next step.
            </p>
          </div>

          <Card className="mt-9 overflow-hidden" variant="default">
            <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
              <section className="flex flex-col items-center justify-center bg-royal px-6 py-10 text-white sm:py-12">
                <div
                  className="score-ring relative"
                  role="img"
                  aria-label="Score: 67 percent, 2 out of 3 questions correct"
                >
                  <div className="score-ring-content">
                    <span className="block text-4xl font-black tracking-[-0.04em] text-royal">
                      67%
                    </span>
                    <span className="mt-1 block text-sm font-bold text-muted">2 of 3</span>
                  </div>
                </div>
                <h2 className="mt-7 text-2xl font-black">A strong start</h2>
                <p className="mt-2 max-w-sm text-center text-sm leading-6 text-white/80">
                  You showed confidence with reading charts and unit conversion.
                </p>
              </section>

              <section className="p-6 sm:p-9" aria-labelledby="summary-heading">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-royal">
                      Sample assessment
                    </p>
                    <h2 id="summary-heading" className="mt-1 text-2xl font-black text-ink">
                      Performance summary
                    </h2>
                  </div>
                  <div className="inline-flex items-center gap-2 self-start rounded-xl bg-page px-4 py-3 text-sm font-bold text-muted">
                    <Clock3 aria-hidden="true" className="h-4 w-4 text-royal" />
                    Time taken: 4 min 18 sec
                  </div>
                </div>

                <dl className="mt-7 grid gap-3 sm:grid-cols-3">
                  {summaryCards.map((item) => {
                    const Icon = item.icon;
                    const toneClasses = {
                      success: "bg-success/10 text-success",
                      error: "bg-error/10 text-error",
                      warning: "bg-warning/10 text-warning",
                    }[item.tone];
                    return (
                      <div key={item.label} className="rounded-2xl border border-royal/8 p-4">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses}`}>
                          <Icon aria-hidden="true" className="h-4 w-4" />
                        </div>
                        <dd className="mt-4 text-2xl font-black text-ink">{item.value}</dd>
                        <dt className="mt-0.5 text-sm font-semibold text-muted">{item.label}</dt>
                      </div>
                    );
                  })}
                </dl>
              </section>
            </div>
          </Card>

          <Card className="mt-6 p-6 sm:p-8" variant="default">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <Badge variant="purple">Question-type breakdown</Badge>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-ink">
                  What to practise next
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-muted">
                Detailed recommendations and explanations will appear here in the next phase.
              </p>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {breakdown.map((item) => (
                <div key={item.label} className="rounded-2xl bg-page p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <h3 className="font-extrabold text-ink">{item.label}</h3>
                    <span className="text-sm font-bold text-muted">{item.detail}</span>
                  </div>
                  <ProgressBar
                    value={item.value}
                    label={`${item.label} accuracy`}
                    tone={item.tone}
                    className="[&>div:first-child]:sr-only"
                  />
                </div>
              ))}
            </div>
          </Card>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className={buttonClasses({ variant: "secondary", size: "lg" })}
            >
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
              Return to home
            </Link>
            <Link
              href="/exam"
              className={buttonClasses({ variant: "primary", size: "lg" })}
            >
              <RotateCcw aria-hidden="true" className="h-5 w-5" />
              Try sample again
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
