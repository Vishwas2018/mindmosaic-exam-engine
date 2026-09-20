import Link from "next/link";
import { ArrowRight, BookOpen, Ruler } from "lucide-react";

export function LearnBySubjectSection() {
  return (
    <section aria-labelledby="learn-by-subject-heading" className="flex flex-col gap-4 pb-4">
      <div>
        <h2
          id="learn-by-subject-heading"
          className="font-jakarta font-extrabold text-xl md:text-2xl text-plum-dark tracking-tight"
        >
          Learn by subject
        </h2>
        <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-0.5">
          Direct entry to your primary curriculum subjects
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mathematics Card */}
        <div className="bg-white rounded-2xl border border-parchment-border p-7 shadow-warm-card flex flex-col justify-between hover:shadow-warm-elevated hover:border-primary/40 transition-all">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-tint text-primary flex items-center justify-center border border-primary/20 shadow-warm-sm">
                  <Ruler className="h-[30px] w-[30px]" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-jakarta font-bold text-2xl text-plum-dark">Mathematics</h3>
                  <p className="font-vietnam text-xs text-plum-muted mt-0.5">
                    Numbers, fractions, measurement, geometry, statistics and problem solving.
                  </p>
                </div>
              </div>

              {/* Bespoke geometric polyhedra / fraction strip mini SVG composition */}
              <div className="hidden sm:block shrink-0">
                <svg className="w-16 h-12 text-primary" fill="none" viewBox="0 0 64 48" aria-hidden="true">
                  <polygon fill="#5925A8" fillOpacity="0.15" points="32,6 56,18 32,30 8,18" stroke="#5925A8" strokeWidth="1.5" />
                  <polygon fill="#5925A8" fillOpacity="0.3" points="8,18 32,30 32,44 8,32" stroke="#5925A8" strokeWidth="1.5" />
                  <polygon fill="#5925A8" fillOpacity="0.45" points="56,18 32,30 32,44 56,32" stroke="#5925A8" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            {/* Strand tags */}
            <div className="flex flex-wrap gap-2 mt-5">
              <span className="px-3 py-1 rounded-lg bg-surface-container-low border border-parchment-border text-xs font-medium text-plum-dark">
                Number
              </span>
              <span className="px-3 py-1 rounded-lg bg-surface-container-low border border-parchment-border text-xs font-medium text-plum-dark">
                Algebra
              </span>
              <span className="px-3 py-1 rounded-lg bg-surface-container-low border border-parchment-border text-xs font-medium text-plum-dark">
                Measurement
              </span>
              <span className="px-3 py-1 rounded-lg bg-surface-container-low border border-parchment-border text-xs font-medium text-plum-dark">
                Space
              </span>
              <span className="px-3 py-1 rounded-lg bg-surface-container-low border border-parchment-border text-xs font-medium text-plum-dark">
                Statistics
              </span>
              <span className="px-3 py-1 rounded-lg bg-surface-container-low border border-parchment-border text-xs font-medium text-plum-dark">
                Probability
              </span>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-parchment-border/70">
            <Link
              className="h-11 px-5 rounded-xl bg-parchment-subtle hover:bg-primary hover:text-white border border-parchment-border text-primary font-jakarta font-bold text-sm flex items-center justify-between transition-all group"
              href="/student/learn/mathematics"
            >
              <span>Explore Mathematics</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* English Card */}
        <div className="bg-white rounded-2xl border border-parchment-border p-7 shadow-warm-card flex flex-col justify-between hover:shadow-warm-elevated hover:border-teal-accent/40 transition-all">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-light text-teal-accent flex items-center justify-center border border-teal-border shadow-warm-sm">
                  <BookOpen className="h-[30px] w-[30px]" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-jakarta font-bold text-2xl text-plum-dark">English</h3>
                  <p className="font-vietnam text-xs text-plum-muted mt-0.5">
                    Reading, writing, grammar, vocabulary and literature.
                  </p>
                </div>
              </div>

              {/* Bespoke open book & typography quill mini SVG composition */}
              <div className="hidden sm:block shrink-0">
                <svg className="w-16 h-12 text-teal-accent" fill="none" viewBox="0 0 64 48" aria-hidden="true">
                  <path
                    d="M8 12 C18 10, 28 14, 32 18 C36 14, 46 10, 56 12 L56 38 C46 36, 36 40, 32 42 C28 40, 18 36, 8 38 Z"
                    fill="#008579"
                    fillOpacity="0.15"
                    stroke="#008579"
                    strokeWidth="1.5"
                  />
                  <line stroke="#008579" strokeWidth="1.5" x1="32" x2="32" y1="18" y2="42" />
                  <path d="M46 16 L49 20" stroke="#FF555A" strokeLinecap="round" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Strand tags */}
            <div className="flex flex-wrap gap-2 mt-5">
              <span className="px-3 py-1 rounded-lg bg-surface-container-low border border-parchment-border text-xs font-medium text-plum-dark">
                Reading &amp; Literacy
              </span>
              <span className="px-3 py-1 rounded-lg bg-surface-container-low border border-parchment-border text-xs font-medium text-plum-dark">
                Literature
              </span>
              <span className="px-3 py-1 rounded-lg bg-surface-container-low border border-parchment-border text-xs font-medium text-plum-dark">
                Language &amp; Grammar
              </span>
              <span className="px-3 py-1 rounded-lg bg-surface-container-low border border-parchment-border text-xs font-medium text-plum-dark">
                Comprehension
              </span>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-parchment-border/70">
            <Link
              className="h-11 px-5 rounded-xl bg-parchment-subtle hover:bg-teal-accent hover:text-white border border-parchment-border text-teal-accent font-jakarta font-bold text-sm flex items-center justify-between transition-all group"
              href="/student/learn/english"
            >
              <span>Explore English</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
