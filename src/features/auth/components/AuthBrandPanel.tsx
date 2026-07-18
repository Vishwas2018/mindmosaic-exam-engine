import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";

const HIGHLIGHTS = [
  "NAPLAN practice papers (Years 3–9)",
  "ICAS sample questions across all subjects",
  "Instant scoring and worked solutions",
  "An adaptive engine that adjusts to each learner",
] as const;

/**
 * The left marketing panel of the auth screen. Also carries the guest path —
 * "Try sample exams" — because signing in is optional (guests-allowed).
 */
export function AuthBrandPanel() {
  return (
    <div className="flex h-full flex-col justify-between gap-10 rounded-3xl bg-royal p-8 text-white sm:p-10">
      <div>
        <Link href="/" className="inline-flex" aria-label="MindMosaic home">
          <MindMosaicLogo className="h-9 w-auto text-white" />
        </Link>
        <h2 className="mt-10 text-3xl font-black leading-tight tracking-[-0.03em] sm:text-4xl">
          Thoughtful practice,
          <br />
          real progress.
        </h2>
        <p className="mt-4 max-w-sm text-base text-white/80">
          Pick up right where you left off and keep your streak alive.
        </p>

        <ul className="mt-8 flex flex-col gap-3">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm font-semibold text-white/90">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Check aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-white/10 p-5">
        <p className="text-sm font-semibold text-white/85">Just exploring?</p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-1.5 text-base font-black text-white hover:gap-2.5"
        >
          Try sample exams
          <ArrowRight aria-hidden="true" className="h-4 w-4 transition-all" />
        </Link>
      </div>
    </div>
  );
}
