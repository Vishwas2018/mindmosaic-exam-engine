import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

interface SubjectHubHeaderProps {
  subjectName: string;
  tagline: string;
  lessonCount: number;
  strandCount: number;
  accent: "primary" | "teal";
  icon: LucideIcon;
}

const ACCENT_CLASSES = {
  primary: { tint: "bg-primary-tint", text: "text-primary", border: "border-primary/20", glow: "from-primary-tint/60" },
  teal: { tint: "bg-teal-light", text: "text-teal-accent", border: "border-teal-border", glow: "from-teal-light/60" },
} as const;

/** Hero header for a single-subject Learn hub page (Mathematics / English). */
export function SubjectHubHeader({
  subjectName,
  tagline,
  lessonCount,
  strandCount,
  accent,
  icon: Icon,
}: SubjectHubHeaderProps) {
  const tone = ACCENT_CLASSES[accent];

  return (
    <div className="flex flex-col gap-4 pb-4">
      <Link
        href="/student/learn"
        className="inline-flex w-fit items-center gap-1.5 font-vietnam text-sm font-bold text-plum-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Curriculum Learn Hub
      </Link>

      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-white p-6 shadow-warm-card md:p-8">
        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br ${tone.glow} to-transparent blur-3xl`}
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${tone.border} ${tone.tint} ${tone.text}`}>
              <Icon className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-jakarta text-2xl font-extrabold tracking-tight text-plum-dark md:text-3xl">
                {subjectName}
              </h1>
              <p className="mt-1.5 max-w-xl font-vietnam text-plum-muted">{tagline}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl bg-surface-container-low p-3">
            <div className="px-3 py-1 text-left">
              <div className="font-jakarta text-xl font-bold text-plum-dark">{lessonCount}</div>
              <div className="font-vietnam text-[11px] font-semibold uppercase tracking-wider text-plum-muted">
                Lessons
              </div>
            </div>
            <div className="h-8 w-px bg-parchment-border" />
            <div className="px-3 py-1 text-left">
              <div className={`font-jakarta text-xl font-bold ${tone.text}`}>{strandCount}</div>
              <div className="font-vietnam text-[11px] font-semibold uppercase tracking-wider text-plum-muted">
                Strands
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
