"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Pause, Play } from "lucide-react";

import { hero } from "../content";
import { useMotionLevel } from "../motion/useMotionLevel";
import { SampleQuestionCard } from "./SampleCards";
import { mmButton, underlineLinkClasses, underlineTransition } from "./primitives";

const SLIDE_COUNT = hero.slides.length;

/** Diamond tones for the value strip: the page's small mosaic fragments. */
const DIAMOND_TONES = ["bg-mm-brand", "bg-mm-coral", "bg-mm-lilac", "bg-mm-brand-mid"] as const;

/** Stagger for the copy column: 70ms apart, once, on load. */
function rise(index: number): CSSProperties {
  return { "--mm-delay": `${index * 70}ms` } as CSSProperties;
}

function wantsLightData(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(connection?.saveData);
}

function whenIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: 4000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 2000);
  return () => window.clearTimeout(id);
}

/**
 * The home hero: one full-bleed photograph canvas that runs up behind the
 * translucent header (SiteNav `overlay`), a readability gradient, the
 * content, and six timer controls. Six unbranded campaign photographs
 * crossfade every `hero.slideDurationMs`; the headline and body never
 * change, only the small phrase above the headline does. MindMosaic's
 * brand appears as real HTML on top of the photography (SampleQuestionCard
 * carries the official logo asset), never inside the pictures.
 *
 * Timing: the active timer's CSS fill animation IS the clock. Its
 * `animationend` advances the slide, so the bar and the rotation cannot
 * drift apart. Reduced motion removes the animation (globals.css), so
 * nothing auto-advances; the controls still switch slides by hand.
 *
 * Loading: only slide 1 is rendered on the server, with `preload` for LCP.
 * The next slide mounts after first paint and whenever the slide changes;
 * the rest mount when the browser is idle (skipped on Save-Data). A slide
 * only becomes the visible one once its image has loaded, so a click on a
 * slide that has not arrived yet waits instead of flashing blank.
 */
