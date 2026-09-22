/**
 * Small parametrized radial progress ring (stroke-dasharray on an SVG
 * circle), matching the Stitch dashboard mockup's Recent Activity ring.
 * Deliberately separate from globals.css's `.score-ring` utility, which is
 * a fixed 12rem/hardcoded-67% conic-gradient built for a different screen.
 */
export function RadialProgressRing({
  percent,
  size = 56,
  strokeWidth = 3.2,
  className,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${clamped}% complete`}
    >
      <svg viewBox="0 0 36 36" width={size} height={size} className="-rotate-90">
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="var(--mm-line)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
