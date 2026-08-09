/**
 * The hero's editorial mark: an indexed guide.
 *
 * Drawn rather than photographed, for two reasons. The featured guide
 * directly below is a photograph of a report under a magnifier, and a
 * second still life in the hero would compete with it for the same job.
 * And the hero is the page's LCP element — a vector weighing under 2KB
 * costs nothing to load, where a raster here would push the largest paint
 * behind a network round trip.
 *
 * The index tabs are the page's recurring device: they reappear as the 3px
 * category edge on every guide's picture and as the rail in the closing
 * band, so the same idea carries the hierarchy at three scales.
 *
 * Entirely decorative. The heading, the search field and the category
 * controls beside it carry every piece of meaning, so this is hidden from
 * assistive technology.
 */
export function HubHeroVisual({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 320 210"
      className={className}
      role="presentation"
    >
      {/* Two sheets behind the front one — a library, not a page. */}
      <rect x="34" y="14" width="230" height="176" rx="12" fill="#ffffff" opacity="0.55" />
      <rect x="28" y="20" width="234" height="176" rx="12" fill="#ffffff" opacity="0.8" />
      <rect
        x="22"
        y="26"
        width="238"
        height="172"
        rx="12"
        fill="#ffffff"
        stroke="var(--mm-line)"
      />

      {/* Index tabs down the right edge: two quiet, one ember, one brand. */}
      <rect x="252" y="44" width="26" height="20" rx="5" fill="var(--mm-lilac)" opacity="0.55" />
      <rect x="252" y="72" width="26" height="20" rx="5" fill="var(--mm-lilac)" />
      <rect x="252" y="100" width="26" height="20" rx="5" fill="var(--mm-ember)" />
      <rect x="252" y="128" width="26" height="20" rx="5" fill="var(--mm-brand)" />

      {/* Title block. */}
      <rect x="42" y="44" width="74" height="9" rx="4.5" fill="var(--mm-brand)" />
      <rect x="42" y="62" width="176" height="6" rx="3" fill="var(--mm-line)" />
      <rect x="42" y="74" width="150" height="6" rx="3" fill="var(--mm-line)" />

      {/* The highlighted passage — "the bit you came back for". */}
      <rect x="36" y="90" width="192" height="20" rx="6" fill="var(--mm-tint)" />
      <rect x="42" y="97" width="120" height="6" rx="3" fill="var(--mm-brand-mid)" />

      <rect x="42" y="120" width="168" height="6" rx="3" fill="var(--mm-line)" />
      <rect x="42" y="132" width="132" height="6" rx="3" fill="var(--mm-line)" />

      {/* A worked example, reduced to its shape. */}
      <rect x="42" y="152" width="14" height="22" rx="3" fill="var(--mm-lilac)" />
      <rect x="62" y="144" width="14" height="30" rx="3" fill="var(--mm-lilac)" />
      <rect x="82" y="158" width="14" height="16" rx="3" fill="var(--mm-lilac)" />
      <rect x="102" y="138" width="14" height="36" rx="3" fill="var(--mm-ember)" />
      <rect x="122" y="150" width="14" height="24" rx="3" fill="var(--mm-lilac)" />

      {/* A saved card, lifted off the stack. */}
      <rect
        x="150"
        y="146"
        width="96"
        height="42"
        rx="9"
        fill="#ffffff"
        stroke="var(--mm-tint-line)"
      />
      <circle cx="166" cy="160" r="5" fill="var(--mm-brand)" />
      <rect x="178" y="156" width="52" height="6" rx="3" fill="var(--mm-lilac)" />
      <rect x="162" y="172" width="68" height="5" rx="2.5" fill="var(--mm-line)" />
    </svg>
  );
}