export function Hero() {
  const reducedMotion = useMotionLevel() === "off";
  const [shown, setShown] = useState(0);
  const [requested, setRequested] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [mounted, setMounted] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [userPaused, setUserPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const shownRef = useRef(shown);

  const mount = useCallback((index: number) => {
    setMounted((current) => (current.has(index) ? current : new Set(current).add(index)));
  }, []);

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  // Preload the slide after the visible one: after first paint, then on every change.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => mount((shown + 1) % SLIDE_COUNT));
    return () => window.cancelAnimationFrame(frame);
  }, [shown, mount]);

  // The remaining slides, once the browser is idle, and never on Save-Data.
  useEffect(() => {
    if (wantsLightData()) return;
    return whenIdle(() => {
      for (let index = 0; index < SLIDE_COUNT; index += 1) mount(index);
    });
  }, [mount]);

  // A requested slide becomes the visible one the moment its image is ready.
  useEffect(() => {
    if (requested !== shownRef.current && loaded.has(requested)) {
      setShown(requested);
      setCycle((value) => value + 1);
    }
  }, [requested, loaded]);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const select = useCallback(
    (index: number) => {
      mount(index);
      setRequested(index);
      if (index === shownRef.current) setCycle((value) => value + 1);
    },
    [mount],
  );

  const markLoaded = useCallback((index: number) => {
    setLoaded((current) => (current.has(index) ? current : new Set(current).add(index)));
  }, []);

  const auto = !reducedMotion && !userPaused;
  const paused = !auto || tabHidden;
  const active = hero.slides[shown]!;

  return (
    <section
      aria-labelledby="hero-heading"
      data-paused={paused ? "true" : "false"}
      style={{ "--mm-hero-ms": `${hero.slideDurationMs}ms` } as CSSProperties}
      className="relative isolate -mt-[var(--mm-header-h)] flex min-h-[clamp(640px,100svh,900px)] flex-col overflow-hidden bg-mm-page lg:min-h-[clamp(680px,100svh,920px)]"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {hero.slides.map((slide, index) =>
          mounted.has(index) ? (
            <div
              key={slide.id}
              data-active={index === shown ? "true" : "false"}
              className="mm-hero-slide absolute inset-0 origin-[70%_50%]"
            >
              <Image
                src={slide.src}
                alt=""
                fill
                sizes="100vw"
                preload={index === 0}
                loading={index === 0 ? undefined : "eager"}
                onLoad={() => markLoaded(index)}
                style={
                  {
                    "--pos-m": slide.positionMobile,
                    "--pos-d": slide.positionDesktop,
                  } as CSSProperties
                }
                className="object-cover [object-position:var(--pos-m)] md:[object-position:var(--pos-d)]"
              />
            </div>
          ) : null,
        )}
        {/* Readability layers: CSS only, never baked into the photographs. */}
        <div className="absolute inset-0 md:hidden [background:linear-gradient(180deg,rgba(252,251,248,.94)_0%,rgba(252,251,248,.86)_48%,rgba(252,251,248,.62)_76%,rgba(252,251,248,.34)_100%)]" />
        <div className="absolute inset-0 hidden md:block lg:hidden [background:linear-gradient(90deg,rgba(252,251,248,.98)_0%,rgba(252,251,248,.95)_42%,rgba(252,251,248,.82)_58%,rgba(252,251,248,.4)_74%,rgba(252,251,248,.08)_90%,transparent_100%)]" />
        <div className="absolute inset-0 hidden lg:block [background:linear-gradient(90deg,rgba(252,251,248,.98)_0%,rgba(252,251,248,.94)_25%,rgba(252,251,248,.78)_39%,rgba(252,251,248,.45)_52%,rgba(252,251,248,.12)_67%,transparent_82%)]" />
      </div>

      <div className="mm-width relative flex flex-1 flex-col pb-[clamp(20px,3vw,32px)] pt-[calc(var(--mm-header-h)+clamp(28px,6vh,76px))]">
        <div className="max-w-[640px] md:max-w-[58%] lg:max-w-[min(46%,640px)]">
          <p
            key={active.id}
            aria-hidden="true"
            className="mm-hero-phrase m-0 mb-4 flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1"
          >
            <span className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">
              {String(shown + 1).padStart(2, "0")} · {active.label}
            </span>
            <span className="text-[14.5px] font-medium text-mm-ink-soft">{active.phrase}</span>
          </p>

          <h1
            id="hero-heading"
            className="m-0 text-[clamp(40px,5vw,68px)] leading-[1.04] tracking-[-0.034em] text-mm-ink"
          >
            <span className="mm-hero-rise block" style={rise(0)}>
              {hero.heading}
            </span>
            <span className="mm-hero-rise block text-mm-brand" style={rise(1)}>
              {hero.headingEmphasis}
            </span>
          </h1>

          <p
            className="mm-hero-rise m-0 mt-5 max-w-[54ch] text-pretty text-[clamp(15.5px,1.3vw,18.5px)] leading-[1.6] text-mm-ink-soft sm:mt-6"
            style={rise(2)}
          >
            {hero.subheadline}
          </p>

          <div className="mm-hero-rise mt-6 flex flex-wrap gap-3 sm:mt-7" style={rise(3)}>
            <Link href={hero.primaryCta.href} className={mmButton({ size: "lg", className: "px-5 sm:px-6" })}>
              {hero.primaryCta.label}
            </Link>
            <Link
              href={hero.secondaryCta.href}
              className={mmButton({
                variant: "outline",
                size: "lg",
                className:
                  "group/cta border-mm-brand/25 bg-mm-page/70 px-5 text-mm-ink backdrop-blur-[6px] hover:bg-white sm:px-6",
              })}
            >
              {hero.secondaryCta.label}
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-[3px]"
              />
            </Link>
          </div>

          <ul
            className="mm-hero-rise m-0 mt-6 grid max-w-[30rem] list-none grid-cols-2 gap-x-5 gap-y-2.5 p-0 text-[14px] font-medium leading-snug text-mm-ink-soft sm:mt-7 sm:text-[14.5px]"
            style={rise(4)}
            aria-label="What MindMosaic includes"
          >
            {hero.credibility.map((item, index) => (
              <li key={item} className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 shrink-0 rotate-45 rounded-[1.5px] ${DIAMOND_TONES[index % DIAMOND_TONES.length]}`}
                />
                {item}
              </li>
            ))}
          </ul>

          <p
            className="mm-hero-rise m-0 mt-5 text-[14px] leading-[1.55] text-mm-ink-soft sm:text-[14.5px]"
            style={rise(5)}
          >
            <span aria-hidden="true" className="mr-2.5 inline-block h-2 w-2 rounded-full bg-[#0B6B63] align-[1px]" />
            {hero.availability.text}{" "}
            <Link
              href={hero.availability.link.href}
              style={underlineTransition}
              className={underlineLinkClasses({ tone: "brand", className: "font-semibold text-mm-brand" })}
            >
              {hero.availability.link.label}
            </Link>
          </p>
        </div>

        {/* Product proof: real HTML on the photograph, carrying the official logo. */}
        <div className="pointer-events-none absolute bottom-[clamp(72px,9vh,104px)] right-[clamp(20px,4vw,64px)] hidden w-[clamp(320px,27vw,392px)] xl:block">
          <SampleQuestionCard className="mm-hero-rise backdrop-blur-[2px]" />
        </div>

        <div role="group" aria-label="Choose hero slide" className="mt-auto flex items-center gap-1.5 pt-8">
          {hero.slides.map((slide, index) => {
            const isActive = index === shown;
            return (
              <button
                key={slide.id}
                type="button"
                aria-label={`Slide ${index + 1} of ${SLIDE_COUNT}: ${slide.label}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => select(index)}
                className="group/timer flex h-11 w-[clamp(34px,5vw,60px)] items-center rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page"
              >
                <span
                  aria-hidden="true"
                  className="relative block h-1 w-full overflow-hidden rounded-full bg-mm-brand/20 transition-[height,background-color] duration-200 group-hover/timer:h-[5px] group-hover/timer:bg-mm-brand/35"
                >
                  <span
                    key={isActive ? `${index}-${cycle}` : index}
                    data-active={isActive ? "true" : "false"}
                    data-auto={reducedMotion ? "false" : "true"}
                    onAnimationEnd={() => {
                      // The fill's only animation is the slide clock.
                      if (isActive) select((index + 1) % SLIDE_COUNT);
                    }}
                    className="mm-hero-fill absolute inset-0 rounded-full bg-mm-brand"
                  />
                </span>
              </button>
            );
          })}
          {!reducedMotion && (
            <button
              type="button"
              aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
              onClick={() => setUserPaused((value) => !value)}
              className="ml-2 grid h-11 w-11 place-items-center rounded-full text-mm-ink-soft transition-colors hover:text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page"
            >
              {userPaused ? (
                <Play aria-hidden="true" className="h-4 w-4" fill="currentColor" />
              ) : (
                <Pause aria-hidden="true" className="h-4 w-4" fill="currentColor" />
              )}
            </button>
          )}
          <span className="sr-only" aria-live="polite">
            {`Showing slide ${shown + 1} of ${SLIDE_COUNT}: ${active.label}. ${active.alt}`}
          </span>
        </div>
      </div>

      {/* Mosaic divider: six segments echoing the timers, a quiet seam into the page. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 grid h-[3px] grid-cols-6">
        {["bg-mm-brand", "bg-mm-lilac", "bg-mm-tint-line-strong", "bg-mm-coral", "bg-mm-brand-mid", "bg-mm-lilac"].map(
          (tone, index) => (
            <span key={index} className={tone} />
          ),
        )}
      </div>
    </section>
  );
}
