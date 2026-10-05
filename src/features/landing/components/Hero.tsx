"use client";

import { useCallback, useEffect, useReducer, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Pause, Play } from "lucide-react";

import { hero } from "../content";
import { useMotionLevel } from "../motion/useMotionLevel";
import {
  carouselReducer,
  initialCarouselState,
  isPending,
  type CarouselAction,
  type CarouselState,
} from "./heroCarouselState";
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
 * The home hero: full-bleed photograph canvas running behind the translucent
 * header (SiteNav `overlay`), readability gradients, generous content region,
 * and accessible timer controls. Six unbranded campaign photographs crossfade
 * and slowly scale across `hero.slideDurationMs`.
 *
 * Layout: hero-specific inner composition (not generic `.mm-width`) utilizing
 * 52-55vw on desktop so headlines ("Learn with purpose." / "Practise with confidence.")
 * stay on two strong lines without awkward line breaks.
 *
 * Motion: genuine slow cinematic scale animation across the active slide duration
 * (5000ms), configured per-slide via media metadata (`fromScale` -> `toScale`),
 * with independent crossfade and full pause support.
 */
export function Hero() {
  const reducedMotion = useMotionLevel() === "off";
  const [state, dispatch] = useReducer(
    (current: CarouselState, action: CarouselAction) => carouselReducer(current, action, SLIDE_COUNT),
    undefined,
    initialCarouselState,
  );
  const { shown, requested, cycle } = state;
  const [mounted, setMounted] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [userPaused, setUserPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  const mount = useCallback((index: number) => {
    setMounted((current) => (current.has(index) ? current : new Set(current).add(index)));
  }, []);

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

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // The requested slide always renders, so a click starts its load immediately.
  const pending = isPending(state);
  const autoEnabled = !reducedMotion;
  // A pending manual request, user pause, or hidden tab freezes the timer and animation in place.
  const paused = !autoEnabled || userPaused || tabHidden || pending;
  const active = hero.slides[shown]!;

  return (
    <section
      aria-labelledby="hero-heading"
      data-paused={paused ? "true" : "false"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={{ "--mm-hero-ms": `${hero.slideDurationMs}ms` } as CSSProperties}
      className="relative isolate -mt-[var(--mm-header-h)] flex min-h-[100svh] flex-col overflow-hidden bg-mm-page"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        {hero.slides.map((slide, index) =>
          mounted.has(index) || index === requested ? (
            <div
              key={`${slide.id}-${state.attempts[index] ?? 0}`}
              data-active={index === shown ? "true" : "false"}
              data-paused={paused ? "true" : "false"}
              style={
                {
                  "--pos-m": slide.focalMobile,
                  "--pos-t": slide.focalTablet,
                  "--pos-d": slide.focalDesktop,
                  "--mm-zoom-from": slide.fromScale,
                  "--mm-zoom-to": slide.toScale,
                } as CSSProperties
              }
              className="mm-hero-slide absolute inset-0"
            >
              <Image
                src={slide.src}
                alt=""
                fill
                quality={90}
                sizes="100vw"
                preload={index === 0}
                loading={index === 0 ? undefined : "eager"}
                onLoad={() => dispatch({ type: "loaded", index })}
                onError={() => dispatch({ type: "failed", index })}
                className="object-cover [object-position:var(--pos-m)] md:[object-position:var(--pos-t)] lg:[object-position:var(--pos-d)]"
              />
            </div>
          ) : null,
        )}
        {/* Readability layers: tuned gradients preserving photo brightness, texture & color */}
        <div className="absolute inset-0 md:hidden [background:linear-gradient(180deg,rgba(252,251,248,.95)_0%,rgba(252,251,248,.88)_26%,rgba(252,251,248,.56)_42%,rgba(252,251,248,.18)_54%,rgba(252,251,248,.02)_64%,transparent_72%)]" />
        <div className="absolute inset-0 hidden md:block lg:hidden [background:linear-gradient(90deg,rgba(252,251,248,.96)_0%,rgba(252,251,248,.88)_30%,rgba(252,251,248,.58)_48%,rgba(252,251,248,.20)_64%,transparent_78%)]" />
        <div className="absolute inset-0 hidden lg:block [background:linear-gradient(90deg,rgba(252,251,248,.94)_0%,rgba(252,251,248,.86)_22%,rgba(252,251,248,.58)_36%,rgba(252,251,248,.24)_47%,rgba(252,251,248,.06)_56%,transparent_63%)]" />
      </div>

      {/* Hero inner layout: full-bleed canvas with generous width and centered vertical composition */}
      <div className="relative flex w-full flex-1 flex-col justify-between px-4 sm:px-6 md:px-8 lg:px-[clamp(32px,5vw,96px)] pb-[clamp(16px,2.5vh,28px)] pt-[calc(var(--mm-header-h)+clamp(16px,3vh,36px))]">
        {/* Middle Zone: main copy, photograph view, and proof card */}
        <div className="my-auto max-w-xl md:max-w-[58%] lg:max-w-[min(54vw,820px)]">
          <p
            key={active.id}
            aria-hidden="true"
            className="mm-hero-phrase m-0 mb-3 sm:mb-4 flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1"
          >
            <span className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">
              {String(shown + 1).padStart(2, "0")} · {active.label}
            </span>
            <span className="text-[14.5px] font-medium text-mm-ink-soft">{active.phrase}</span>
          </p>

          <h1
            id="hero-heading"
            className="m-0 text-[clamp(38px,4.5vw,66px)] leading-[1.05] tracking-[-0.034em] text-mm-ink"
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

        {/* Product proof: real HTML on the photograph, position configurable per slide to avoid collisions */}
        {active.proofPosition !== "hidden" && (
          <div
            key={active.id}
            className={`pointer-events-none absolute hidden xl:block w-[clamp(320px,27vw,392px)] ${
              active.proofPosition === "right-mid"
                ? "top-[clamp(140px,20vh,220px)] right-[clamp(20px,4vw,64px)]"
                : "bottom-[clamp(72px,9vh,104px)] right-[clamp(20px,4vw,64px)]"
            }`}
          >
            <SampleQuestionCard className="mm-hero-rise backdrop-blur-[2px]" />
          </div>
        )}

        {/* Bottom Zone: slide timer controls and play/pause toggle */}
        <div
          role="group"
          aria-label="Choose hero slide"
          className="mt-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 pt-6 sm:pt-8"
        >
          {/* Row 1 on mobile: six timer controls only */}
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-1 sm:gap-1.5">
            {hero.slides.map((slide, index) => {
              const isActive = index === shown;
              return (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Slide ${index + 1} of ${SLIDE_COUNT}: ${slide.label}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => {
                    // Keep every requested slide mounted so an earlier, slower load still lands.
                    mount(index);
                    dispatch({ type: "select", index });
                  }}
                  className="group/timer relative flex h-11 min-h-[44px] min-w-[44px] max-w-[64px] flex-1 items-center justify-center rounded-md px-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page"
                >
                  <span
                    aria-hidden="true"
                    className="relative block h-1 w-full overflow-hidden rounded-full bg-mm-brand/20 transition-[height,background-color] duration-200 group-hover/timer:h-[5px] group-hover/timer:bg-mm-brand/35"
                  >
                    <span
                      key={isActive ? `${index}-${cycle}` : index}
                      data-active={isActive ? "true" : "false"}
                      data-auto={autoEnabled ? "true" : "false"}
                      data-paused={paused ? "true" : "false"}
                      onAnimationEnd={() => {
                        // The fill's only animation is the slide clock.
                        if (isActive && !paused) dispatch({ type: "timerEnd" });
                      }}
                      className="mm-hero-fill absolute inset-0 rounded-full bg-mm-brand"
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Row 2 on mobile: pause/play control aligned right; inline on tablet/desktop */}
          {!reducedMotion && (
            <div className="flex justify-end sm:justify-start sm:ml-2">
              <button
                type="button"
                aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                onClick={() => setUserPaused((value) => !value)}
                className="grid h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-full text-mm-ink-soft transition-colors hover:text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page"
              >
                {userPaused ? (
                  <Play aria-hidden="true" className="h-4 w-4" fill="currentColor" />
                ) : (
                  <Pause aria-hidden="true" className="h-4 w-4" fill="currentColor" />
                )}
              </button>
            </div>
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
