/**
 * Deterministic server-rendered SVG charts for the admin dashboards.
 * Structured data in, static markup out — no client JS, no chart library,
 * matching the repo rule that visuals are deterministic HTML/SVG. Each
 * chart is exposed as role="img" with a written summary for screen
 * readers; the visible numbers also appear in adjacent tables.
 */

export interface ChartPoint {
  label: string;
  value: number;
}

const LINE_W = 640;
const LINE_H = 220;
const PAD = { top: 16, right: 16, bottom: 30, left: 40 };

export function TrendLineChart({
  points,
  ariaLabel,
  unit = "%",
  maxValue,
}: {
  points: readonly ChartPoint[];
  ariaLabel: string;
  unit?: string;
  maxValue?: number;
}) {
  if (points.length === 0) return null;

  const innerW = LINE_W - PAD.left - PAD.right;
  const innerH = LINE_H - PAD.top - PAD.bottom;
  const values = points.map((point) => point.value);
  const max = maxValue ?? Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const coords = points.map((point, index) => ({
    x: PAD.left + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW),
    y: PAD.top + innerH - ((point.value - min) / range) * innerH,
  }));
  const path = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x.toFixed(1)},${coord.y.toFixed(1)}`)
    .join(" ");
  const area = `${path} L${coords[coords.length - 1].x.toFixed(1)},${PAD.top + innerH} L${coords[0].x.toFixed(1)},${PAD.top + innerH} Z`;

  const gridLines = [0, 1, 2, 3, 4].map((step) => {
    const y = PAD.top + (innerH / 4) * step;
    const value = Math.round(max - (range / 4) * step);
    return { y, value };
  });

  return (
    <svg
      viewBox={`0 0 ${LINE_W} ${LINE_H}`}
      className="w-full"
      role="img"
      aria-label={ariaLabel}
    >
      <title>{ariaLabel}</title>
      {gridLines.map((line) => (
        <g key={line.y}>
          <line
            x1={PAD.left}
            y1={line.y}
            x2={LINE_W - PAD.right}
            y2={line.y}
            stroke="rgba(75,46,131,0.08)"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 8}
            y={line.y + 4}
            textAnchor="end"
            fontSize="10"
            fill="#526074"
          >
            {line.value}
            {unit}
          </text>
        </g>
      ))}
      <path d={area} fill="rgba(75,46,131,0.10)" />
      <path
        d={path}
        fill="none"
        stroke="#4b2e83"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((coord, index) => (
        <g key={points[index].label}>
          <circle
            cx={coord.x}
            cy={coord.y}
            r="4"
            fill="white"
            stroke="#4b2e83"
            strokeWidth="2"
          />
          <text
            x={coord.x}
            y={PAD.top + innerH + 18}
            textAnchor="middle"
            fontSize="10"
            fill="#526074"
          >
            {points[index].label}
          </text>
        </g>
      ))}
    </svg>
  );
}

const BAR_W = 640;
const BAR_H = 200;

export function BandBarChart({
  bands,
  ariaLabel,
}: {
  bands: readonly ChartPoint[];
  ariaLabel: string;
}) {
  if (bands.length === 0) return null;

  const innerW = BAR_W - PAD.left - PAD.right;
  const innerH = BAR_H - PAD.top - PAD.bottom;
  const max = Math.max(...bands.map((band) => band.value), 1);
  const barWidth = (innerW / bands.length) * 0.66;
  const gap = (innerW - barWidth * bands.length) / (bands.length + 1);

  return (
    <svg
      viewBox={`0 0 ${BAR_W} ${BAR_H}`}
      className="w-full"
      role="img"
      aria-label={ariaLabel}
    >
      <title>{ariaLabel}</title>
      {bands.map((band, index) => {
        const height = (band.value / max) * innerH;
        const x = PAD.left + gap + (barWidth + gap) * index;
        const y = PAD.top + innerH - height;
        return (
          <g key={band.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(height, band.value > 0 ? 2 : 0)}
              rx="4"
              fill="#4b2e83"
              opacity="0.8"
            />
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#4b2e83"
            >
              {band.value}
            </text>
            <text
              x={x + barWidth / 2}
              y={PAD.top + innerH + 16}
              textAnchor="middle"
              fontSize="10"
              fill="#526074"
            >
              {band.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
