"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** The size the product screens are drawn at. The window fits them to the frame, once per resize, never per frame. */
const REF_WIDTH = 860;
const REF_HEIGHT = 600;

interface Fit {
  scale: number;
  width: number;
  height: number;
}

/**
 * A stationary product window. The frame is sized by its parent; the screen inside is laid out at a fixed
 * reference width and fitted to the frame by one static scale factor (re-measured only when the frame resizes),
 * so a Tailwind-sized app screen reads the same on a 1440 desktop and a 375 phone. The screen always fills
 * the whole frame: the canvas grows past the reference size in whichever direction has room.
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
      const scale = Math.min(clientWidth / REF_WIDTH, clientHeight / REF_HEIGHT);
      setFit((previous) =>
        previous && Math.abs(previous.scale - scale) < 0.0005 && previous.width === clientWidth && previous.height === clientHeight
          ? previous
          : { scale, width: clientWidth / scale, height: clientHeight / scale },
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
      {/* Always in the DOM (server HTML included); hidden only until the first measurement so it never shows unscaled. */}
      <div
        className="absolute left-0 top-0 flex origin-top-left flex-col overflow-hidden bg-canvas text-left"
        style={
          fit
            ? { width: fit.width, height: fit.height, transform: `scale(${fit.scale})` }
            : { width: REF_WIDTH, height: REF_HEIGHT, visibility: "hidden" }
        }
      >
        {children}
      </div>
    </div>
  );
}
