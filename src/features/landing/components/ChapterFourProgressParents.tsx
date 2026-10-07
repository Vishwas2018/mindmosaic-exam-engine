"use client";

import { useCallback, type CSSProperties } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";

import {
  chapter4Scenes,
  chapterFour,
  type Chapter4SceneData,
} from "../chapter4-progress";
import { cinematicMotion } from "../cinematic/config";
import { between } from "../cinematic/math";
import {
  chapter4LayerStarts,
  layerEnter,
  layerExit,
  layerForegroundOpacity,
  layerLocal,
  spanForegroundOpacity,
} from "../cinematic/sceneProgress";
import { useChapterScroll } from "../cinematic/useChapterScroll";
import {
  AssembledParentMosaic,
  LatestResultModule,
  SubjectProgressModule,
} from "./chapter-four-visuals";
import { ChapterSceneProgress } from "./ChapterSceneProgress";
import { ProgressCopy, ProgressScene } from "./ProgressScene";

const timing = cinematicMotion.chapter4;
const starts = chapter4LayerStarts;
/** Layer 0 is the intro, so the three scenes are layers 1..3. */
const LAYER_OFFSET = 1;
const HANDOFF_LAYER = starts.length - 1;
const ITEMS = chapter4Scenes.map((scene) => ({
  id: scene.id,
  number: scene.number,
  label: scene.navLabel,
}));

const pointerFor = (opacity: number) => (opacity > 0.5 ? "auto" : "none");

