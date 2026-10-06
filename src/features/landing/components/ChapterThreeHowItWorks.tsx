"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";

import { chapter3Scenes, chapterThree, type JourneySceneData } from "../chapter3-journey";
import { cinematicMotion } from "../cinematic/config";
import { between, easeOutCubic, lerp } from "../cinematic/math";
import {
  chapter3LayerStarts,
  layerEnter,
  layerExit,
  layerForegroundOpacity,
  layerLocal,
  spanForegroundOpacity,
} from "../cinematic/sceneProgress";
import { useChapterScroll } from "../cinematic/useChapterScroll";
import { LessonState, ProductFrame, QuestionState, ResultsState, type QuestionPhase } from "./chapter-three-visuals";
import { ChapterSceneProgress } from "./ChapterSceneProgress";
import { JourneyCopy, JourneyScene } from "./JourneyScene";

const timing = cinematicMotion.chapter3;
const starts = chapter3LayerStarts;
/** Layer 0 is the intro, so the four scenes are layers 1..4. */
const LAYER_OFFSET = 1;
const HANDOFF_LAYER = starts.length - 1;
const ITEMS = chapter3Scenes.map((scene) => ({ id: scene.id, number: scene.number, label: scene.navLabel }));

const pointerFor = (opacity: number) => (opacity > 0.5 ? "auto" : "none");

