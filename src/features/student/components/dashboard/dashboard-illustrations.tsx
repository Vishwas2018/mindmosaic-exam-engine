/**
 * Decorative line-art illustrations ported from the Stitch dashboard
 * mockup's "Quick actions" / "Explore everything" cards. Purely
 * decorative (not data), so they're kept close to the source SVG paths.
 * Colours are literal hex that already equal a mapped design token
 * (--primary #5925A8, --coral-accent #ff555a family, --amber-accent
 * #d97706 family) — see globals.css's Stitch token block.
 */

type IllustrationProps = { className?: string };

export function CurriculumIllustration({ className = "w-24 h-20" }: IllustrationProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 96 80" aria-hidden="true">
      <path
        d="M12 56 C 24 50, 44 50, 48 56 C 52 50, 72 50, 84 56 L 84 28 C 72 22, 52 22, 48 28 C 44 22, 24 22, 12 28 Z"
        fill="#ffffff"
        stroke="#5925A8"
        strokeWidth="1.8"
      />
      <path d="M48 28 L 48 56" stroke="#5925A8" strokeWidth="1.8" />
      <path d="M18 34 C 28 30, 40 30, 44 33" stroke="#5925A8" strokeOpacity="0.4" strokeLinecap="round" strokeWidth="1.4" />
      <path d="M18 40 C 28 36, 40 36, 44 39" stroke="#5925A8" strokeOpacity="0.4" strokeLinecap="round" strokeWidth="1.4" />
      <path d="M52 33 C 56 30, 68 30, 78 34" stroke="#5925A8" strokeOpacity="0.4" strokeLinecap="round" strokeWidth="1.4" />
      <path d="M52 39 C 56 36, 68 36, 78 40" stroke="#5925A8" strokeOpacity="0.4" strokeLinecap="round" strokeWidth="1.4" />
      <polygon fill="#5925A8" fillOpacity="0.15" points="68,10 78,16 78,26 68,20" stroke="#5925A8" strokeWidth="1.2" />
      <polygon fill="#ff555a" fillOpacity="0.2" points="68,10 58,16 68,20" stroke="#ff555a" strokeWidth="1.2" />
      <circle cx="24" cy="18" fill="#5925A8" r="3" />
      <circle cx="32" cy="14" fill="#ff555a" r="2" />
    </svg>
  );
}

export function NaplanIllustration({ className = "w-24 h-20" }: IllustrationProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 96 80" aria-hidden="true">
      <rect fill="#ffffff" height="58" rx="3" stroke="#b45309" strokeWidth="1.6" width="40" x="30" y="10" />
      <line stroke="#b45309" strokeLinecap="round" strokeWidth="2" x1="36" x2="52" y1="20" y2="20" />
      <circle cx="38" cy="28" fill="#22c55e" r="2.5" />
      <circle cx="46" cy="28" r="2" stroke="#b45309" strokeWidth="1" />
      <circle cx="54" cy="28" r="2" stroke="#b45309" strokeWidth="1" />
      <circle cx="38" cy="37" r="2" stroke="#b45309" strokeWidth="1" />
      <circle cx="46" cy="37" fill="#22c55e" r="2.5" />
      <circle cx="54" cy="37" r="2" stroke="#b45309" strokeWidth="1" />
      <circle cx="38" cy="46" fill="#22c55e" r="2.5" />
      <circle cx="46" cy="46" r="2" stroke="#b45309" strokeWidth="1" />
      <circle cx="54" cy="46" r="2" stroke="#b45309" strokeWidth="1" />
      <line stroke="#e2e8f0" strokeLinecap="round" strokeWidth="1.5" x1="36" x2="64" y1="55" y2="55" />
      <g transform="rotate(-35 24 55)">
        <rect fill="#f59e0b" height="22" rx="1" stroke="#b45309" strokeWidth="1.2" width="6" x="16" y="40" />
        <polygon fill="#fed7aa" points="16,62 19,69 22,62" stroke="#b45309" strokeWidth="1" />
        <polygon fill="#1e293b" points="18,66 19,69 20,66" />
      </g>
      <circle cx="75" cy="24" fill="#fff7ed" r="10" stroke="#ea580c" strokeWidth="1.4" />
      <path d="M72 24 L74 26 L79 21" stroke="#ea580c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function IcasIllustration({ className = "w-24 h-20" }: IllustrationProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 96 80" aria-hidden="true">
      <path d="M48 30 L40 58 L48 53 L56 58 Z" fill="#ff555a" fillOpacity="0.75" stroke="#b71f2d" strokeWidth="1.2" />
      <circle cx="48" cy="28" fill="#ffffff" r="16" stroke="#5925A8" strokeWidth="2" />
      <circle cx="48" cy="28" fill="#fef7ff" r="13" stroke="#d7bafe" strokeWidth="1" />
      <polygon
        fill="#eab308"
        points="48,19 50.5,25 57,25 52,29 54,35 48,31 42,35 44,29 39,25 45.5,25"
        stroke="#ca8a04"
        strokeWidth="0.8"
      />
      <ellipse cx="74" cy="26" rx="11" ry="5" stroke="#5925A8" strokeDasharray="3 2" strokeWidth="1.2" transform="rotate(30 74 26)" />
      <ellipse cx="74" cy="26" rx="11" ry="5" stroke="#5925A8" strokeDasharray="3 2" strokeWidth="1.2" transform="rotate(-30 74 26)" />
      <circle cx="74" cy="26" fill="#5925A8" r="2.5" />
      <text fill="#5925A8" fontFamily="serif" fontSize="16" fontWeight="bold" opacity="0.7" x="20" y="32">
        &#8721;
      </text>
    </svg>
  );
}
