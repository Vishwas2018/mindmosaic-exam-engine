import { Info } from "lucide-react";

export function TermSequencingNotice() {
  return (
    <div
      role="region"
      aria-label="Important curriculum sequencing note"
      className="relative flex items-start gap-3.5 rounded-2xl border border-royal/15 bg-royal/5 p-4 sm:p-5 text-sm text-ink shadow-sm"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
        <Info className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="font-extrabold text-royal">
          Schools set their own term-by-term sequencing
        </p>
        <p className="text-muted leading-relaxed text-xs sm:text-sm">
          Victorian Curriculum levels define the overall knowledge, understanding, and skills expected by the end of each stage. However, the exact order, timing, and grouping of topics across Terms 1 to 4 is determined independently by each school.
        </p>
      </div>
    </div>
  );
}
