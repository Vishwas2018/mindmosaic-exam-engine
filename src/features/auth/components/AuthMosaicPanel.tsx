import type { ReactNode } from "react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

import { MindMosaicLogo } from "@/components/branding";

/**
 * The brand panel on every authentication screen, matched to the Claude Design auth artboards
 * (docs/reviews/workspace-r1, "Parent sign-in", "Create a family account", "Student sign-in"):
 *
 *  - a 160° brand → brand-deep gradient,
 *  - a 1px white grid at 14% opacity,
 *  - a six-column field of white rounded tiles whose opacity steps 25 / 40 / 60 / 85 / 100 %, at 18%,
 *  - logo top-left, one 34px heading with a short line under it, vertically centred, and a 14px footnote.
 *
 * The tiles are static (the design does not animate them) and deterministic, so server and client markup agree.
 * Width comes from AuthShell: 46vw up to 620px from the `md` breakpoint; below it the panel is not shown.
 */

const TILE_OPACITY = [0.25, 0.4, 0.6, 0.85, 1] as const;
const TILE_COUNT = 54;

export interface AuthMosaicPanelProps {
  heading: string;
  /** One or two sentences under the heading. */
  intro?: string;
  /** Kept for callers written against the previous panel; not shown (the design has no kicker). */
  eyebrow?: string;
  /** Optional extra content under the intro. */
  children?: ReactNode;
  footnote?: string;
  /** Ignored: kept so older call sites compile. */
  columns?: 10 | 12;
  className?: string;
}

export const AUTH_PANEL_FOOTNOTE = "Original NAPLAN-style and ICAS-style practice for Years 3 and 5.";

export function AuthMosaicPanel({
  heading,
  intro,
  children,
  footnote = AUTH_PANEL_FOOTNOTE,
  className,
}: AuthMosaicPanelProps) {
  return (
    <aside
      className={twMerge(
        "relative isolate hidden flex-col overflow-hidden bg-[linear-gradient(160deg,var(--mm-brand)_0%,var(--mm-brand-deep)_100%)] px-[clamp(28px,3.6vw,52px)] py-12 text-white md:flex",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid grid-cols-6 content-start gap-2.5 p-7 opacity-[0.18]"
      >
        {Array.from({ length: TILE_COUNT }, (_, i) => (
          <i
            key={i}
            className="block aspect-square rounded-[10px] bg-white"
            style={{ opacity: TILE_OPACITY[i % TILE_OPACITY.length] }}
          />
        ))}
      </div>

      <Link
        href="/"
        aria-label="MindMosaic home"
        className="relative inline-flex min-h-11 w-fit items-center rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
      >
        <MindMosaicLogo variant="inverse" inverseTone="white" size="md" />
      </Link>

      <div className="relative my-auto max-w-[516px] py-10">
        <h2 className="font-[family-name:var(--font-display)] text-[34px] font-semibold leading-[1.15] tracking-[-0.02em]">
          {heading}
        </h2>
        {intro && <p className="mt-3 max-w-[420px] text-base leading-[1.6] text-white/86">{intro}</p>}
        {children}
      </div>

      <p className="relative text-sm leading-[1.5] text-white/70">{footnote}</p>
    </aside>
  );
}

/**
 * The whole auth page: panel on the left (md and up), the screen's card on the right, top-aligned so a taller or
 * shorter form only grows downwards and nothing above it moves when the role or step changes.
 * On phones the panel is replaced by a centred logo and the card goes flat, as in the mobile artboards.
 */
export function AuthShell({
  panel,
  children,
}: {
  panel: AuthMosaicPanelProps;
  children: ReactNode;
  /** Accepted for older call sites; every auth screen now shares one 420px column so nothing moves sideways. */
  wide?: boolean;
}) {
  return (
    <div className="mm-root flex min-h-screen bg-mm-tint-soft text-mm-ink">
      <AuthMosaicPanel {...panel} className="w-[38vw] max-w-[620px] shrink-0 lg:w-[46vw]" />
      <main
        id="main-content"
        className="flex min-w-0 flex-1 flex-col items-center px-4 pt-7 pb-12 sm:px-8 md:pt-10 lg:pt-14"
      >
        <Link
          href="/"
          aria-label="MindMosaic home"
          className="mb-4 inline-flex min-h-11 items-center rounded-xl md:hidden"
        >
          <MindMosaicLogo size="sm" />
        </Link>
        <div className="w-full min-w-0 max-w-[420px]">{children}</div>
      </main>
    </div>
  );
}

/** The white form card from the artboards (flat on phones). */
export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={twMerge(
        "mm-rise w-full min-w-0 rounded-3xl bg-white px-0 py-2 sm:border sm:border-mm-line sm:px-6 sm:pt-8 sm:pb-7 lg:px-9 lg:pt-9 lg:pb-8 sm:shadow-[0_18px_50px_rgba(49,32,86,0.09)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Card heading + one-line lead, 28px Instrument Sans as in the artboards. */
export function AuthCardHeading({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-[1.3] tracking-[-0.028em] text-mm-ink sm:text-[28px]">
        {title}
      </h1>
      {lead && <p className="mt-2 text-[15px] leading-[1.55] text-mm-ink-soft">{lead}</p>}
    </div>
  );
}