/** Intro: the chapter heading and a preview of the four steps. */
function IntroContent() {
  return (
    <div className="mm-width grid gap-8 pb-6 pt-[clamp(56px,10vw,120px)] lg:h-full lg:grid-cols-12 lg:items-center lg:gap-14 lg:pb-24 lg:pt-[calc(var(--mm-header-h)+16px)]">
      <div className="flex flex-col gap-4 lg:col-span-7">
        <p className="m-0 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">
          <span aria-hidden="true" className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />
          {chapterThree.eyebrow}
        </p>
        <h2
          id="chapter-three-heading"
          className="m-0 max-w-[16ch] text-balance text-[clamp(36px,5.2vw,76px)] leading-[1.02] tracking-[-0.038em] text-mm-ink"
        >
          {chapterThree.heading}
        </h2>
        <p className="m-0 max-w-[52ch] text-pretty text-[clamp(16px,1.35vw,20px)] leading-[1.6] text-mm-ink-soft">
          {chapterThree.intro}
        </p>
      </div>
      <ol aria-label="The four steps" className="m-0 grid list-none gap-0 border-t border-mm-line p-0 lg:col-span-5">
        {chapter3Scenes.map((scene) => (
          <li key={scene.id} className="flex items-baseline gap-4 border-b border-mm-line py-3">
            <span aria-hidden="true" className="text-[13px] tabular-nums text-mm-brand">
              {String(scene.number).padStart(2, "0")}
            </span>
            <span className="grid gap-0.5">
              <span className="text-[16px] font-semibold tracking-[-0.01em] text-mm-ink">{scene.navLabel}</span>
              <span className="text-[14px] text-mm-muted">{scene.proposition}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function HandoffContent() {
  return (
    <div
      data-handoff="chapter-4"
      className="mm-width flex flex-col justify-center gap-4 py-[clamp(48px,8vw,96px)] lg:h-full lg:pb-24 lg:pt-[calc(var(--mm-header-h)+16px)]"
    >
      {/* A styled paragraph, not a heading: the chapter has one h2 and Chapter 4 will own the next. */}
      <p className="m-0 max-w-[20ch] text-balance text-[clamp(32px,4.4vw,60px)] font-semibold leading-[1.06] tracking-[-0.03em] text-mm-ink">
        {chapterThree.handoff.heading}
      </p>
      <p className="m-0 max-w-[52ch] text-pretty text-[clamp(16px,1.35vw,19px)] leading-[1.6] text-mm-ink-soft">
        {chapterThree.handoff.body}
      </p>
    </div>
  );
}

/** One scene's copy in the pinned stage: the four copies share one grid cell and take turns. */
function CopyLayer({
  scene,
  layer,
  q,
  onFocus,
}: {
  scene: JourneySceneData;
  layer: number;
  q: MotionValue<number>;
  onFocus: () => void;
}) {
  const opacity = useTransform(q, (value) => layerForegroundOpacity(value, starts, layer, timing.crossfade));
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
      <JourneyCopy scene={scene} />
    </motion.div>
  );
}

/**
 * The persistent product frame and the states inside it. The frame itself
 * only scales and fades at the very start and end of the chapter; the states
 * take turns inside it. Practise and Understand are ONE question state whose
 * `reveal` value flips it from "selected" to "reviewed", so the same question
 * visibly changes rather than being replaced by another card.
 */
function ProductStage({ q }: { q: MotionValue<number> }) {
  const cf = timing.crossfade;
  const frameOpacity = useTransform(q, (value) => spanForegroundOpacity(value, starts, 1, 4, cf));
  const frameScale = useTransform(q, (value) =>
    lerp(
      timing.shellScale.from,
      1,
      easeOutCubic(between(layerLocal(value, starts, 1), timing.shellScale.window.start, timing.shellScale.window.end)),
    ),
  );

  const lessonOpacity = useTransform(q, (value) => spanForegroundOpacity(value, starts, 1, 1, cf));
  const questionOpacity = useTransform(q, (value) => spanForegroundOpacity(value, starts, 2, 3, cf));
  const resultsOpacity = useTransform(q, (value) => spanForegroundOpacity(value, starts, 4, 4, cf));
  const lessonY = useTransform(lessonOpacity, (value) => (1 - value) * 10);
  const questionY = useTransform(questionOpacity, (value) => (1 - value) * 10);
  const resultsY = useTransform(resultsOpacity, (value) => (1 - value) * 10);

  const lessonBuild = useTransform(q, (value) =>
    between(layerLocal(value, starts, 1), timing.lessonBuild.start, timing.lessonBuild.end),
  );
  const appear = useTransform(q, (value) =>
    between(layerLocal(value, starts, 2), timing.questionAppear.start, timing.questionAppear.end),
  );
  const reveal = useTransform(q, (value) =>
    between(layerLocal(value, starts, 3), timing.review.start, timing.review.end),
  );
  const resultsBuild = useTransform(q, (value) =>
    between(layerLocal(value, starts, 4), timing.resultsBuild.start, timing.resultsBuild.end),
  );

  // The verdict labels flip once, early in the Understand scene; only this coarse value re-renders React.
  const [phase, setPhase] = useState<QuestionPhase>("select");
  useMotionValueEvent(reveal, "change", (value) => setPhase(value > 0.05 ? "review" : "select"));

  return (
    <motion.div style={{ opacity: frameOpacity, scale: frameScale }} className="min-w-0 lg:origin-center">
      <ProductFrame>
        <div className="grid">
          <motion.div style={{ opacity: lessonOpacity, y: lessonY, gridArea: "1 / 1" }}>
            <LessonState build={lessonBuild} />
          </motion.div>
          <motion.div style={{ opacity: questionOpacity, y: questionY, gridArea: "1 / 1" }}>
            <QuestionState
              phase={phase}
              appear={appear}
              explain={reveal}
              reserveExplanation
              label="Sample practice question and review"
            />
          </motion.div>
          <motion.div style={{ opacity: resultsOpacity, y: resultsY, gridArea: "1 / 1" }}>
            <ResultsState build={resultsBuild} />
          </motion.div>
        </div>
      </ProductFrame>
    </motion.div>
  );
}

/**
 * Chapter 3 of the cinematic landing page: "How it works". One persistent
 * product frame changes state as the page scrolls: learn the concept,
 * practise it, understand the mistake, see what to work on next. DOM and SVG
 * only: no photography and no media-registry slots.
 *
 * From `pinnedMinWidth` (with motion allowed) the section is tall and its
 * stage `sticky`; scroll position is the only input (no wheel handling, snap
 * or timer) and every number lives in `cinematicMotion.chapter3`. Otherwise
 * (phones, tablets, reduced motion) nothing pins or hides: intro, four scenes
 * and hand-off stack as ordinary content, each with its product state shown
 * complete. All product visuals are labelled samples and read-only.
 */
export function ChapterThreeHowItWorks() {
  const { sectionRef, choreographed, q, active, scrollToLayer } = useChapterScroll({
    scrollHeightSvh: timing.desktopScrollHeightSvh,
    starts,
  });

  // A keyboard user tabbing into a link in a scene that is not showing brings that scene on screen: plain scrolling.
  const onSceneFocus = useCallback(
    (layer: number) => {
      if (layerForegroundOpacity(q.get(), starts, layer, timing.crossfade) < 0.5) scrollToLayer(layer);
    },
    [q, scrollToLayer],
  );

  const introOpacity = useTransform(q, (value) => layerForegroundOpacity(value, starts, 0, timing.crossfade));
  const handoffOpacity = useTransform(q, (value) =>
    layerForegroundOpacity(value, starts, HANDOFF_LAYER, timing.crossfade),
  );
  const introPointer = useTransform(introOpacity, pointerFor);
  const handoffPointer = useTransform(handoffOpacity, pointerFor);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="chapter-three-heading"
      data-chapter="3"
      style={choreographed ? ({ height: `${timing.desktopScrollHeightSvh}svh` } as CSSProperties) : undefined}
      className="relative bg-mm-page"
    >
      {choreographed ? (
        <div className="sticky top-0 isolate h-svh overflow-hidden">
          <motion.div
            data-layer="intro"
            style={{ opacity: introOpacity, pointerEvents: introPointer }}
            className="absolute inset-0"
          >
            <IntroContent />
          </motion.div>

          <div className="absolute inset-0">
            <div className="mm-width grid h-full gap-14 pb-24 pt-[calc(var(--mm-header-h)+16px)] lg:grid-cols-12 lg:items-center">
              <div className="grid lg:col-span-5">
                {chapter3Scenes.map((scene, index) => (
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
                <ProductStage q={q} />
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

          {/* The navigator belongs to the four scenes: it leaves with the hand-off. */}
          {active < HANDOFF_LAYER && (
            <ChapterSceneProgress
              items={ITEMS}
              activeScene={active - LAYER_OFFSET}
              onSelect={(sceneIndex) => scrollToLayer(sceneIndex + LAYER_OFFSET)}
              ariaLabel={chapterThree.progressLabel}
            />
          )}
        </div>
      ) : (
        <div className="relative">
          <IntroContent />
          <div className="mm-width">
            {chapter3Scenes.map((scene) => (
              <JourneyScene key={scene.id} scene={scene} />
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
