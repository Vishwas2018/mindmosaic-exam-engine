import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ExploreProgramsSection() {
  return (
    <section aria-labelledby="explore-programs-heading" className="flex flex-col gap-5 pb-4">
      <div>
        <h2
          id="explore-programs-heading"
          className="font-jakarta font-extrabold text-xl md:text-2xl text-plum-dark tracking-tight"
        >
          Explore MindMosaic
        </h2>
        <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-0.5">
          Core curriculum learning, national assessments, and specialised pathways
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Curriculum Learning */}
        <div className="bg-white rounded-2xl border border-parchment-border shadow-warm-card hover:shadow-warm-elevated hover:border-primary/40 flex flex-col justify-between overflow-hidden transition-all group">
          {/* Bespoke Rich Editorial SVG Header */}
          <div className="h-44 bg-gradient-to-br from-primary-tint/70 via-purple-50 to-white flex items-center justify-center p-4 border-b border-parchment-border/70 relative">
            <svg
              className="w-full h-full max-w-[240px]"
              fill="none"
              viewBox="0 0 240 130"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Stacked Textbooks */}
              <rect fill="#EBE6DC" height="18" rx="3" stroke="#7B7484" width="100" x="35" y="80" />
              <rect fill="#5925A8" height="16" rx="3" width="106" x="30" y="65" />
              <rect fill="#FFFFFF" height="3" opacity="0.4" width="94" x="36" y="68" />
              <rect fill="#FF555A" height="18" rx="3" width="92" x="38" y="48" />
              <rect fill="#FFFFFF" height="3" opacity="0.5" width="80" x="44" y="52" />
              {/* Open Protractor & Compass */}
              <path d="M125 90 A 45 45 0 0 1 215 90 Z" fill="#E6F7F5" stroke="#008579" strokeWidth="2" />
              <line stroke="#008579" strokeDasharray="2 2" strokeWidth="1.5" x1="170" x2="170" y1="90" y2="52" />
              <circle cx="170" cy="90" fill="#008579" r="3" />
              {/* Ruler / drafting pencil */}
              <g transform="rotate(28 170 45)">
                <rect fill="#5925A8" height="10" rx="2" width="46" x="155" y="30" />
                <polygon fill="#EBE6DC" points="155,30 144,35 155,40" stroke="#7B7484" strokeWidth="0.5" />
                <polygon fill="#1E152A" points="147,33.5 144,35 147,36.5" />
              </g>
            </svg>
            <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 text-primary font-jakarta font-bold text-xs border border-primary/20 shadow-sm">
              Core Syllabus
            </span>
          </div>
          <div className="p-6 flex flex-col justify-between flex-1">
            <div>
              <h3 className="font-jakarta font-bold text-lg md:text-xl text-plum-dark leading-snug">
                Curriculum Learning
              </h3>
              <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-2.5 leading-relaxed">
                Master Victorian &amp; Australian curriculum learning step-by-step with clear worked examples.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-parchment-border/70">
              <Link
                className="h-11 px-4 rounded-xl bg-parchment-subtle group-hover:bg-primary group-hover:text-white border border-parchment-border text-primary font-jakarta font-bold text-sm flex items-center justify-between transition-colors"
                href="/student/learn"
              >
                <span>Explore Curriculum</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* 2. NAPLAN */}
        <div className="bg-white rounded-2xl border border-parchment-border shadow-warm-card hover:shadow-warm-elevated hover:border-coral-accent/40 flex flex-col justify-between overflow-hidden transition-all group">
          {/* Bespoke Rich Editorial SVG Header */}
          <div className="h-44 bg-gradient-to-br from-coral-light/80 via-amber-50/40 to-white flex items-center justify-center p-4 border-b border-parchment-border/70 relative">
            <svg
              className="w-full h-full max-w-[240px]"
              fill="none"
              viewBox="0 0 240 130"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Test paper sheet with multiple choice bubbles */}
              <rect fill="#FFFFFF" height="100" rx="6" stroke="#EBE6DC" strokeWidth="2" width="90" x="45" y="16" />
              <line stroke="#564B63" strokeLinecap="round" strokeWidth="2" x1="58" x2="110" y1="32" y2="32" />
              {/* Bubble rows */}
              <circle cx="62" cy="48" fill="#5925A8" r="4" />
              <circle cx="75" cy="48" fill="#FFFFFF" r="4" stroke="#EBE6DC" strokeWidth="1.5" />
              <circle cx="88" cy="48" fill="#FFFFFF" r="4" stroke="#EBE6DC" strokeWidth="1.5" />
              <circle cx="101" cy="48" fill="#FFFFFF" r="4" stroke="#EBE6DC" strokeWidth="1.5" />
              <circle cx="62" cy="64" fill="#FFFFFF" r="4" stroke="#EBE6DC" strokeWidth="1.5" />
              <circle cx="75" cy="64" fill="#FF555A" r="4" />
              <circle cx="88" cy="64" fill="#FFFFFF" r="4" stroke="#EBE6DC" strokeWidth="1.5" />
              <circle cx="101" cy="64" fill="#FFFFFF" r="4" stroke="#EBE6DC" strokeWidth="1.5" />
              <circle cx="62" cy="80" fill="#FFFFFF" r="4" stroke="#EBE6DC" strokeWidth="1.5" />
              <circle cx="75" cy="80" fill="#FFFFFF" r="4" stroke="#EBE6DC" strokeWidth="1.5" />
              <circle cx="88" cy="80" fill="#008579" r="4" />
              <circle cx="101" cy="80" fill="#FFFFFF" r="4" stroke="#EBE6DC" strokeWidth="1.5" />
              {/* Yellow/coral pencil */}
              <g transform="rotate(-30 155 70)">
                <rect fill="#FF555A" height="12" rx="2" width="55" x="135" y="45" />
                <polygon fill="#F7F4EC" points="135,45 120,51 135,57" stroke="#EBE6DC" />
                <polygon fill="#1E152A" points="124,49.5 120,51 124,52.5" />
              </g>
              {/* Calm clock / timer */}
              <circle cx="178" cy="40" fill="#FFFFFF" r="20" stroke="#FF555A" strokeWidth="2" />
              <line stroke="#1E152A" strokeLinecap="round" strokeWidth="2" x1="178" x2="178" y1="40" y2="28" />
              <line stroke="#FF555A" strokeLinecap="round" strokeWidth="2" x1="178" x2="188" y1="40" y2="40" />
            </svg>
            <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 text-coral-accent font-jakarta font-bold text-xs border border-coral-border shadow-sm">
              Years 3 &amp; 5
            </span>
          </div>
          <div className="p-6 flex flex-col justify-between flex-1">
            <div>
              <h3 className="font-jakarta font-bold text-lg md:text-xl text-plum-dark leading-snug">
                NAPLAN
              </h3>
              <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-2.5 leading-relaxed">
                Targeted Numeracy, Reading, Language Conventions and Writing practice with calm, unpressured format familiarisation.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-parchment-border/70">
              <Link
                className="h-11 px-4 rounded-xl bg-coral-light/50 group-hover:bg-coral-accent group-hover:text-white border border-coral-border text-coral-accent font-jakarta font-bold text-sm flex items-center justify-between transition-colors"
                href="/practice/naplan"
              >
                <span>Practise NAPLAN</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3. ICAS */}
        <div className="bg-white rounded-2xl border border-parchment-border shadow-warm-card hover:shadow-warm-elevated hover:border-teal-accent/40 flex flex-col justify-between overflow-hidden transition-all group">
          {/* Bespoke Rich Editorial SVG Header */}
          <div className="h-44 bg-gradient-to-br from-teal-light/80 via-emerald-50/40 to-white flex items-center justify-center p-4 border-b border-parchment-border/70 relative">
            <svg
              className="w-full h-full max-w-[240px]"
              fill="none"
              viewBox="0 0 240 130"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Academic medal/crest banner */}
              <circle cx="70" cy="55" fill="#008579" fillOpacity="0.1" r="28" stroke="#008579" strokeWidth="2" />
              <polygon fill="#008579" points="70,36 75,48 88,48 78,56 81,68 70,60 59,68 62,56 52,48 65,48" />
              {/* Science flask / lab beaker */}
              <path d="M150 32 L150 48 L130 84 A 6 6 0 0 0 135 94 L177 94 A 6 6 0 0 0 182 84 L162 48 L162 32 Z" fill="#FFFFFF" stroke="#5925A8" strokeWidth="2" />
              <path d="M136 78 L176 78 L180 86 A 4 4 0 0 1 176 90 L136 90 A 4 4 0 0 1 132 86 Z" fill="#5925A8" fillOpacity="0.25" />
              <circle cx="152" cy="70" fill="#5925A8" r="3" />
              <circle cx="160" cy="62" fill="#008579" r="2" />
              {/* Connected digital technology nodes */}
              <circle cx="198" cy="38" fill="#FF555A" r="5" />
              <circle cx="218" cy="62" fill="#008579" r="4" />
              <circle cx="204" cy="86" fill="#5925A8" r="5" />
              <line stroke="#7B7484" strokeWidth="1.5" x1="198" x2="218" y1="38" y2="62" />
              <line stroke="#7B7484" strokeWidth="1.5" x1="218" x2="204" y1="62" y2="86" />
            </svg>
            <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 text-teal-accent font-jakarta font-bold text-xs border border-teal-border shadow-sm">
              Competitions
            </span>
          </div>
          <div className="p-6 flex flex-col justify-between flex-1">
            <div>
              <h3 className="font-jakarta font-bold text-lg md:text-xl text-plum-dark leading-snug">
                ICAS
              </h3>
              <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-2.5 leading-relaxed">
                Practice Mathematics, English, Science, Spelling and Digital Technologies with high-order questions.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-parchment-border/70">
              <Link
                className="h-11 px-4 rounded-xl bg-teal-light/50 group-hover:bg-teal-accent group-hover:text-white border border-teal-border text-teal-accent font-jakarta font-bold text-sm flex items-center justify-between transition-colors"
                href="/practice/icas"
              >
                <span>Explore ICAS</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
