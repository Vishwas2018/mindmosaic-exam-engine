"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

import { hero } from "../content";
import { useMotionLevel } from "../motion/useMotionLevel";
import { ImageSlot, mmButton, underlineLinkClasses, underlineTransition } from "./primitives";

const SLIDE_MS = hero.intervalMs;
const TICK_MS = 250;

/**
 * Public/Home.dc.html's hero: a 3-image crossfade carousel behind a fixed
 * headline, autoplaying every 5s with a Ken Burns zoom (MOTION_SPEC.md
 * effect 2). Pauses on hover, focus, a hidden tab or when scrolled
 * offscreen; any manual prev/next/dot stops autoplay for good, matching
 * the design's own script (`go()` always sets `playing: false`).
 *
 * Desktop (≥1100px) parallax and the magnetic-cursor button effect from
 * the same spec are deliberately not implemented here — noted as a
 * follow-up rather than silently dropped.
 */
export function Hero() {
  const level = useMotionLevel();
  const reduced = level === "off";
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(!reduced);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onscreen, setOnscreen] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setOnscreen(entry.isIntersecting), {
      threshold: 0.12,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !playing || hovering || focused || !onscreen) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setElapsedMs((ms) => {
        const next = ms + TICK_MS;
        if (next >= SLIDE_MS) {
          setIndex((i) => (i + 1) % hero.slides.length);
          return 0;
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [reduced, playing, hovering, focused, onscreen]);

  const goTo = useCallback((next: number) => {
    setIndex(((next % hero.slides.length) + hero.slides.length) % hero.slides.length);
    setPlaying(false);
    setElapsedMs(0);
  }, []);

  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const parallax = useTransform(scrollY, (y) => (level === "expressive" ? Math.min(y, 1000) * 0.22 : 0));

  const slide = hero.slides[index]!;

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Learning moments"
      className="relative bg-mm-page"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="relative flex flex-col overflow-hidden lg:min-h-[min(760px,calc(100vh-140px))]">
        <motion.div
          ref={stageRef}
          style={{ y: parallax }}
          className="relative order-2 aspect-[4/3] bg-mm-tint-quiet lg:absolute lg:inset-0 lg:order-none lg:aspect-auto"
        >
          {hero.slides.map((s, i) => (
            <div
              key={s.assetId}
              aria-hidden={i !== index}
              className="absolute inset-0 transition-opacity"
              style={{
                opacity: i === index ? 1 : 0,
                transitionDuration: reduced ? "1ms" : level === "expressive" ? "900ms" : "700ms",
              }}
            >
              <motion.div
                className="h-full w-full"
                animate={reduced ? undefined : { scale: i === index ? 1 : level === "expressive" ? 1.1 : 1.03 }}
                transition={{ duration: level === "expressive" ? 7 : 5.6, ease: "linear" }}
              >
                <ImageSlot
                  assetId={s.assetId}
                  alt={s.alt}
                  focalDesktop={s.focalDesktop}
                  focalMobile={s.focalMobile}
                  priority={i === 0}
                  className="h-full w-full"
                />
              </motion.div>
            </div>
          ))}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{
              background:
                "linear-gradient(90deg, rgba(252,251,248,.96) 0%, rgba(252,251,248,.86) 30%, rgba(252,251,248,0) 56%)",
            }}
          />
        </motion.div>

        <div className="relative z-[1] order-1 mx-auto w-full max-w-[1440px] px-[clamp(20px,4vw,64px)] py-[clamp(40px,6vw,64px)] lg:order-none lg:py-16">
          <div className="flex max-w-[600px] flex-col gap-6">
            <h1 className="m-0 text-[clamp(42px,5.4vw,84px)] font-medium leading-[1] tracking-[-0.04em] text-mm-ink">
              <span className="block">{hero.heading}</span>
              <span className="block text-mm-brand">{hero.headingEmphasis}</span>
            </h1>
            <p className="m-0 max-w-[500px] text-pretty text-[clamp(17px,1.3vw,19px)] leading-[1.6] text-mm-ink-soft">
              {hero.subheadline}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={hero.primaryCta.href} className={mmButton({ size: "lg" })}>
                {hero.primaryCta.label}
              </Link>
              <Link href={hero.secondaryCta.href} className={mmButton({ variant: "outline", size: "lg" })}>
                {hero.secondaryCta.label}
              </Link>
            </div>
            <p className="m-0 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[14.5px] leading-[1.5] text-mm-ink-soft">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-[#0B6B63]" />
              {hero.availability.text}{" "}
              <Link
                href={hero.availability.link.href}
                style={underlineTransition}
                className={underlineLinkClasses({ tone: "brand", className: "font-semibold" })}
              >
                {hero.availability.link.label}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-mm-line bg-mm-page">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-3 px-[clamp(20px,4vw,64px)] py-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous scene"
              className="grid h-11 w-11 place-items-center rounded-xl border border-mm-line bg-white transition-colors hover:border-mm-brand hover:bg-mm-tint"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18151F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next scene"
              className="grid h-11 w-11 place-items-center rounded-xl border border-mm-line bg-white transition-colors hover:border-mm-brand hover:bg-mm-tint"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18151F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying((p) => !p);
                setElapsedMs(0);
              }}
              aria-label={playing ? "Pause scene rotation" : "Play scene rotation"}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-mm-line bg-white px-3.5 text-sm font-semibold text-mm-ink transition-colors hover:border-mm-brand hover:bg-mm-tint"
            >
              {playing ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#18151F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 5v14M16 5v14" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#18151F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 4.5v15l12-7.5z" />
                </svg>
              )}
              {playing ? "Pause" : "Play"}
            </button>
          </div>

          <div role="group" aria-label="Choose image" className="flex gap-0.5">
            {hero.slides.map((s, i) => (
              <button
                key={s.assetId}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Image ${i + 1} of ${hero.slides.length}: ${s.caption}`}
                aria-current={i === index}
                className="grid h-11 w-12 place-items-center border-0 bg-transparent p-0"
              >
                <span className="relative h-1 w-9 overflow-hidden rounded-full bg-mm-lilac/60">
                  <span
                    className="absolute inset-0 origin-left bg-mm-brand"
                    style={{
                      transform: `scaleX(${i === index ? (playing ? Math.min(1, elapsedMs / SLIDE_MS) : 1) : 0})`,
                      transition: i === index && playing && elapsedMs > 0 ? "transform 250ms linear" : "none",
                    }}
                  />
                </span>
              </button>
            ))}
          </div>

          <p aria-live="polite" className="m-0 min-w-[200px] flex-1 text-sm text-mm-muted">
            {index + 1} / {hero.slides.length} · {slide.caption}
          </p>
        </div>
      </div>
    </section>
  );
}
