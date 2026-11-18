import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Practice Studio heading (Claude Design student artboard 10): breadcrumb, 36px title and one plain sentence.
 * No adaptive-pacing or difficulty claims; practice sets are not recorded.
 */
export function PracticeStudioHero({
  yearLevel,
  isFirstVisit,
}: {
  yearLevel: 3 | 5;
  isFirstVisit: boolean;
}) {
  return (
    <section aria-labelledby="practice-studio-title">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-mm-muted">
        <Link href="/student" className="inline-flex min-h-11 items-center hover:text-mm-brand hover:underline">
          My Space
        </Link>
        <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
        <span aria-current="page">Practice Studio</span>
      </nav>
      <h1
        id="practice-studio-title"
        className="mt-2 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-[1.15] tracking-[-0.028em] text-mm-ink sm:text-4xl"
      >
        Practice Studio
      </h1>
      <p className="mt-2 max-w-[760px] text-[17px] leading-[1.6] text-mm-ink-soft">
        Choose what to practise. Every question shows you how it was worked out after you answer, and you can stop any
        time.
        {isFirstVisit ? ` Your Year ${yearLevel} options are below.` : ""}
      </p>
    </section>
  );
}