/** Intro: the chapter heading and a preview of the three steps. */
function IntroContent() {
  return (
    <div className="mm-width grid gap-8 pb-6 pt-[clamp(56px,10vw,120px)] lg:h-full lg:grid-cols-12 lg:items-center lg:gap-14 lg:pb-24 lg:pt-[calc(var(--mm-header-h)+16px)]">
      <div className="flex flex-col gap-4 lg:col-span-7">
        <p className="m-0 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">
          <span aria-hidden="true" className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />
          {chapterFour.eyebrow}
        </p>
        <h2
          id="chapter-four-heading"
          className="m-0 max-w-[16ch] text-balance text-[clamp(36px,5.2vw,76px)] leading-[1.02] tracking-[-0.038em] text-mm-ink"
        >
          {chapterFour.heading}
        </h2>
        <p className="m-0 max-w-[52ch] text-pretty text-[clamp(16px,1.35vw,20px)] leading-[1.6] text-mm-ink-soft">
          {chapterFour.intro}
        </p>
      </div>
      <ol
        aria-label="The three steps"
        className="m-0 grid list-none gap-0 border-t border-mm-line p-0 lg:col-span-5"
      >
        {chapter4Scenes.map((scene) => (
          <li key={scene.id} className="flex items-baseline gap-4 border-b border-mm-line py-3.5">
            <span aria-hidden="true" className="text-[13px] font-bold tabular-nums text-mm-brand">
              {String(scene.number).padStart(2, "0")}
            </span>
            <span className="grid gap-0.5">
              <span className="text-[16px] font-semibold tracking-[-0.01em] text-mm-ink">
                {scene.navLabel}
              </span>
              <span className="text-[14px] text-mm-muted">{scene.proposition}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Handoff: leading into the quality & trust section. */
function HandoffContent() {
  return (
    <div
      data-handoff="quality"
      className="mm-width flex flex-col justify-center gap-4 py-[clamp(48px,8vw,96px)] lg:h-full lg:pb-24 lg:pt-[calc(var(--mm-header-h)+16px)]"
    >
      <p className="m-0 max-w-[22ch] text-balance text-[clamp(32px,4.4vw,60px)] font-semibold leading-[1.06] tracking-[-0.03em] text-mm-ink">
        {chapterFour.handoff.heading}
      </p>
      <p className="m-0 max-w-[52ch] text-pretty text-[clamp(16px,1.35vw,19px)] leading-[1.6] text-mm-ink-soft">
        {chapterFour.handoff.body}
      </p>
    </div>
  );
}

/** One scene's copy in the pinned stage. */
function CopyLayer({
  scene,
  layer,
  q,
  onFocus,
}: {
  scene: Chapter4SceneData;
  layer: number;
  q: MotionValue<number>;
  onFocus: () => void;
}) {
  const opacity = useTransform(q, (value) =>
    layerForegroundOpacity(value, starts, layer, timing.crossfade),
  );
  const pointerEvents = useTransform(opacity, pointerFor);
  const y = useTransform(
    q,
    (value) =>
      (1 - layerEnter(value, starts, layer, timing.crossfade)) * timing.copyRisePx -
      layerExit(value, starts, layer, timing.crossfade) * timing.copyLiftPx,
  );

  return (
    <motion.div
      data-scene={scene.id}
      onFocusCapture={onFocus}
      style={{ opacity, y, pointerEvents, gridArea: "1 / 1" }}
      className="min-w-0"
    >
      <ProgressCopy scene={scene} />
    </motion.div>
  );
}

/**
 * Pinned visual stage: progressive mosaic assembly across Scenes 1 to 3.
 *
 * Scene 1: Latest result module in focus.
 * Scene 2: Modules reposition; subject patterns join.
 * Scene 3: Coherent full parent view mosaic assembled.
 */
function ProgressMosaicStage({ q }: { q: MotionValue<number> }) {
  const cf = timing.crossfade;

  // Scene 1 opacity & transforms
  const scene1Opacity = useTransform(q, (value) => spanForegroundOpacity(value, starts, 1, 1, cf));
  const scene1Y = useTransform(scene1Opacity, (value) => (1 - value) * 12);
  const ringDraw = useTransform(q, (value) =>
    between(layerLocal(value, starts, 1), timing.scoreRingDraw.start, timing.scoreRingDraw.end),
  );

  // Scene 2 opacity & transforms
  const scene2Opacity = useTransform(q, (value) => spanForegroundOpacity(value, starts, 2, 2, cf));
  const scene2Y = useTransform(scene2Opacity, (value) => (1 - value) * 12);
  const barsBuild = useTransform(q, (value) =>
    between(layerLocal(value, starts, 2), timing.subjectBarsBuild.start, timing.subjectBarsBuild.end),
  );

  // Scene 3 opacity & transforms (Parent view mosaic)
  const scene3Opacity = useTransform(q, (value) => spanForegroundOpacity(value, starts, 3, 3, cf));
  const scene3Y = useTransform(scene3Opacity, (value) => (1 - value) * 12);
  const mosaicBuild = useTransform(q, (value) =>
    between(layerLocal(value, starts, 3), timing.mosaicAssemble.start, timing.mosaicAssemble.end),
  );

  return (
    <div className="relative min-w-0">
      <div className="grid">
        {/* Scene 1: Latest result module */}
        <motion.div
          style={{ opacity: scene1Opacity, y: scene1Y, gridArea: "1 / 1" }}
          className="mx-auto w-full max-w-[560px]"
        >
          <LatestResultModule draw={ringDraw} />
        </motion.div>

        {/* Scene 2: Latest + Subject patterns side-by-side */}
        <motion.div
          style={{ opacity: scene2Opacity, y: scene2Y, gridArea: "1 / 1" }}
          className="grid w-full gap-4 sm:grid-cols-2"
        >
          <LatestResultModule compact />
          <SubjectProgressModule buildProgress={barsBuild} compact />
        </motion.div>

        {/* Scene 3: Fully assembled parent mosaic */}
        <motion.div
          style={{ opacity: scene3Opacity, y: scene3Y, gridArea: "1 / 1" }}
          className="w-full"
        >
          <AssembledParentMosaic build={mosaicBuild} />
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Chapter 4 of the cinematic landing page: "Progress & Parents".
 *
 * Demonstrates what progress looks like for students and parents as an
 * assembling progress mosaic: latest result -> subject patterns -> weekly
 * activity and coherent read-only parent view. Real DOM and deterministic
 * SVG only: no photographic assets, no media registry slots.
 */
export function ChapterFourProgressParents() {
  const { sectionRef, choreographed, q, active, scrollToLayer } = useChapterScroll({
    scrollHeightSvh: timing.desktopScrollHeightSvh,
    starts,
  });

  const onSceneFocus = useCallback(
    (layer: number) => {
      if (layerForegroundOpacity(q.get(), starts, layer, timing.crossfade) < 0.5) {
        scrollToLayer(layer);
      }
    },
    [q, scrollToLayer],
  );

  const introOpacity = useTransform(q, (value) =>
    layerForegroundOpacity(value, starts, 0, timing.crossfade),
  );
  const handoffOpacity = useTransform(q, (value) =>
    layerForegroundOpacity(value, starts, HANDOFF_LAYER, timing.crossfade),
  );
  const introPointer = useTransform(introOpacity, pointerFor);
  const handoffPointer = useTransform(handoffOpacity, pointerFor);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="chapter-four-heading"
      data-chapter="4"
      style={
        choreographed
          ? ({ height: `${timing.desktopScrollHeightSvh}svh` } as CSSProperties)
          : undefined
      }
      className="relative bg-mm-page"
    >
      {choreographed ? (
        <div className="sticky top-0 isolate h-svh overflow-hidden">
          {/* Subtle background mosaic diamond accents */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-30">
            <div className="absolute right-[12%] top-[18%] h-48 w-48 rotate-45 rounded-3xl border border-mm-line/50 bg-mm-tint/20" />
            <div className="absolute left-[6%] bottom-[15%] h-32 w-32 rotate-45 rounded-2xl border border-mm-line/40 bg-mm-page/40" />
          </div>

          <motion.div
            data-layer="intro"
            style={{ opacity: introOpacity, pointerEvents: introPointer }}
            className="absolute inset-0"
          >
            <IntroContent />
          </motion.div>

          <div className="absolute inset-0">
            <div className="mm-width grid h-full gap-10 pb-24 pt-[calc(var(--mm-header-h)+16px)] lg:grid-cols-12 lg:items-center lg:gap-14">
              <div className="grid lg:col-span-5">
                {chapter4Scenes.map((scene, index) => (
                  <CopyLayer
                    key={scene.id}
                    scene={scene}
                    layer={index + LAYER_OFFSET}
                    q={q}
                    onFocus={() => onSceneFocus(index + LAYER_OFFSET)}
                  />
                ))}
              </div>
              <div className="min-w-0 lg:col-span-7">
                <ProgressMosaicStage q={q} />
              </div>
            </div>
          </div>

          <motion.div
            data-layer="handoff"
            style={{ opacity: handoffOpacity, pointerEvents: handoffPointer }}
            className="absolute inset-0"
          >
            <HandoffContent />
          </motion.div>

          {/* Navigator belongs to the three scenes: leaves with hand-off */}
          {active < HANDOFF_LAYER && (
            <ChapterSceneProgress
              items={ITEMS}
              activeScene={active - LAYER_OFFSET}
              onSelect={(sceneIndex) => scrollToLayer(sceneIndex + LAYER_OFFSET)}
              ariaLabel={chapterFour.progressLabel}
            />
          )}
        </div>
      ) : (
        <div className="relative">
          <IntroContent />
          <div className="mm-width">
            {chapter4Scenes.map((scene) => (
              <ProgressScene key={scene.id} scene={scene} />
            ))}
          </div>
          <div className="border-t border-mm-line-soft">
            <HandoffContent />
          </div>
        </div>
      )}
    </section>
  );
}
