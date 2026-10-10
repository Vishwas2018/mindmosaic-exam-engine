"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { MindMosaicLogo } from "@/components/branding";

import { CompactContext } from "./compact";

/** Desktop screens are drawn at this size; phone-sized frames get a purpose-composed screen at the narrow size. */
const WIDE = { width: 860, height: 600 } as const;
const NARROW = { width: 440, height: 560 } as const;
/** Frames narrower than this get the compact composition. */
const COMPACT_BELOW = 640;

interface Fit {
  scale: number;
  width: number;
  height: number;
  compact: boolean;
}

/** Stable first paint (server HTML, slow or failed JS): the branded app shell in plain CSS, no measurement needed. */
function Skeleton() {
  return (
    <div className="absolute inset-0 flex flex-col bg-canvas" data-preview-skeleton>
      <div className="flex h-[14%] min-h-10 items-center justify-between border-b border-royal/8 bg-white px-[4%]">
        <MindMosaicLogo size="sm" trademark="none" />
        <span className="h-2.5 w-[18%] rounded-full bg-royal/10" />
      </div>
      <div className="flex min-h-0 flex-1 gap-[3%] p-[4%]">
        <div className="hidden w-[24%] rounded-2xl border border-royal/10 bg-white sm:block" />
        <div className="flex flex-1 flex-col gap-[5%] rounded-2xl border border-royal/10 bg-white p-[4%]">
          <span className="h-3 w-2/3 rounded-full bg-royal/12" />
          <span className="h-3 w-1/2 rounded-full bg-royal/8" />
          <span className="mt-2 h-[16%] rounded-xl border border-royal/10 bg-page" />
          <span className="h-[16%] rounded-xl border border-royal/10 bg-page" />
          <span className="h-[16%] rounded-xl border border-royal/10 bg-page" />
        </div>
      </div>
    </div>
  );
}

/**
 * A stationary product window. The frame is sized by its parent; the screen inside is laid out at a fixed
 * reference size and fitted to the frame by one static scale factor (re-measured only when the frame resizes),
 * so it never moves or scales while the page scrolls. The screen always fills the whole frame: the canvas
 * grows past the reference size in whichever direction has room. Phone-sized frames get the compact
 * composition (see compact.ts) at a phone-width reference, so text stays readable.
 *
 * Until the first measurement the frame shows a CSS-only skeleton of the same app shell.
 *
 * Decorative: aria-hidden and inert. The programme's words live in the scene copy beside it.
 */
export function PreviewWindow({ children, className = "" }: { children: ReactNode; className?: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit | null>(null);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => {
      const { clientWidth, clientHeight } = element;
      if (clientWidth === 0 || clientHeight === 0) return;
      const compact = clientWidth < COMPACT_BELOW;
      const ref = compact ? NARROW : WIDE;
      const scale = Math.min(clientWidth / ref.width, clientHeight / ref.height);
      setFit((previous) =>
        previous &&
        previous.compact === compact &&
        Math.abs(previous.scale - scale) < 0.0005 &&
        Math.abs(previous.width * previous.scale - clientWidth) < 0.5 &&
        Math.abs(previous.height * previous.scale - clientHeight) < 0.5
          ? previous
          : { scale, width: clientWidth / scale, height: clientHeight / scale, compact },
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frame}
      aria-hidden="true"
      inert
      data-preview-window
      className={`relative overflow-hidden rounded-[clamp(18px,2.2vw,30px)] border border-black/[0.07] bg-canvas shadow-[0_28px_70px_-28px_rgba(24,21,31,0.34),0_8px_24px_-10px_rgba(24,21,31,0.12)] ${className}`}
    >
      {!fit && <Skeleton />}
      {/* The screen is in the DOM from the server render on; it is only held back until it has been fitted. */}
      <div
        data-preview-canvas
        className="absolute left-0 top-0 flex origin-top-left flex-col overflow-hidden bg-canvas text-left"
        style={
          fit
            ? { width: fit.width, height: fit.height, transform: `scale(${fit.scale})` }
            : { width: WIDE.width, height: WIDE.height, visibility: "hidden" }
        }
      >
        <CompactContext.Provider value={fit?.compact ?? false}>{children}</CompactContext.Provider>
      </div>
    </div>
  );
}
